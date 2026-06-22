import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_PAGE = "/login";
const PUBLIC_API = ["/api/auth/login", "/api/auth/register"];

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await isAuthenticated(request);

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!authed) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!authed && pathname !== PUBLIC_PAGE) {
    const login = new URL(PUBLIC_PAGE, request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (authed && pathname === PUBLIC_PAGE) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
