"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Note, Tag } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tags().then(({ tags }) => setTags(tags)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.notes
      .list({ q: query || undefined, tag: activeTag ?? undefined })
      .then(({ notes }) => setNotes(notes))
      .finally(() => setLoading(false));
  }, [query, activeTag]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">我的笔记</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length} 篇笔记
          </p>
        </div>
        <Link href="/notes/new">
          <Button>
            <Plus className="h-4 w-4" />
            新建笔记
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索标题或内容…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTag === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setActiveTag(tag.name)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTag === tag.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tag.name}
              {tag.noteCount !== undefined && ` (${tag.noteCount})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">没有找到笔记</p>
            <Link href="/notes/new" className="mt-4">
              <Button variant="outline">创建第一篇笔记</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-medium">{note.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {note.content || "暂无正文"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.updatedAt)}
                        </span>
                        {note.tags.map((t) => (
                          <Badge key={t.id} variant="accent">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
