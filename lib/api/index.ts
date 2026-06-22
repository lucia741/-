import { api } from "./client";

export type User = { id: string; email: string };

export type Tag = { id: string; name: string; noteCount?: number };

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
};

export type DashboardStats = {
  totalNotes: number;
  notesThisWeek: number;
  totalTags: number;
  recentNotes: Pick<Note, "id" | "title" | "updatedAt" | "tags">[];
};

export type CitedNoteMeta = { id: string; title: string; tags: string[] };

export type ChatSessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedNotes: CitedNoteMeta[] | null;
  retrievalStrategy: string | null;
  createdAt: string;
};

export type ChatSessionDetail = {
  session: ChatSessionSummary & { createdAt: string };
  messages: ChatMessageRecord[];
};

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ user: User }>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    api.post<{ user: User }>("/api/auth/login", { email, password }),
  logout: () => api.post<{ ok: boolean }>("/api/auth/logout"),
  me: () => api.get<{ user: User }>("/api/auth/me"),
};

export const notesApi = {
  list: (params?: { q?: string; tag?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.tag) search.set("tag", params.tag);
    const qs = search.toString();
    return api.get<{ notes: Note[] }>(`/api/notes${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<{ note: Note }>(`/api/notes/${id}`),
  create: (data: { title: string; content?: string; tags?: string[] }) =>
    api.post<{ note: Note }>("/api/notes", data),
  update: (
    id: string,
    data: { title?: string; content?: string; tags?: string[] }
  ) => api.put<{ note: Note }>(`/api/notes/${id}`, data),
  delete: (id: string) => api.del<{ ok: boolean }>(`/api/notes/${id}`),
};

export const tagsApi = {
  list: () => api.get<{ tags: Tag[] }>("/api/tags"),
};

export const dashboardApi = {
  get: () => api.get<DashboardStats>("/api/dashboard"),
};

export const chatApi = {
  listSessions: () =>
    api.get<{ sessions: ChatSessionSummary[] }>("/api/chat/sessions"),
  createSession: () =>
    api.post<{ session: ChatSessionSummary & { createdAt: string } }>(
      "/api/chat/sessions"
    ),
  getSession: (id: string) =>
    api.get<ChatSessionDetail>(`/api/chat/sessions/${id}`),
  deleteSession: (id: string) =>
    api.del<{ ok: boolean }>(`/api/chat/sessions/${id}`),
  preview: (q: string) =>
    api.get<{
      strategy: string;
      count: number;
      notes: {
        id: string;
        title: string;
        tags: string[];
        updatedAt: string;
        preview: string;
      }[];
    }>(`/api/chat/preview?q=${encodeURIComponent(q)}`),
};
