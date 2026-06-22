"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  FileText,
  Clock,
  Tag as TagIcon,
} from "lucide-react";
import { notesApi, type Note } from "@/lib/api";
import { useToast } from "@/components/toast";
import { ApiError } from "@/lib/api/client";
import { NoteEditor } from "@/components/note-editor";

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { note } = await notesApi.get(id);
      setNote(note);
    } catch (err) {
      const e = err as Error;
      toast.push(e.message ?? "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="center-loader"><span className="spinner" /></div>;
  if (!note) {
    return (
      <div className="page" style={{ maxWidth: 820 }}>
        <div className="card empty">
          <h3>笔记不存在</h3>
          <p>该笔记可能已被删除或你没有访问权限。</p>
          <Link href="/notes" className="btn" style={{ marginTop: 16 }}>
            返回笔记列表
          </Link>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="page" style={{ maxWidth: 820 }}>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setEditing(false);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          <ArrowLeft size={15} /> 取消编辑
        </Link>
        <div className="page-header" style={{ marginBottom: 24 }}>
          <h1 className="page-title">编辑笔记</h1>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <NoteEditor
            initial={{
              title: note.title,
              content: note.content,
              tags: note.tags,
            }}
            submitting={submitting}
            onSubmit={async (data) => {
              setSubmitting(true);
              try {
                const { note: updated } = await notesApi.update(id, {
                  title: data.title,
                  content: data.content,
                  tags: data.tagNames,
                });
                setNote(updated);
                setEditing(false);
                toast.push("已保存", "success");
              } catch (err) {
                const msg = err instanceof ApiError ? err.message : "保存失败";
                toast.push(msg, "error");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  function formatDate(s: string) {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <Link
        href="/notes"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-muted)",
          fontSize: 14,
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={15} /> 返回笔记列表
      </Link>

      <div
        className="card"
        style={{
          padding: "32px 36px",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <h1
            style={{
              fontSize: 26,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            {note.title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 13,
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Clock size={13} /> 更新于 {formatDate(note.updatedAt)}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Clock size={13} /> 创建于 {formatDate(note.createdAt)}
            </span>
          </div>
        </div>

        {note.tags.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {note.tags.map((t) => (
              <span key={t.id} className="tag-pill">
                <TagIcon size={11} /> {t.name}
              </span>
            ))}
          </div>
        ) : null}

        <div
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 15,
            lineHeight: 1.8,
            color: "var(--text)",
            minHeight: note.content ? "auto" : 80,
          }}
        >
          {note.content || (
            <span style={{ color: "var(--neutral-400)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} /> 这条笔记还没有正文内容
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          justifyContent: "flex-end",
        }}
      >
        <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
          <Trash2 size={16} /> 删除
        </button>
        <button className="btn btn-secondary" onClick={() => setEditing(true)}>
          <Pencil size={16} /> 编辑
        </button>
      </div>

      {confirmingDelete ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgb(15 23 42 / 0.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 24,
          }}
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="card fade-up"
            style={{ padding: 28, maxWidth: 380, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-full)",
                  background: "var(--error-50)",
                  color: "var(--error-600)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Trash2 size={18} />
              </span>
              <h3 style={{ fontSize: 17 }}>删除这条笔记？</h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 22 }}>
              此操作不可撤销，关联的向量索引也会一并清理。
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                <X size={15} /> 取消
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await notesApi.delete(id);
                    toast.push("笔记已删除", "success");
                    router.push("/notes");
                  } catch (err) {
                    const e = err as Error;
                    toast.push(e.message ?? "删除失败", "error");
                  }
                }}
              >
                <Save size={15} /> 确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
