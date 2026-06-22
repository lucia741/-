import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthError, requireAuth } from "@/lib/auth/require-auth";
import { deleteNote, getNoteById, updateNote } from "@/lib/notes/service";

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;

  try {
    const note = await getNoteById(auth.userId, id);
    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (error) {
    console.error("[notes/[id]/GET]", error);
    return NextResponse.json({ error: "获取笔记失败" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "参数错误" },
        { status: 400 }
      );
    }

    const note = await updateNote(auth.userId, id, {
      title: parsed.data.title,
      content: parsed.data.content,
      tagNames: parsed.data.tags,
    });

    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("[notes/[id]/PUT]", error);
    return NextResponse.json({ error: "更新笔记失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const { id } = await context.params;

  try {
    const deleted = await deleteNote(auth.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notes/[id]/DELETE]", error);
    return NextResponse.json({ error: "删除笔记失败" }, { status: 500 });
  }
}
