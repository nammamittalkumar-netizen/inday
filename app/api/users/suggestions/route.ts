import { NextResponse } from "next/server";

import { getSuggestedUsers } from "@/lib/discover";
import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";

/** "Who to follow" suggestions for the signed-in viewer. */
export async function GET() {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return jsonError("Unauthorized", 401);

    const users = await getSuggestedUsers(currentUserId);
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
