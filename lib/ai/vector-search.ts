import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { embedText } from "@/lib/ai/embeddings";
import { getNoteById } from "@/lib/notes/service";
import type { NoteWithTags } from "@/lib/notes/service";

export async function searchNotesByVector(
  userId: string,
  query: string,
  limit = 15
): Promise<NoteWithTags[]> {
  const embedding = await embedText(query);
  if (!embedding) return [];

  const vectorLiteral = `[${embedding.join(",")}]`;

  const ranked = await db
    .select({ id: notes.id })
    .from(notes)
    .where(
      and(eq(notes.userId, userId), sql`${notes.embedding} IS NOT NULL`)
    )
    .orderBy(
      sql`${notes.embedding} <=> ${sql.raw(`'${vectorLiteral}'::vector`)}`
    )
    .limit(limit);

  const results: NoteWithTags[] = [];
  for (const { id } of ranked) {
    const note = await getNoteById(userId, id);
    if (note) results.push(note);
  }
  return results;
}

export async function syncNoteEmbedding(
  noteId: string,
  userId: string,
  title: string,
  content: string
) {
  const text = `${title}\n\n${content}`.trim();
  if (!text) return;

  const embedding = await embedText(text);
  if (!embedding) return;

  await db
    .update(notes)
    .set({ embedding })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}
