import { tool } from "ai";
import { z } from "zod";
import {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/notes/service";

const NOTE_CONTENT_LIMIT = 14_000;

export function createNoteAgentTools(userId: string) {
  return {
    list_notes: tool({
      description:
        "搜索或列出用户笔记。返回摘要预览，不含完整正文；修改前请用 get_note 读取全文",
      inputSchema: z.object({
        query: z.string().optional().describe("搜索关键词，留空则列出最近笔记"),
      }),
      execute: async ({ query }) => {
        const notes = await listNotes(userId, { q: query, limit: 15 });
        return {
          count: notes.length,
          notes: notes.map((n) => ({
            id: n.id,
            title: n.title,
            tags: n.tags.map((t) => t.name),
            preview: n.content.slice(0, 280) || "（无正文）",
            updatedAt: n.updatedAt.toISOString(),
          })),
        };
      },
    }),

    get_note: tool({
      description:
        "读取单条笔记的完整标题、正文和标签。修改或删除笔记前必须先调用此工具",
      inputSchema: z.object({
        noteId: z.string().uuid().describe("笔记 ID"),
      }),
      execute: async ({ noteId }) => {
        const note = await getNoteById(userId, noteId);
        if (!note) {
          return { ok: false as const, error: "笔记不存在或无权访问" };
        }
        const content =
          note.content.length > NOTE_CONTENT_LIMIT
            ? note.content.slice(0, NOTE_CONTENT_LIMIT) + "\n\n…（正文已截断）"
            : note.content;
        return {
          ok: true as const,
          id: note.id,
          title: note.title,
          content,
          tags: note.tags.map((t) => t.name),
          updatedAt: note.updatedAt.toISOString(),
        };
      },
    }),

    create_note: tool({
      description: "创建一条新笔记，content 为完整正文",
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        content: z.string(),
        tags: z.array(z.string()).max(10).optional(),
      }),
      execute: async ({ title, content, tags }) => {
        const note = await createNote(userId, {
          title,
          content,
          tagNames: tags,
        });
        return {
          ok: true,
          action: "created" as const,
          id: note.id,
          title: note.title,
        };
      },
    }),

    update_note: tool({
      description:
        "更新已有笔记。修改前必须先 get_note；content 须为符合用户要求的完整新正文",
      inputSchema: z.object({
        noteId: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).max(10).optional(),
      }),
      execute: async ({ noteId, title, content, tags }) => {
        const note = await updateNote(userId, noteId, {
          title,
          content,
          tagNames: tags,
        });
        if (!note) {
          return { ok: false, error: "笔记不存在或无权访问" };
        }
        return {
          ok: true,
          action: "updated" as const,
          id: note.id,
          title: note.title,
        };
      },
    }),

    delete_note: tool({
      description: "删除指定笔记，仅在用户明确要求删除时使用",
      inputSchema: z.object({
        noteId: z.string().uuid(),
      }),
      execute: async ({ noteId }) => {
        const ok = await deleteNote(userId, noteId);
        return {
          ok,
          action: ok ? ("deleted" as const) : ("not_found" as const),
          noteId,
        };
      },
    }),
  };
}
