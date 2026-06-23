import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { isAiConfigured } from "@/lib/ai/config";
import {
  assertImportableFile,
  compileFileToNoteDraft,
} from "@/lib/ai/file-import";
import { readImportFileContent } from "@/lib/import/read-file";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI 未配置，请在 .env.local 中设置 DASHSCOPE_API_KEY" },
      { status: 503 }
    );
  }

  const { allowed } = await checkRateLimit(auth.userId, "chat");
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    assertImportableFile(entry);
    const instructionsEntry = formData.get("instructions");
    const instructions =
      typeof instructionsEntry === "string" ? instructionsEntry.trim() : "";
    if (!instructions) {
      return NextResponse.json(
        { error: "请先描述你想如何整理这份文件" },
        { status: 400 }
      );
    }
    if (instructions.length > 2000) {
      return NextResponse.json({ error: "整理需求过长" }, { status: 400 });
    }

    const rawText = await readImportFileContent(entry);
    const draft = await compileFileToNoteDraft(entry, rawText, instructions);

    return NextResponse.json({
      draft: { ...draft, sourceText: rawText },
    });
  } catch (error) {
    console.error("[chat/import]", error);
    const message =
      error instanceof Error && error.message.includes("json")
        ? "AI 整理失败，请稍后重试"
        : error instanceof Error
          ? error.message
          : "文件解析失败";
    const status =
      error instanceof Error &&
      ("statusCode" in error || error.message.includes("未配置"))
        ? 503
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
