"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  FileText,
  PanelLeft,
  X,
  RefreshCw,
} from "lucide-react";
import { chatApi, type ChatSessionSummary, type ChatSessionDetail } from "@/lib/api";
import { useToast } from "@/components/toast";

const STORAGE_KEY = "zhinote:active-chat-session";

export default function ChatPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meta, setMeta] = useState<{
    notesCount?: number;
    retrieval?: string;
    model?: string;
    remaining?: number;
  }>({});
  const historyRef = useRef<(() => Promise<void>) | null>(null);

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
      body: () => ({ sessionId: activeId ?? undefined }),
      fetch: wrapFetch((res) => {
        const sid = res.headers.get("X-ZhiNote-Session-Id");
        if (sid && sid !== activeId) {
          setActiveId(sid);
          try {
            localStorage.setItem(STORAGE_KEY, sid);
          } catch {
            /* ignore */
          }
        }
        setMeta({
          notesCount: Number(res.headers.get("X-ZhiNote-Notes-Count") ?? ""),
          retrieval: res.headers.get("X-ZhiNote-Retrieval") ?? undefined,
          model: res.headers.get("X-ZhiNote-Model") ?? undefined,
          remaining: Number(res.headers.get("X-RateLimit-Remaining") ?? ""),
        });
      }),
    }),
    onError: (err) => {
      toast.push(err.message ?? "对话失败", "error");
    },
  });

  const [input, setInput] = useState("");
  const isStreaming = status === "submitted" || status === "streaming";

  function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    void sendMessage({ text: trimmed });
  }

  function wrapFetch(onResponse: (res: Response) => void): typeof fetch {
    return (input, init) =>
      fetch(input, init).then((res) => {
        try {
          onResponse(res.clone());
        } catch {
          /* ignore */
        }
        return res;
      });
  }

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const { sessions } = await chatApi.listSessions();
      setSessions(sessions);
    } catch (err) {
      const e = err as Error;
      toast.push(e.message ?? "加载对话列表失败", "error");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActiveId(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  historyRef.current = async () => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await chatApi.getSession(activeId);
      if (data) {
        setSessions((prev) => {
          const exists = prev.find((s) => s.id === activeId);
          if (exists) {
            return prev.map((s) =>
              s.id === activeId
                ? { ...s, title: data.session.title, updatedAt: data.session.updatedAt }
                : s
            );
          }
          return [
            {
              id: data.session.id,
              title: data.session.title,
              updatedAt: data.session.updatedAt,
            },
            ...prev,
          ];
        });
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            parts: [{ type: "text" as const, text: m.content }],
            citedNotes: m.citedNotes ?? undefined,
            retrievalStrategy: m.retrievalStrategy ?? undefined,
          }))
        );
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    historyRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setMeta({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSidebarOpen(false);
  }

  async function selectSession(id: string) {
    setActiveId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setSidebarOpen(false);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeId) newConversation();
      toast.push("对话已删除", "success");
    } catch (err) {
      const er = err as Error;
      toast.push(er.message ?? "删除失败", "error");
    }
  }

  const groupedSessions = useMemo(() => groupSessions(sessions), [sessions]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s",
        }}
        className={`chat-sidebar${sidebarOpen ? " open" : ""}`}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 650, fontSize: 14, color: "var(--text-strong)" }}>
            对话历史
          </span>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={loadSessions}
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div style={{ padding: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: "100%" }}
            onClick={newConversation}
          >
            <Plus size={15} /> 新对话
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {loadingSessions ? (
            <div className="center-loader" style={{ minHeight: 100 }}>
              <span className="spinner" />
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              还没有对话
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--neutral-400)",
                    padding: "8px 8px 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((s) => {
                  const active = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        background: active ? "var(--primary-soft)" : "transparent",
                        color: active ? "var(--primary-text)" : "var(--text-soft)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        textAlign: "left",
                        marginBottom: 2,
                        fontWeight: active ? 550 : 400,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                      }}
                    >
                      <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.title}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => deleteSession(s.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") deleteSession(s.id, e as unknown as React.MouseEvent);
                        }}
                        style={{
                          opacity: 0,
                          flexShrink: 0,
                          padding: 2,
                          borderRadius: 4,
                          color: "var(--neutral-400)",
                          cursor: "pointer",
                        }}
                        className="session-del"
                        aria-label="删除对话"
                      >
                        <Trash2 size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 52,
          }}
        >
          <button
            className="btn btn-ghost btn-icon btn-sm sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="切换历史侧边栏"
          >
            <PanelLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--primary-500), var(--accent-500))",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Sparkles size={15} />
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {activeId
                  ? sessions.find((s) => s.id === activeId)?.title ?? "AI 对话"
                  : "新对话"}
              </div>
              {meta.model ? (
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {meta.model}
                </div>
              ) : null}
            </div>
          </div>
          <div className="spacer" />
          {typeof meta.remaining === "number" && meta.remaining >= 0 ? (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                background: "var(--surface-2)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
              }}
            >
              剩余 {meta.remaining} 次/分钟
            </span>
          ) : null}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 0",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>
            {messages.length === 0 && !loadingHistory ? (
              <EmptyChat
                onPick={(q) => submitText(q)}
              />
            ) : loadingHistory ? (
              <div className="center-loader"><span className="spinner" /></div>
            ) : (
              messages.map((m) => (
                m.role === "user" || m.role === "assistant" ? (
                  <MessageBubble key={m.id} role={m.role} content={getText(m)} citedNotes={(m as { citedNotes?: { id: string; title: string; tags: string[] }[] }).citedNotes} retrievalStrategy={(m as { retrievalStrategy?: string }).retrievalStrategy} />
                ) : null
              ))
            )}
            {isStreaming && messages[messages.length - 1]?.role === "user" ? (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <Avatar role="assistant" />
                <div
                  className="bubble assistant"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary-500)", display: "inline-block" }} />
                  <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary-500)", display: "inline-block", animationDelay: "0.2s" }} />
                  <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary-500)", display: "inline-block", animationDelay: "0.4s" }} />
                </div>
              </div>
            ) : null}
            {error ? (
              <div className="error-banner" style={{ marginBottom: 16 }}>
                {error.message}
              </div>
            ) : null}
          </div>
        </div>

        {/* Composer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "14px 20px 18px",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {meta.retrieval ? (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    background: retrievalColor(meta.retrieval),
                    color: "white",
                    padding: "1px 7px",
                    borderRadius: "var(--radius-full)",
                    fontSize: 11,
                    fontWeight: 550,
                  }}
                >
                  {retrievalLabel(meta.retrieval)}
                </span>
                <span>
                  引用 {meta.notesCount ?? 0} 条笔记
                </span>
              </div>
            ) : null}
            <form
              data-chat-form
              onSubmit={(e) => {
                e.preventDefault();
                submitText(input);
              }}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
                background: "var(--bg)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius)",
                padding: 8,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-400)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px var(--primary-100)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <textarea
                className="textarea"
                placeholder="基于你的笔记提问…（Enter 发送，Shift+Enter 换行）"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitText(input);
                  }
                }}
                rows={1}
                style={{
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  resize: "none",
                  minHeight: 36,
                  maxHeight: 180,
                  padding: "6px 8px",
                  flex: 1,
                }}
              />
              {isStreaming ? (
                <button type="button" className="btn btn-secondary" onClick={stop}>
                  停止
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn"
                  disabled={!input.trim()}
                  aria-label="发送"
                >
                  <Send size={15} />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgb(15 23 42 / 0.4)",
              zIndex: 20,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
      </div>

      <style>{`
        .session-del-wrap:hover .session-del,
        .chat-sidebar button:hover .session-del {
          opacity: 1 !important;
        }
        .bubble {
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          font-size: 14.5px;
          line-height: 1.65;
          max-width: 100%;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .bubble.user {
          background: var(--primary-600);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble.assistant {
          background: var(--surface);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }
        @media (max-width: 768px) {
          .chat-sidebar {
            position: absolute;
            z-index: 30;
            height: 100%;
            transform: translateX(-100%);
          }
          .chat-sidebar.open {
            transform: translateX(0);
            box-shadow: var(--shadow-lg);
          }
          .sidebar-toggle { display: inline-flex !important; }
        }
        @media (min-width: 769px) {
          .sidebar-toggle { display: none !important; }
        }
      `}</style>
      {sidebarOpen ? (
        <style>{`.chat-sidebar { transform: translateX(0) !important; }`}</style>
      ) : null}
    </div>
  );
}

function getText(m: { parts?: Array<{ type: string; text?: string }> }): string {
  return (
    m.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? ""
  );
}

function retrievalLabel(s: string) {
  switch (s) {
    case "vector":
      return "向量检索";
    case "search":
      return "关键词";
    case "all":
      return "全量兜底";
    case "empty":
      return "无笔记";
    default:
      return s;
  }
}

function retrievalColor(s: string) {
  switch (s) {
    case "vector":
      return "var(--primary-600)";
    case "search":
      return "var(--accent-600)";
    case "all":
      return "var(--warning-600)";
    case "empty":
      return "var(--neutral-500)";
    default:
      return "var(--neutral-600)";
  }
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "assistant") {
    return (
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "linear-gradient(135deg, var(--primary-500), var(--accent-500))",
          color: "white",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Sparkles size={15} />
      </span>
    );
  }
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "var(--neutral-700)",
        color: "white",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      我
    </span>
  );
}

function MessageBubble({
  role,
  content,
  citedNotes,
  retrievalStrategy,
}: {
  role: "user" | "assistant";
  content: string;
  citedNotes?: { id: string; title: string; tags: string[] }[] | null;
  retrievalStrategy?: string | null;
}) {
  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 18,
        flexDirection: role === "user" ? "row-reverse" : "row",
      }}
    >
      <Avatar role={role} />
      <div style={{ maxWidth: "calc(100% - 46px)" }}>
        <div className={`bubble ${role}`}>
          {content}
          {role === "assistant" && citedNotes && citedNotes.length > 0 ? (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                引用笔记 {citedNotes.length} 条
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {citedNotes.map((n) => (
                  <Link
                    key={n.id}
                    href={`/notes/${n.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "var(--primary-text)",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--primary-soft)",
                      width: "fit-content",
                      maxWidth: "100%",
                    }}
                  >
                    <FileText size={12} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {role === "assistant" && retrievalStrategy ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--neutral-400)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              检索策略：{retrievalLabel(retrievalStrategy)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyChat({
  onPick,
}: {
  onPick: (q: string) => void;
}) {
  const suggestions = [
    "总结一下我最近的笔记",
    "关于学习的内容有哪些？",
    "帮我梳理一下项目的关键点",
  ];
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <span
        style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          background: "linear-gradient(135deg, var(--primary-500), var(--accent-500))",
          color: "white",
          display: "inline-grid",
          placeItems: "center",
          marginBottom: 18,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <Sparkles size={28} />
      </span>
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>向你的知识库提问</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
        我会从你的笔记中检索相关内容，并基于它们给出回答。
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 380,
          margin: "0 auto",
        }}
      >
        {suggestions.map((q) => (
          <button
            key={q}
            className="btn btn-secondary"
            style={{ justifyContent: "flex-start", textAlign: "left" }}
            onClick={() => onPick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function groupSessions(sessions: ChatSessionSummary[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - 7 * 86400000;

  const groups: { label: string; items: ChatSessionSummary[] }[] = [
    { label: "今天", items: [] },
    { label: "本周", items: [] },
    { label: "更早", items: [] },
  ];

  for (const s of sessions) {
    const t = new Date(s.updatedAt).getTime();
    if (t >= today) groups[0].items.push(s);
    else if (t >= weekAgo) groups[1].items.push(s);
    else groups[2].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}
