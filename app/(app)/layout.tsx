"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="center-loader" style={{ height: "100vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-content">{children}</main>
    </div>
  );
}
