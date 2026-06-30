import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { getUserInterestSlugs, setUserInterests } from "@/lib/interests";
import { updateInterestsSchema } from "@/lib/validations/post";
import { handleApiError, jsonError } from "@/lib/http";

/** The current user's selected interest slugs. */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const interests = await getUserInterestSlugs(userId);
    return NextResponse.json({ interests });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Replace the current user's interests with the given catalog slugs. */
export async function PUT(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = updateInterestsSchema.safeParse(body);
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

    const interests = await setUserInterests(userId, parsed.data.interests);
    return NextResponse.json({ interests });
  } catch (error) {
    return handleApiError(error);
  }
}
