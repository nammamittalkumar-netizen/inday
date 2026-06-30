import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { totalUnread } from "@/lib/messages";
import { handleApiError } from "@/lib/http";

/** Total unread DM count for the navbar badge (polled). */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ count: 0 });
    const count = await totalUnread(userId);
    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
