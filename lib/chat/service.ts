import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  chatMessages,
  chatSessions,
  type CitedNoteMeta,
} from "@/lib/db/schema";

export async function listChatSessions(userId: string) {
  return db
    .select({
      id: chatSessions.id,
      title: chatSessions.title,
      updatedAt: chatSessions.updatedAt,
    })
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);
}

export async function createChatSession(userId: string, title?: string) {
  const [session] = await db
    .insert(chatSessions)
    .values({ userId, title: title ?? "新对话" })
    .returning();
  return session;
}

export async function getChatSession(userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    )
    .limit(1);
  return session ?? null;
}

export async function getSessionMessages(userId: string, sessionId: string) {
  const session = await getChatSession(userId, sessionId);
  if (!session) return null;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return { session, messages };
}

export async function ensureChatSession(
  userId: string,
  sessionId?: string,
  firstMessage?: string
) {
  if (sessionId) {
    const existing = await getChatSession(userId, sessionId);
    if (existing) return existing;
  }

  const title =
    firstMessage?.slice(0, 30) || "新对话";
  return createChatSession(userId, title);
}

export async function saveChatMessage(
  sessionId: string,
  data: {
    role: "user" | "assistant";
    content: string;
    citedNotes?: CitedNoteMeta[];
    retrievalStrategy?: string;
  }
) {
  const [msg] = await db
    .insert(chatMessages)
    .values({
      sessionId,
      role: data.role,
      content: data.content,
      citedNotes: data.citedNotes ?? null,
      retrievalStrategy: data.retrievalStrategy ?? null,
    })
    .returning();

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));

  return msg;
}

export async function deleteChatSession(userId: string, sessionId: string) {
  const result = await db
    .delete(chatSessions)
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    )
    .returning({ id: chatSessions.id });
  return result.length > 0;
}

export function toCitedNoteMeta(
  notes: { id: string; title: string; tags: { name: string }[] }[]
): CitedNoteMeta[] {
  return notes.map((n) => ({
    id: n.id,
    title: n.title,
    tags: n.tags.map((t) => t.name),
  }));
}
