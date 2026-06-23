import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { isAiConfigured } from "@/lib/ai/config";
import { refineNoteDraft } from "@/lib/ai/draft-refine";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const bodySchema = z.object({
  instruction: z.string().min(1, "请输入修改需求").max(2000),
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()).max(10),
  summary: z.string().optional(),
  sourceFileName: z.string().optional(),
  sourceFileSize: z.number().optional(),
  sourceText: z.string().max(30000).optional(),
  userInstruction: z.string().optional(),
});

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
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.instruction?.[0] ?? "参数错误";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const data = parsed.data;
    const refined = await refineNoteDraft({
      title: data.title,
      content: data.content,
      tags: data.tags,
      summary: data.summary ?? "",
      instruction: data.instruction,
      sourceText: data.sourceText,
      sourceFileName: data.sourceFileName,
      priorInstruction: data.userInstruction,
    });

    return NextResponse.json({
      draft: {
        title: refined.title,
        content: refined.content,
        tags: refined.tags,
        summary: refined.summary,
        userInstruction: refined.userInstruction,
        sourceFileName: data.sourceFileName ?? "笔记草稿",
        sourceFileSize: data.sourceFileSize ?? 0,
        sourceText: data.sourceText,
      },
    });
  } catch (error) {
    console.error("[chat/draft/refine]", error);
    const message =
      error instanceof Error ? error.message : "AI 修改失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
