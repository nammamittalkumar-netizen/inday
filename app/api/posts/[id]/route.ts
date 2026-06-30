import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getPostDetail } from "@/lib/posts";
import { updatePostSchema } from "@/lib/validations/post";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const currentUserId = await getCurrentUserId();
    const post = await getPostDetail(id, currentUserId);
    if (!post) return jsonError("Post not found", 404);
    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!existing) return jsonError("Post not found", 404);
    if (existing.authorId !== userId) return jsonError("Forbidden", 403);

    const body = await req.json().catch(() => null);
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 },
      );
    }

    const post = await prisma.post.update({
      where: { id },
      data: { body: parsed.data.body },
      select: { id: true, body: true, updatedAt: true },
    });

    return NextResponse.json({
      post: { ...post, updatedAt: post.updatedAt.toISOString() },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!existing) return jsonError("Post not found", 404);
    if (existing.authorId !== userId) return jsonError("Forbidden", 403);

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
