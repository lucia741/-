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

export type CitedNoteMeta = {
  id: string;
  title: string;
  tags: string[];
};

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
