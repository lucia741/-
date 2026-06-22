import { NextResponse } from "next/server";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { getDashboardStats } from "@/lib/notes/service";

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const stats = await getDashboardStats(auth.userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[dashboard/GET]", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
