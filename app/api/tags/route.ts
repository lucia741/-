import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { listTags } from "@/lib/notes/service";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const tags = await listTags(auth.userId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[tags/GET]", error);
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}
