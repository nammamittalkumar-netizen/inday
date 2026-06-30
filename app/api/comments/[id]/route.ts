import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!comment) return jsonError("Comment not found", 404);
    if (comment.authorId !== userId) return jsonError("Forbidden", 403);

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
