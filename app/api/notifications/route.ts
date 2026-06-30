import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { handleApiError, jsonError } from "@/lib/http";

/** List the current user's notifications (cursor-paginated) + unread count. */
export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const page = await getNotifications(userId, cursor);
    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}
