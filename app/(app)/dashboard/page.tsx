"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Tag as TagIcon,
  CalendarPlus,
  ArrowRight,
  Plus,
} from "lucide-react";
import { dashboardApi, notesApi, type DashboardStats, type Note } from "@/lib/api";
import { useToast } from "@/components/toast";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius)",
          display: "grid",
          placeItems: "center",
          background: tone,
          color: "white",
          marginBottom: 14,
        }}
      >
        <Icon size={20} />
      </div>
      <div
        style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.get(), notesApi.list()])
      .then(([{ ...s }, { notes }]) => {
        setStats(s);
        setRecent(notes.slice(0, 5));
      })
      .catch((err) => {
        toast.push(err.message ?? "加载失败", "error");
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="center-loader"><span className="spinner" /></div>;
  if (!stats) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">概览</h1>
          <p className="page-subtitle">你的知识库一览</p>
        </div>
        <Link href="/notes/new" className="btn">
          <Plus size={16} /> 新建笔记
        </Link>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        <StatCard icon={FileText} label="笔记总数" value={stats.totalNotes} tone="var(--primary-600)" />
        <StatCard icon={CalendarPlus} label="本周新增" value={stats.notesThisWeek} tone="var(--accent-600)" />
        <StatCard icon={TagIcon} label="标签数量" value={stats.totalTags} tone="var(--warning-600)" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18 }}>最近笔记</h2>
        <Link href="/notes" style={{ color: "var(--primary)", fontSize: 14, fontWeight: 550, display: "inline-flex", alignItems: "center", gap: 4 }}>
          查看全部 <ArrowRight size={14} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><FileText size={28} /></div>
          <h3>还没有笔记</h3>
          <p>创建你的第一条笔记，开始构建智能知识库。</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {recent.map((note, i) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="card fade-up"
              style={{
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animationDelay: `${i * 40}ms`,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-strong)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {note.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  minHeight: 38,
                }}
              >
                {note.content || "（无正文）"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                {note.tags.slice(0, 3).map((t) => (
                  <span key={t.id} className="tag-pill">{t.name}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--neutral-400)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
