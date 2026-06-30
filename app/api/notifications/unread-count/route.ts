import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { getUnreadCount } from "@/lib/notifications";
import { handleApiError } from "@/lib/http";

/** Lightweight unread count for the navbar bell badge (polled). */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ count: 0 });

    const count = await getUnreadCount(userId);
    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
