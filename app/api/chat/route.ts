import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { retrieveNotesForQuestion } from "@/lib/ai/context";
import { AI_CONFIG, isAiConfigured } from "@/lib/ai/config";
import {
  buildMessages,
  buildSystemPrompt,
  formatNotesForPrompt,
} from "@/lib/ai/prompt";

const chatSchema = z.object({
  message: z.string().min(1, "请输入问题").max(2000, "问题过长"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI 未配置，请在 .env.local 中设置 AI_GATEWAY_API_KEY" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      );
    }

    const { message, history } = parsed.data;

    const { notes, strategy } = await retrieveNotesForQuestion(
      auth.userId,
      message
    );

    const notesContext = formatNotesForPrompt(notes);
    const system = buildSystemPrompt(notesContext);
    const messages = buildMessages(message, history);

    const result = streamText({
      model: AI_CONFIG.model,
      system,
      messages,
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-ZhiNote-Notes-Count": String(notes.length),
        "X-ZhiNote-Retrieval": strategy,
      },
    });
  } catch (error) {
    console.error("[chat/POST]", error);
    return NextResponse.json({ error: "AI 对话失败" }, { status: 500 });
  }
}
