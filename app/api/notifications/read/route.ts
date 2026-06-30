import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { markAllRead } from "@/lib/notifications";
import { handleApiError, jsonError } from "@/lib/http";

/** Mark all of the current user's notifications as read. */
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const updated = await markAllRead(userId);
    return NextResponse.json({ updated });
  } catch (error) {
    return handleApiError(error);
  }
}
