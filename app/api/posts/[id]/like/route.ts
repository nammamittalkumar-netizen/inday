import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Toggle the current user's like on a post. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id: postId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) return jsonError("Post not found", 404);

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { id: true },
    });

    let liked: boolean;
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      // The unique constraint guards against duplicate likes under races.
      await prisma.like.create({ data: { userId, postId } });
      liked = true;
      await createNotification({
        type: "LIKE",
        recipientId: post.authorId,
        actorId: userId,
        postId,
      });
    }

    const likeCount = await prisma.like.count({ where: { postId } });
    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    return handleApiError(error);
  }
}
