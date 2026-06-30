import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import {
  canMessage,
  getOrCreateConversation,
  listConversations,
} from "@/lib/messages";
import { startConversationSchema } from "@/lib/validations/message";
import { handleApiError, jsonError } from "@/lib/http";

/** Inbox: the current user's conversations, most-recent first. */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const conversations = await listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Open (or start) a 1:1 conversation with another user. */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = startConversationSchema.safeParse(body);
    if (!parsed.success) return jsonError("A recipient is required", 422);

    const otherId = parsed.data.userId;
    if (otherId === userId) {
      return jsonError("You can't message yourself", 400);
    }

    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true },
    });
    if (!other) return jsonError("User not found", 404);

    if (!(await canMessage(userId, otherId))) {
      return jsonError(
        "You can only message people you follow or who follow you",
        403,
      );
    }

    const id = await getOrCreateConversation(userId, otherId);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
