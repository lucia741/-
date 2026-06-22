import { listNotes, type NoteWithTags } from "@/lib/notes/service";
import { trimNotesToLimit } from "./prompt";

/** 从用户问题中检索相关笔记（RAG 简化版） */
export async function retrieveNotesForQuestion(
  userId: string,
  question: string
): Promise<{ notes: NoteWithTags[]; strategy: "search" | "all" | "empty" }> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { notes: [], strategy: "empty" };
  }

  // 1. 先用问题关键词搜索
  let notes = await listNotes(userId, { q: trimmed });

  if (notes.length > 0) {
    return { notes: trimNotesToLimit(notes), strategy: "search" };
  }

  // 2. 拆词再搜（简单分词：中英文片段）
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
    merged.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    return { notes: trimNotesToLimit(merged), strategy: "search" };
  }

  // 3. 兜底：全部笔记（控制 token 上限）
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
