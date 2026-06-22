"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CitedNoteMeta } from "@/lib/types";

const strategyLabel: Record<string, string> = {
  vector: "语义检索",
  search: "关键词匹配",
  all: "全库兜底",
  empty: "无笔记",
};

export function CitedNotes({
  notes,
  strategy,
}: {
  notes: CitedNoteMeta[];
  strategy?: string | null;
}) {
  if (!notes.length) return null;

  return (
    <div className="mt-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">
        参考了 {notes.length} 篇笔记
        {strategy && strategyLabel[strategy]
          ? ` · ${strategyLabel[strategy]}`
          : ""}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 hover:bg-accent-soft hover:text-accent"
            >
              <BookOpen className="h-3 w-3" />
              {note.title}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
