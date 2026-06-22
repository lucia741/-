import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import {
  createChatSession,
  deleteChatSession,
  getSessionMessages,
  listChatSessions,
} from "@/lib/chat/service";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const sessions = await listChatSessions(auth.userId);
  return NextResponse.json({ sessions });
}

export async function POST() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const session = await createChatSession(auth.userId);
  return NextResponse.json({ session }, { status: 201 });
}
