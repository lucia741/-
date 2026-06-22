import type { DashboardStats, Note, Tag, User } from "@/lib/types";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "请求失败");
  }

  return data as T;
}

export const api = {
  auth: {
    me: () => request<{ user: User }>("/api/auth/me"),
    login: (email: string, password: string) =>
      request<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  },
  notes: {
    list: (params?: { q?: string; tag?: string }) => {
      const sp = new URLSearchParams();
      if (params?.q) sp.set("q", params.q);
      if (params?.tag) sp.set("tag", params.tag);
      const qs = sp.toString();
      return request<{ notes: Note[] }>(`/api/notes${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<{ note: Note }>(`/api/notes/${id}`),
    create: (data: { title: string; content?: string; tags?: string[] }) =>
      request<{ note: Note }>("/api/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: { title?: string; content?: string; tags?: string[] }
    ) =>
      request<{ note: Note }>(`/api/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
  },
  tags: () => request<{ tags: Tag[] }>("/api/tags"),
  dashboard: () => request<DashboardStats>("/api/dashboard"),
};
