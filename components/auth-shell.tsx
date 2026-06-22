"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const features = [
  { title: "向量语义检索", desc: "基于 pgvector，自动从你的笔记中找到相关内容" },
  { title: "流式 AI 对话", desc: "通义千问模型，基于知识库实时回答" },
  { title: "标签与搜索", desc: "结构化整理笔记，多维度快速定位" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        background: "var(--bg)",
      }}
    >
      <section
        style={{
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, var(--neutral-900) 0%, var(--primary-800) 60%, var(--accent-700) 120%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            智
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
            智记 ZhiNote
          </span>
        </div>
        <h1
          style={{
            color: "white",
            fontSize: 36,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            marginBottom: 16,
            maxWidth: 420,
          }}
        >
          让你的笔记
          <br />
          成为可对话的知识库
        </h1>
        <p style={{ opacity: 0.85, maxWidth: 400, marginBottom: 40, fontSize: 15 }}>
          基于向量检索与通义千问大模型，把你零散的笔记变成能即时回答问题的智能助手。
        </p>
        <ul style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 420 }}>
          {features.map((f) => (
            <li key={f.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Sparkles size={18} style={{ marginTop: 2, opacity: 0.9 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                <div style={{ opacity: 0.7, fontSize: 13 }}>{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 36,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>{title}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
            {subtitle}
          </p>
          {children}
        </div>
      </section>

      <style>{`
        @media (max-width: 880px) {
          main { grid-template-columns: 1fr !important; }
          main > section:first-child { display: none !important; }
        }
      `}</style>
    </main>
  );
}
