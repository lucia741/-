"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, X, Tag as TagIcon } from "lucide-react";
import { notesApi, tagsApi, type Note, type Tag } from "@/lib/api";
import { useToast } from "@/components/toast";

function NoteCard({ note, index }: { note: Note; index: number }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="card fade-up"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 170,
        animationDelay: `${index * 30}ms`,
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-300)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "var(--text-strong)",
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {note.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          flex: 1,
        }}
      >
        {note.content || "（无正文）"}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {note.tags.length > 0 ? (
          note.tags.slice(0, 4).map((t) => (
            <span key={t.id} className="tag-pill">{t.name}</span>
          ))
        ) : (
          <span
            style={{
              fontSize: 12,
              color: "var(--neutral-400)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <TagIcon size={11} /> 无标签
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--neutral-400)",
          borderTop: "1px solid var(--border)",
          paddingTop: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>更新于 {new Date(note.updatedAt).toLocaleDateString("zh-CN")}</span>
      </div>
    </Link>
  );
}

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query.trim()), 280);
    return () => clearTimeout(id);
  }, [query]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: { q?: string; tag?: string } = {};
      if (debouncedQ) params.q = debouncedQ;
      if (activeTag) params.tag = activeTag;
      const { notes } = await notesApi.list(params);
      setNotes(notes);
    } catch (err) {
      const e = err as Error;
      toast.push(e.message ?? "加载笔记失败", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, activeTag, toast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    tagsApi.list().then(({ tags }) => setTags(tags)).catch(() => {});
  }, [notes]);

  const tagChips = useMemo(() => tags.slice(0, 12), [tags]);

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">笔记</h1>
          <p className="page-subtitle">{notes.length} 条笔记</p>
        </div>
        <Link href="/notes/new" className="btn">
          <Plus size={16} /> 新建笔记
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 420 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--neutral-400)",
            }}
          />
          <input
            className="input"
            placeholder="搜索标题或正文…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: query ? 36 : 13 }}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--neutral-400)",
                padding: 4,
              }}
              aria-label="清除搜索"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {tagChips.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <button
            className={`btn btn-sm ${activeTag === "" ? "" : "btn-secondary"}`}
            onClick={() => setActiveTag("")}
            style={activeTag === "" ? {} : { background: "transparent", color: "var(--text-soft)" }}
          >
            全部
          </button>
          {tagChips.map((t) => {
            const active = activeTag === t.name;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTag(active ? "" : t.name)}
                className="btn btn-sm"
                style={
                  active
                    ? {}
                    : {
                        background: "var(--surface)",
                        border: "1px solid var(--border-strong)",
                        color: "var(--text-soft)",
                      }
                }
              >
                {t.name}
                {typeof t.noteCount === "number" ? (
                  <span style={{ opacity: 0.6, marginLeft: 2 }}>
                    {t.noteCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="center-loader"><span className="spinner" /></div>
      ) : notes.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon"><FileText size={28} /></div>
          <h3>{debouncedQ || activeTag ? "没有匹配的笔记" : "还没有笔记"}</h3>
          <p>{debouncedQ || activeTag ? "试试其他关键词或标签筛选" : "创建你的第一条笔记，开始构建知识库。"}</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {notes.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
