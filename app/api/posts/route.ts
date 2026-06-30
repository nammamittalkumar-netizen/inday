import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getFeed } from "@/lib/posts";
import { FEED_MODES, type FeedMode } from "@/lib/types";
import { createPostSchema } from "@/lib/validations/post";
import { handleApiError, jsonError } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const rawMode = searchParams.get("mode");
    const mode: FeedMode = FEED_MODES.includes(rawMode as FeedMode)
      ? (rawMode as FeedMode)
      : "for-you";
    const currentUserId = await getCurrentUserId();
    const page = await getFeed(cursor, currentUserId, mode);
    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const limit = rateLimit(`post:${userId}:${getClientIp(req)}`, 20, 60 * 1000);
    if (!limit.success) {
      return jsonError("You're posting too fast. Slow down a moment.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = createPostSchema.safeParse(body);
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

    const post = await prisma.post.create({
      data: {
        body: parsed.data.body,
        imageUrl: parsed.data.imageUrl ?? null,
        authorId: userId,
      },
      select: {
        id: true,
        body: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(
      {
        post: {
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          likeCount: 0,
          commentCount: 0,
          likedByMe: false,
          previewComments: [],
          gated: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
