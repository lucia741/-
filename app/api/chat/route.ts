import { after } from "next/server";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { retrieveNotesForQuestion } from "@/lib/ai/context";
import { AI_CONFIG, isAiConfigured } from "@/lib/ai/config";
import { getAiModel } from "@/lib/ai/model";
import { getLastUserText } from "@/lib/ai/messages";
import {
  buildMessages,
  buildSystemPrompt,
  formatNotesForPrompt,
} from "@/lib/ai/prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ensureChatSession,
  saveChatMessage,
  toCitedNoteMeta,
} from "@/lib/chat/service";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

const bodySchema = z
  .object({
    messages: z.array(z.unknown()).optional(),
    message: z.string().optional(),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })
      )
      .optional(),
    sessionId: z.string().uuid().nullish(),
    id: z.string().optional(),
    trigger: z.string().optional(),
    messageId: z.string().optional(),
  })
  .passthrough();

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI 未配置，请在 .env.local 中设置 DASHSCOPE_API_KEY" },
      { status: 503 }
    );
  }

  const { allowed, remaining } = await checkRateLimit(auth.userId, "chat");
  if (!allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      console.error("[chat/POST] validation:", parsed.error.flatten());
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    let question: string;
    let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;
    const sessionIdInput = parsed.data.sessionId ?? undefined;

    if (Array.isArray(body.messages)) {
      const messages = body.messages as UIMessage[];
      question = getLastUserText(messages);
      if (!question) {
        return NextResponse.json({ error: "请输入问题" }, { status: 400 });
      }
      modelMessages = await convertToModelMessages(messages);
    } else if (parsed.data.message) {
      question = parsed.data.message;
      modelMessages = buildMessages(question, parsed.data.history);
    } else {
      return NextResponse.json({ error: "请输入问题" }, { status: 400 });
    }

    const session = await ensureChatSession(
      auth.userId,
      sessionIdInput,
      question
    );

    if (session.title === "新对话" && question) {
      await db
        .update(chatSessions)
        .set({ title: question.slice(0, 30) })
        .where(eq(chatSessions.id, session.id));
    }

    await saveChatMessage(session.id, { role: "user", content: question });

    const { notes, strategy } = await retrieveNotesForQuestion(
      auth.userId,
      question
    );
    const citedNotes = toCitedNoteMeta(notes);

    const notesContext = formatNotesForPrompt(notes);
    const system = buildSystemPrompt(notesContext);

    const result = streamText({
      model: getAiModel(),
      system,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (!text) return;
        after(async () => {
          await saveChatMessage(session.id, {
            role: "assistant",
            content: text,
            citedNotes,
            retrievalStrategy: strategy,
          });
        });
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-ZhiNote-Session-Id": session.id,
        "X-ZhiNote-Notes-Count": String(notes.length),
        "X-ZhiNote-Retrieval": strategy,
        "X-ZhiNote-Model": AI_CONFIG.model,
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("[chat/POST]", error);
    return NextResponse.json({ error: "AI 对话失败" }, { status: 500 });
  }
}
