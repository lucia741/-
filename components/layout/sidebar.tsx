"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PenLine,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { User } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/notes", label: "我的笔记", icon: BookOpen },
  { href: "/chat", label: "AI 对话", icon: MessageSquare },
];

function NavContent({
  user,
  pathname,
  onNavigate,
}: {
  user: User;
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    await api.auth.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">智记</p>
          <p className="text-xs text-muted-foreground">ZhiNote</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <Link href="/notes/new" onClick={onNavigate}>
          <Button className="w-full" size="sm">
            <PenLine className="h-4 w-4" />
            新建笔记
          </Button>
        </Link>
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="truncate text-xs font-medium">{user.email}</p>
          <p className="text-[11px] text-muted-foreground">已登录</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </>
  );
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold">智记</span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="关闭菜单"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-card shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <NavContent
              user={user}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <NavContent user={user} pathname={pathname} />
      </aside>
    </>
  );
}
