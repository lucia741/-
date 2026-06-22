"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare, Tags } from "lucide-react";
import { api } from "@/lib/api/client";
import type { DashboardStats } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const cards = [
    { label: "笔记总数", value: stats.totalNotes, icon: BookOpen },
    { label: "本周新增", value: stats.notesThisWeek, icon: ArrowRight },
    { label: "标签数量", value: stats.totalTags, icon: Tags },
  ];

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">你的知识库概览</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近编辑</CardTitle>
            <CardDescription>最近更新的笔记</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">还没有笔记，去创建第一篇吧</p>
            ) : (
              stats.recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{note.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(note.updatedAt)}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((t) => (
                          <Badge key={t.id} variant="accent">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-gradient-to-br from-accent-soft to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              AI 知识库对话
            </CardTitle>
            <CardDescription>
              针对你的笔记提问、总结、检索——相当于和自己的知识库聊天
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button className="bg-accent hover:bg-violet-700">
                开始对话
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
