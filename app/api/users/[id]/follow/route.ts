import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { toggleFollow } from "@/lib/users";
import { createNotification } from "@/lib/notifications";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id: targetId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    if (userId === targetId) return jsonError("You can't follow yourself", 400);

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) return jsonError("User not found", 404);

    const result = await toggleFollow(userId, targetId);
    if (result.following) {
      await createNotification({
        type: "FOLLOW",
        recipientId: targetId,
        actorId: userId,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
