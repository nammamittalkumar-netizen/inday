import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

/** Promote/demote a user between USER and ADMIN. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return jsonError("Forbidden", 403);

    const { id } = await params;
    if (id === adminId) {
      return jsonError("You can't change your own role", 400);
    }

    const body = await req.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
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

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return jsonError("User not found", 404);

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Permanently delete a user and all their content (cascades). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return jsonError("Forbidden", 403);

    const { id } = await params;
    if (id === adminId) {
      return jsonError("You can't delete your own account here", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return jsonError("User not found", 404);

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
