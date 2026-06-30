import { NextResponse } from "next/server";

import { searchUsers } from "@/lib/discover";
import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";

/** Search users by name or exact id. Requires a signed-in viewer. */
export async function GET(req: Request) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const users = await searchUsers(q, currentUserId);
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
