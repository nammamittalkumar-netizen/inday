import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validations/auth";
import { handleApiError, jsonError } from "@/lib/http";

const SALT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return jsonError("Unauthorized", 401);

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) return jsonError("Current password is incorrect", 403);

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
