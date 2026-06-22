import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { createNote, listNotes } from "@/lib/notes/service";

const createNoteSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;

  try {
    const notes = await listNotes(auth.userId, { q, tag });
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[notes/GET]", error);
    return NextResponse.json({ error: "获取笔记失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      );
    }

    const note = await createNote(auth.userId, {
      title: parsed.data.title,
      content: parsed.data.content,
      tagNames: parsed.data.tags,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[notes/POST]", error);
    return NextResponse.json({ error: "创建笔记失败" }, { status: 500 });
  }
}
