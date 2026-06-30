import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Permanently remove any post (admin moderation). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return jsonError("Forbidden", 403);

    const { id } = await params;
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return jsonError("Post not found", 404);

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
