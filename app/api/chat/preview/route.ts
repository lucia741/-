import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { retrieveNotesForQuestion } from "@/lib/ai/context";
import { isAiConfigured, AI_CONFIG } from "@/lib/ai/config";

/** 预览本次问题会检索到哪些笔记（不调用 AI，方便调试 RAG） */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ error: "请提供 q 参数" }, { status: 400 });
  }

  const { notes, strategy } = await retrieveNotesForQuestion(auth.userId, q);

  return NextResponse.json({
    strategy,
    count: notes.length,
    model: AI_CONFIG.model,
    aiConfigured: isAiConfigured(),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      tags: n.tags.map((t) => t.name),
      updatedAt: n.updatedAt,
      preview: n.content.slice(0, 120),
    })),
  });
}
