"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/toast";
import { ApiError } from "@/lib/api/client";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading } = useAuth();
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
      await register(email, password);
      toast.push("注册成功，已自动登录", "success");
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "注册失败";
      toast.push(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="创建账号" subtitle="开始构建你的智能笔记知识库">
      <form onSubmit={onSubmit} className="auth-form">
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
        <label className="label auth-label-password" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          className="input"
          type="password"
          placeholder="至少 6 位"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button
          className="btn auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? <span className="spinner" /> : null}
          注册并登录
        </button>
      </form>
      <p className="auth-alt">
        已有账号？
        <Link href="/login" className="auth-alt-link">
          返回登录
        </Link>
      </p>
    </AuthShell>
  );
}
