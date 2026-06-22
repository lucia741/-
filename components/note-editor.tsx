"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { Note } from "@/lib/api";

export function NoteEditor({
  initial,
  submitting,
  onSubmit,
}: {
  initial?: Pick<Note, "title" | "content" | "tags">;
  submitting: boolean;
  onSubmit: (data: {
    title: string;
    content: string;
    tagNames: string[];
  }) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const name = tagInput.trim();
    if (!name || tags.includes(name)) {
      setTagInput("");
      return;
    }
    setTags([...tags, name]);
    setTagInput("");
  }

  function removeTag(name: string) {
    setTags(tags.filter((t) => t !== name));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title: title.trim(), content, tagNames: tags });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 22 }}
    >
      <div className="field" style={{ marginBottom: 0 }}>
        <input
          className="input"
          placeholder="笔记标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
          style={{
            fontSize: 22,
            fontWeight: 650,
            padding: "12px 14px",
            border: "1px solid var(--border)",
            letterSpacing: "-0.01em",
          }}
        />
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label">标签</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: 8,
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface)",
            alignItems: "center",
          }}
        >
          {tags.map((name) => (
            <span
              key={name}
              className="tag-pill"
              style={{ cursor: "default" }}
            >
              {name}
              <button
                type="button"
                onClick={() => removeTag(name)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  color: "var(--primary-text)",
                  opacity: 0.7,
                }}
                aria-label={`移除 ${name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            placeholder={tags.length === 0 ? "输入标签后回车" : "添加标签…"}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                setTags(tags.slice(0, -1));
              }
            }}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              minWidth: 120,
              padding: "4px 6px",
              fontSize: 14,
            }}
          />
          {tagInput.trim() ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>
              <Plus size={13} /> 添加
            </button>
          ) : null}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <label className="label">正文</label>
        <textarea
          className="textarea"
          placeholder="开始记录你的想法…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            minHeight: 360,
            fontSize: 15,
            lineHeight: 1.7,
            flex: 1,
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
        <button className="btn" type="submit" disabled={submitting || !title.trim()}>
          {submitting ? <span className="spinner" /> : null}
          保存
        </button>
      </div>
    </form>
  );
}
