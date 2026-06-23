"use client";

import { useEffect, useState } from "react";
import { X, FileText, Save, Sparkles } from "lucide-react";
import type { NoteDraftPreview } from "@/lib/api";

export function NoteImportPreview({
  draft,
  saving,
  refining,
  onClose,
  onSave,
  onRefine,
}: {
  draft: NoteDraftPreview;
  saving: boolean;
  refining: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    tags: string[];
  }) => void;
  onRefine: (data: {
    instruction: string;
    title: string;
    content: string;
    tags: string[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [tagsText, setTagsText] = useState(draft.tags.join(", "));
  const [refineInput, setRefineInput] = useState("");

  useEffect(() => {
    setTitle(draft.title);
    setContent(draft.content);
    setTagsText(draft.tags.join(", "));
  }, [
    draft.title,
    draft.content,
    draft.tags.join("|"),
    draft.summary,
    draft.userInstruction,
  ]);

  function parseTags() {
    return tagsText
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleRefine() {
    const instruction = refineInput.trim();
    if (!instruction || refining) return;
    await onRefine({
      instruction,
      title: title.trim(),
      content,
      tags: parseTags(),
    });
    setRefineInput("");
  }

  return (
    <div className="import-overlay" onClick={onClose}>
      <div
        className="import-modal card fade-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="import-title"
      >
        <div className="import-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="import-icon">
              <FileText size={18} />
            </span>
            <div>
              <h3 id="import-title" style={{ fontSize: 17, margin: 0 }}>
                笔记预览
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                来自 {draft.sourceFileName}
                {draft.userInstruction
                  ? ` · 按「${draft.userInstruction.slice(0, 40)}${draft.userInstruction.length > 40 ? "…" : ""}」整理`
                  : " · 可手动编辑或继续让 AI 修改"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {draft.summary ? (
          <p className="import-summary">{draft.summary}</p>
        ) : null}

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="import-title-input">
            标题
          </label>
          <input
            id="import-title-input"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={refining}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="import-tags">
            标签（逗号分隔）
          </label>
          <input
            id="import-tags"
            className="input"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="学习, 项目, 总结"
            disabled={refining}
          />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="import-content">
            正文（可直接编辑）
          </label>
          <textarea
            id="import-content"
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={refining}
            style={{ minHeight: 220, fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
        </div>

        <div className="import-refine-section">
          <label className="label" htmlFor="import-refine-input">
            继续让 AI 修改
          </label>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>
            会基于当前预览内容（含你的手动修改）按新需求重新生成
          </p>
          <textarea
            id="import-refine-input"
            className="textarea"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            placeholder="例如：改成纯文本、去掉 # 和 * 符号、删除 AI 套话…"
            disabled={refining}
            rows={2}
            style={{ minHeight: 64, marginBottom: 10 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handleRefine();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={refining || !refineInput.trim()}
            onClick={() => void handleRefine()}
          >
            {refining ? <span className="spinner" /> : <Sparkles size={14} />}
            AI 重新生成
          </button>
        </div>

        <div className="import-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn"
            disabled={saving || refining || !title.trim()}
            onClick={() =>
              onSave({
                title: title.trim(),
                content,
                tags: parseTags(),
              })
            }
          >
            {saving ? <span className="spinner" /> : <Save size={15} />}
            保存为笔记
          </button>
        </div>
      </div>
    </div>
  );
}
