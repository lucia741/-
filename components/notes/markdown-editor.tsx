"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "支持 Markdown 语法…",
  minHeight = "320px",
}: Props) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Markdown</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "write" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("write")}
          >
            <PenLine className="h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3.5 w-3.5" />
            预览
          </Button>
        </div>
      </div>

      {mode === "write" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("min-h-[320px] resize-y rounded-none border-0 shadow-none focus-visible:ring-0")}
          style={{ minHeight }}
        />
      ) : (
        <div
          className="prose prose-zinc max-w-none px-4 py-3 text-sm"
          style={{ minHeight }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">暂无内容</p>
          )}
        </div>
      )}
    </div>
  );
}
