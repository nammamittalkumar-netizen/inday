import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { createCommentSchema } from "@/lib/validations/post";
import { handleApiError, jsonError } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id: postId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const limit = rateLimit(
      `comment:${userId}:${getClientIp(req)}`,
      30,
      60 * 1000,
    );
    if (!limit.success) {
      return jsonError("You're commenting too fast. Slow down a moment.", 429);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) return jsonError("Post not found", 404);

    const body = await req.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);
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

    const comment = await prisma.comment.create({
      data: { body: parsed.data.body, authorId: userId, postId },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    await createNotification({
      type: "COMMENT",
      recipientId: post.authorId,
      actorId: userId,
      postId,
    });

    return NextResponse.json(
      {
        comment: { ...comment, createdAt: comment.createdAt.toISOString() },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
