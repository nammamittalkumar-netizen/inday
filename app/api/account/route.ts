import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";

/**
 * Permanently delete the current user's account. Cascades remove their posts,
 * comments, likes and follow relationships (see Prisma onDelete: Cascade).
 */
export async function DELETE() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
