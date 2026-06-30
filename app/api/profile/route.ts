import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { updateProfileSchema } from "@/lib/validations/post";
import { handleApiError, jsonError } from "@/lib/http";

export async function PATCH(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
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

    const { name, bio, image } = parsed.data;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio: bio ? bio : null,
        // Only overwrite the avatar when a new URL is provided.
        ...(image !== undefined ? { image: image ?? null } : {}),
      },
      select: { id: true, name: true, image: true, bio: true, createdAt: true },
    });

    return NextResponse.json({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
