import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { signWsTicket } from "@/lib/realtime";
import { handleApiError, jsonError } from "@/lib/http";

/** Mint a short-lived ticket the client uses to open the chat WebSocket. */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    return NextResponse.json({ ticket: signWsTicket(userId) });
  } catch (error) {
    return handleApiError(error);
  }
}
