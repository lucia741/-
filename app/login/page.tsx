"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/toast";
import { ApiError } from "@/lib/api/client";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.push("登录成功", "success");
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "登录失败";
      toast.push(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="登录" subtitle="欢迎回到你的智能知识库">
      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="email">
            邮箱
          </label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="至少 6 位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={submitting}
          style={{ width: "100%" }}
        >
          {submitting ? <span className="spinner" /> : null}
          登录
        </button>
      </form>
      <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", marginTop: 18 }}>
        还没有账号？{" "}
        <Link
          href="/register"
          style={{ color: "var(--primary)", fontWeight: 550 }}
        >
          立即注册
        </Link>
      </p>
    </AuthShell>
  );
}
