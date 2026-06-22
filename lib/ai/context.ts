import { listNotes, type NoteWithTags } from "@/lib/notes/service";
import { searchNotesByVector } from "@/lib/ai/vector-search";
import { trimNotesToLimit } from "./prompt";

export type RetrievalStrategy = "vector" | "search" | "all" | "empty";

/** 从用户问题中检索相关笔记（向量 + 关键词 RAG） */
export async function retrieveNotesForQuestion(
  userId: string,
  question: string
): Promise<{ notes: NoteWithTags[]; strategy: RetrievalStrategy }> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { notes: [], strategy: "empty" };
  }

  // 1. 向量语义检索
  const vectorNotes = await searchNotesByVector(userId, trimmed);
  if (vectorNotes.length > 0) {
    return { notes: trimNotesToLimit(vectorNotes), strategy: "vector" };
  }

  // 2. 关键词搜索
  let notes = await listNotes(userId, { q: trimmed });
  if (notes.length > 0) {
    return { notes: trimNotesToLimit(notes), strategy: "search" };
  }

  // 3. 拆词再搜
  const terms = extractSearchTerms(trimmed);
  const seen = new Set<string>();
  const merged: NoteWithTags[] = [];

  for (const term of terms) {
    const hits = await listNotes(userId, { q: term });
    for (const note of hits) {
      if (!seen.has(note.id)) {
        seen.add(note.id);
        merged.push(note);
      }
    }
  }

  if (merged.length > 0) {
    merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { notes: trimNotesToLimit(merged), strategy: "search" };
  }

  // 4. 兜底全量
  notes = await listNotes(userId);
  if (notes.length === 0) {
    return { notes: [], strategy: "empty" };
  }

  return { notes: trimNotesToLimit(notes), strategy: "all" };
}

const STOP_WORDS = new Set([
  "的", "了", "吗", "呢", "吧", "啊", "我", "你", "他", "她", "它",
  "我们", "你们", "他们", "什么", "怎么", "如何", "为什么", "哪", "哪些",
  "关于", "笔记", "讲", "说", "写", "有", "是", "在", "和", "与",
  "the", "a", "an", "is", "are", "what", "how", "my", "me", "about",
]);

function extractSearchTerms(text: string): string[] {
  const parts = text
    .split(/[\s,，。！？；;、]+/)
    .flatMap((part) => part.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) ?? [])
    .filter((term) => !STOP_WORDS.has(term.toLowerCase()));

  return [...new Set(parts)].slice(0, 5);
}
