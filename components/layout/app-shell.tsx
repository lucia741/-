"use client";

import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children, user }: { children: React.ReactNode; user: { id: string; email: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
