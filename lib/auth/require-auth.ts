import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";

export async function requireAuth(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return session;
}

export function isAuthError(
  result: SessionPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
