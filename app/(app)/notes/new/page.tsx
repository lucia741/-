"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notesApi } from "@/lib/api";
import { useToast } from "@/components/toast";
import { ApiError } from "@/lib/api/client";
import { NoteEditor } from "@/components/note-editor";

export default function NewNotePage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

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
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">新建笔记</h1>
          <p className="page-subtitle">记录新知识，AI 会自动建立向量索引</p>
        </div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <NoteEditor
          submitting={submitting}
          onSubmit={async (data) => {
            setSubmitting(true);
            try {
              const { note } = await notesApi.create({
                title: data.title,
                content: data.content,
                tags: data.tagNames,
              });
              toast.push("笔记已创建", "success");
              router.push(`/notes/${note.id}`);
            } catch (err) {
              const msg = err instanceof ApiError ? err.message : "保存失败";
              toast.push(msg, "error");
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}
