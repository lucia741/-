import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { noteTags, notes, tags } from "@/lib/db/schema";

export type NoteWithTags = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { id: string; name: string }[];
};

async function attachTags(
  userId: string,
  noteRows: (typeof notes.$inferSelect)[]
): Promise<NoteWithTags[]> {
  if (noteRows.length === 0) return [];

  const noteIds = noteRows.map((n) => n.id);
  const tagRows = await db
    .select({
      noteId: noteTags.noteId,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(
      and(eq(tags.userId, userId), inArray(noteTags.noteId, noteIds))
    );

  const tagsByNote = new Map<string, { id: string; name: string }[]>();
  for (const row of tagRows) {
    const list = tagsByNote.get(row.noteId) ?? [];
    list.push({ id: row.tagId, name: row.tagName });
    tagsByNote.set(row.noteId, list);
  }

  return noteRows.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: tagsByNote.get(note.id) ?? [],
  }));
}

export async function listNotes(
  userId: string,
  options: { q?: string; tag?: string } = {}
): Promise<NoteWithTags[]> {
  const { q, tag } = options;

  let noteRows: (typeof notes.$inferSelect)[];

  if (tag) {
    noteRows = await db
      .select({ note: notes })
      .from(notes)
      .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(
        and(
          eq(notes.userId, userId),
          eq(tags.userId, userId),
          ilike(tags.name, tag)
        )
      )
      .orderBy(desc(notes.updatedAt))
      .then((rows) => rows.map((r) => r.note));
  } else if (q) {
    const pattern = `%${q}%`;
    noteRows = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          or(ilike(notes.title, pattern), ilike(notes.content, pattern))
        )
      )
      .orderBy(desc(notes.updatedAt));
  } else {
    noteRows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt));
  }

  return attachTags(userId, noteRows);
}

export async function getNoteById(
  userId: string,
  noteId: string
): Promise<NoteWithTags | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);

  if (!note) return null;
  const [withTags] = await attachTags(userId, [note]);
  return withTags;
}

async function upsertTagsForUser(
  userId: string,
  tagNames: string[]
): Promise<string[]> {
  const normalized = [
    ...new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
  ];
  if (normalized.length === 0) return [];

  const tagIds: string[] = [];

  for (const name of normalized) {
    const [existing] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, name)))
      .limit(1);

    if (existing) {
      tagIds.push(existing.id);
    } else {
      const [created] = await db
        .insert(tags)
        .values({ name, userId })
        .returning({ id: tags.id });
      tagIds.push(created.id);
    }
  }

  return tagIds;
}

async function syncNoteTags(noteId: string, tagIds: string[]) {
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));

  if (tagIds.length > 0) {
    await db.insert(noteTags).values(
      tagIds.map((tagId) => ({ noteId, tagId }))
    );
  }
}

export async function createNote(
  userId: string,
  data: { title: string; content?: string; tagNames?: string[] }
): Promise<NoteWithTags> {
  const [note] = await db
    .insert(notes)
    .values({
      userId,
      title: data.title,
      content: data.content ?? "",
    })
    .returning();

  const tagIds = await upsertTagsForUser(userId, data.tagNames ?? []);
  await syncNoteTags(note.id, tagIds);

  const result = await getNoteById(userId, note.id);
  return result!;
}

export async function updateNote(
  userId: string,
  noteId: string,
  data: { title?: string; content?: string; tagNames?: string[] }
): Promise<NoteWithTags | null> {
  const existing = await getNoteById(userId, noteId);
  if (!existing) return null;

  const updates: Partial<typeof notes.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.title !== undefined) updates.title = data.title;
  if (data.content !== undefined) updates.content = data.content;

  await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (data.tagNames !== undefined) {
    const tagIds = await upsertTagsForUser(userId, data.tagNames);
    await syncNoteTags(noteId, tagIds);
  }

  return getNoteById(userId, noteId);
}

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<boolean> {
  const result = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning({ id: notes.id });

  return result.length > 0;
}

export async function listTags(userId: string) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      noteCount: sql<number>`count(${noteTags.noteId})::int`,
    })
    .from(tags)
    .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
    .where(eq(tags.userId, userId))
    .groupBy(tags.id, tags.name)
    .orderBy(tags.name);
}

export async function getDashboardStats(userId: string) {
  const [noteStats] = await db
    .select({
      totalNotes: sql<number>`count(*)::int`,
      notesThisWeek: sql<number>`count(*) filter (where ${notes.createdAt} >= now() - interval '7 days')::int`,
    })
    .from(notes)
    .where(eq(notes.userId, userId));

  const [tagStats] = await db
    .select({ totalTags: sql<number>`count(*)::int` })
    .from(tags)
    .where(eq(tags.userId, userId));

  const recentNotes = await listNotes(userId);

  return {
    totalNotes: noteStats?.totalNotes ?? 0,
    notesThisWeek: noteStats?.notesThisWeek ?? 0,
    totalTags: tagStats?.totalTags ?? 0,
    recentNotes: recentNotes.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      updatedAt: n.updatedAt,
      tags: n.tags,
    })),
  };
}

/** 供 AI 接口使用：拉取用户全部笔记作为上下文 */
export async function getNotesContextForAI(userId: string, query?: string) {
  const allNotes = query
    ? await listNotes(userId, { q: query })
    : await listNotes(userId);

  return allNotes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags.map((t) => t.name),
    updatedAt: n.updatedAt.toISOString(),
  }));
}
