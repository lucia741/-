"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CitedNotes } from "@/components/chat/cited-notes";
import { cn } from "@/lib/utils";
import type {
  ChatMessageRecord,
  ChatSessionSummary,
  CitedNoteMeta,
} from "@/lib/types";

const suggestions = [
  "总结一下我最近的笔记",
  "我关于项目管理的笔记讲了什么？",
  "帮我找出和学习相关的笔记",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [citations, setCitations] = useState<
    Record<string, { notes: CitedNoteMeta[]; strategy?: string }>
  >({});

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/chat/sessions", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions);
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/sessions/${id}`, {
      credentials: "include",
    });
    if (!res.ok) return;

    const data = await res.json();
    const msgs = data.messages as ChatMessageRecord[];
    const uiMessages = msgs.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    }));

    setMessages(uiMessages);

    const cites: typeof citations = {};
    for (const m of msgs) {
      if (m.role === "assistant" && m.citedNotes?.length) {
        cites[m.id] = {
          notes: m.citedNotes,
          strategy: m.retrievalStrategy ?? undefined,
        };
      }
    }
    setCitations(cites);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ sessionId }),
      }),
    [sessionId]
  );

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      if (sessionId) loadSession(sessionId);
      loadSessions();
    },
  });

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
    else setMessages([]);
  }, [sessionId, loadSession, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  async function handleNewSession() {
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const { session } = await res.json();
      setSessionId(session.id);
      setMessages([]);
      setCitations({});
      loadSessions();
    }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm("删除此对话？")) return;
    await fetch(`/api/chat/sessions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (sessionId === id) {
      setSessionId(null);
      setMessages([]);
      setCitations({});
    }
    loadSessions();
  }

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return;

    let sid = sessionId;
    if (!sid) {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        credentials: "include",
      });
      const { session } = await res.json();
      sid = session.id;
      setSessionId(sid);
    }

    const preview = await fetch(
      `/api/chat/preview?q=${encodeURIComponent(text)}`,
      { credentials: "include" }
    );
    let pendingCite: { notes: CitedNoteMeta[]; strategy?: string } | null =
      null;
    if (preview.ok) {
      const data = await preview.json();
      pendingCite = {
        notes: data.notes.map(
          (n: { id: string; title: string; tags: string[] }) => ({
            id: n.id,
            title: n.title,
            tags: n.tags,
          })
        ),
        strategy: data.strategy,
      };
    }

    sendMessage({ text });

    if (pendingCite) {
      setTimeout(() => {
        setCitations((prev) => {
          const lastAssistant = [...messages]
            .reverse()
            .find((m) => m.role === "assistant");
          if (lastAssistant) {
            return { ...prev, [lastAssistant.id]: pendingCite! };
          }
          return prev;
        });
      }, 500);
    }

    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh)]">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleNewSession}
          >
            <MessageSquarePlus className="h-4 w-4" />
            新对话
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group mb-1 flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors",
                sessionId === s.id
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60 text-muted-foreground"
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => setSessionId(s.id)}
              >
                {s.title}
              </button>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteSession(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold tracking-tight">AI 知识库对话</h1>
              <p className="text-sm text-muted-foreground">
                基于笔记语义检索 + 通义千问
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={handleNewSession}
            >
              新对话
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Bot className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium">和你的知识库聊聊</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  向量语义检索你的笔记，再生成回答
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";
              const text = message.parts
                .filter((p) => p.type === "text")
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const cite = citations[message.id];

              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className="max-w-[85%]">
                    <Card
                      className={cn(
                        "px-4 py-3 shadow-sm",
                        isUser
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {text}
                      </p>
                    </Card>
                    {!isUser && cite && (
                      <CitedNotes notes={cite.notes} strategy={cite.strategy} />
                    )}
                  </div>
                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                向量检索笔记并生成回答…
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error.message || "对话失败，请检查 AI 配置"}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card px-4 py-4 md:px-8">
          <form
            className="mx-auto flex max-w-3xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="问我关于你笔记的任何问题…"
              className="min-h-[52px] max-h-32 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 bg-accent hover:bg-violet-700"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
