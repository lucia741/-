"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Search,
  MessageSquare,
  Tags,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";

type Feature = {
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
  glow: string;
};

const features: Feature[] = [
  {
    icon: <BookOpen size={26} strokeWidth={1.8} />,
    title: "智能知识库",
    desc: "把零散笔记自动整理为可检索、可对话的结构化知识。",
    accent: "rgba(96, 165, 250, 0.95)",
    glow: "rgba(96, 165, 250, 0.35)",
  },
  {
    icon: <Search size={26} strokeWidth={1.8} />,
    title: "向量语义检索",
    desc: "基于 pgvector，按语义而非关键词找到相关内容。",
    accent: "rgba(52, 211, 153, 0.95)",
    glow: "rgba(52, 211, 153, 0.35)",
  },
  {
    icon: <MessageSquare size={26} strokeWidth={1.8} />,
    title: "流式 AI 对话",
    desc: "通义千问模型，基于你的知识库实时给出回答。",
    accent: "rgba(129, 140, 248, 0.95)",
    glow: "rgba(129, 140, 248, 0.35)",
  },
  {
    icon: <Tags size={26} strokeWidth={1.8} />,
    title: "标签与多维搜索",
    desc: "结构化整理笔记，多维度快速定位相关内容。",
    accent: "rgba(244, 114, 182, 0.95)",
    glow: "rgba(244, 114, 182, 0.35)",
  },
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
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = () => setActive((i) => (i + 1) % features.length);
  const prev = () => setActive((i) => (i - 1 + features.length) % features.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const jump = (i: number) => {
    setActive(i);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 4500);
  };

  return (
    <main className="auth-shell">
      {/* Left: feature carousel */}
      <section className="auth-feature" aria-label="功能介绍">
        <div className="auth-feature-bg" aria-hidden />
        <div className="auth-feature-orb auth-feature-orb-1" aria-hidden />
        <div className="auth-feature-orb auth-feature-orb-2" aria-hidden />

        <header className="auth-brand">
          <span className="auth-brand-mark">智</span>
          <span className="auth-brand-name">智记 ZhiNote</span>
        </header>

        <div className="auth-carousel">
          {features.map((f, i) => (
            <article
              key={f.title}
              className={`auth-slide ${i === active ? "is-active" : ""}`}
              aria-hidden={i !== active}
            >
              <span
                className="auth-slide-icon"
                style={{
                  color: f.accent,
                  background: f.glow,
                  boxShadow: `0 8px 32px ${f.glow}`,
                }}
              >
                {f.icon}
              </span>
              <h2 className="auth-slide-title">{f.title}</h2>
              <p className="auth-slide-desc">{f.desc}</p>
            </article>
          ))}
        </div>

        <div className="auth-slide-nav">
          <button
            type="button"
            className="auth-nav-btn"
            onClick={prev}
            aria-label="上一个"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="auth-dots">
            {features.map((f, i) => (
              <button
                key={f.title}
                type="button"
                className={`auth-dot ${i === active ? "is-active" : ""}`}
                onClick={() => jump(i)}
                aria-label={`切换到 ${f.title}`}
              >
                <span
                  className="auth-dot-fill"
                  style={{ background: f.accent }}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="auth-nav-btn"
            onClick={next}
            aria-label="下一个"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <footer className="auth-feature-foot">
          <Sparkles size={14} />
          <span>基于 pgvector 与通义千问大模型</span>
        </footer>
      </section>

      {/* Right: form */}
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <h2 className="auth-form-title">{title}</h2>
          <p className="auth-form-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          background: var(--bg);
          overflow: hidden;
        }

        /* Feature carousel */
        .auth-feature {
          position: relative;
          padding: 56px 64px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          overflow: hidden;
          isolation: isolate;
        }
        .auth-feature-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #065f46 120%);
          z-index: -3;
        }
        .auth-feature-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.18), transparent 45%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.16), transparent 45%);
          animation: featureShift 16s ease-in-out infinite alternate;
        }
        @keyframes featureShift {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          100% { transform: translate3d(2%, -2%, 0) scale(1.06); }
        }
        .auth-feature-orb {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          z-index: -2;
          pointer-events: none;
        }
        .auth-feature-orb-1 {
          background: #3b82f6;
          top: -120px;
          right: -80px;
          animation: orbFloat1 14s ease-in-out infinite;
        }
        .auth-feature-orb-2 {
          background: #10b981;
          bottom: -140px;
          left: -100px;
          animation: orbFloat2 18s ease-in-out infinite;
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, 30px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, -40px); }
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
          animation: fadeUp 0.6s ease both;
        }
        .auth-brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 20px;
          font-weight: 700;
        }
        .auth-brand-name {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        /* Carousel slides */
        .auth-carousel {
          position: relative;
          min-height: 260px;
          z-index: 2;
        }
        .auth-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          max-width: 440px;
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .auth-slide.is-active {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }
        .auth-slide.is-active .auth-slide-icon {
          animation: iconPop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes iconPop {
          0% { transform: scale(0.6) rotate(-12deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(4deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .auth-slide-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .auth-slide-title {
          color: white;
          font-size: 30px;
          font-weight: 650;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .auth-slide-desc {
          color: rgba(255, 255, 255, 0.82);
          font-size: 15.5px;
          line-height: 1.65;
          max-width: 420px;
        }

        /* Navigation */
        .auth-slide-nav {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 24px;
        }
        .auth-nav-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: white;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, border-color 0.2s;
        }
        .auth-nav-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          transform: scale(1.05);
        }
        .auth-nav-btn:active { transform: scale(0.95); }

        .auth-dots {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }
        .auth-dot {
          position: relative;
          width: 28px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          border: none;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          transition: width 0.35s ease, background 0.2s;
        }
        .auth-dot.is-active {
          width: 44px;
          background: rgba(255, 255, 255, 0.3);
        }
        .auth-dot-fill {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          transform: scaleX(0);
        }
        .auth-dot.is-active .auth-dot-fill {
          animation: dotFill 4.5s linear both;
        }
        @keyframes dotFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .auth-feature-foot {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12.5px;
        }

        /* Form panel */
        .auth-form-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
        }
        .auth-form-wrap::before {
          content: "";
          position: absolute;
          width: 460px;
          height: 460px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--primary-50), transparent 70%);
          opacity: 0.6;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .auth-form-card {
          position: relative;
          width: 100%;
          max-width: 400px;
          padding: 40px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg), 0 1px 2px rgb(15 23 42 / 0.04);
          animation: fadeUp 0.55s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .auth-form-title {
          font-size: 24px;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        .auth-form-subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 30px;
        }

        /* Mobile enhancements */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 880px) {
          .auth-shell { grid-template-columns: 1fr; }
          .auth-feature {
            padding: 36px 28px 28px;
            min-height: auto;
            gap: 28px;
          }
          .auth-carousel { min-height: 180px; }
          .auth-slide-title { font-size: 24px; }
          .auth-slide-desc { font-size: 14px; }
          .auth-slide-icon { width: 52px; height: 52px; }
          .auth-feature-orb { width: 260px; height: 260px; filter: blur(60px); }
          .auth-feature-foot { display: none; }
          .auth-form-wrap { padding: 28px 20px 48px; }
        }

        @media (max-width: 480px) {
          .auth-feature { padding: 28px 20px 24px; }
          .auth-form-card { padding: 28px 22px; }
          .auth-dots { gap: 6px; }
          .auth-dot { width: 22px; }
          .auth-dot.is-active { width: 34px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-feature-bg::after,
          .auth-feature-orb-1,
          .auth-feature-orb-2 { animation: none; }
          .auth-dot.is-active .auth-dot-fill { animation: none; transform: scaleX(1); }
          .auth-slide { transition: opacity 0.2s; transform: none; }
          .auth-slide:not(.is-active) { transform: none; }
        }
      `}</style>
    </main>
  );
}
