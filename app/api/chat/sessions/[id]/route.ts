import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import {
  deleteChatSession,
  getSessionMessages,
} from "@/lib/chat/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;
  const data = await getSessionMessages(auth.userId, id);
  if (!data) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;
  const ok = await deleteChatSession(auth.userId, id);
  if (!ok) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
