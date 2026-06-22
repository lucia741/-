"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, NotebookPen, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "概览", icon: LayoutDashboard },
    { href: "/notes", label: "笔记", icon: NotebookPen },
    { href: "/chat", label: "AI 对话", icon: MessageSquare },
  ].map((item) => ({ ...item, active: pathname.startsWith(item.href) }));

  return (
    <header className="app-header">
      <Link href="/dashboard" className="app-brand">
        <span className="brand-mark">智</span>
        <span>智记</span>
      </Link>
      <nav className="app-nav">
        {navItems.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} />
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="spacer" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--surface-2)",
            display: "grid",
            placeItems: "center",
            color: "var(--text-soft)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {user?.email?.[0]?.toUpperCase() ?? "?"}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={logout}
          title="退出登录"
          aria-label="退出登录"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
