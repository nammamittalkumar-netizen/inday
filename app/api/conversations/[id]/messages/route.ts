import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { getMessages, markRead, sendMessage } from "@/lib/messages";
import { sendMessageSchema } from "@/lib/validations/message";
import { handleApiError, jsonError } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

/** A page of messages in a conversation. Also marks the thread read. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id: convoId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    const page = await getMessages(convoId, userId, cursor);
    if (!page) return jsonError("Conversation not found", 404);

    // Opening the thread (first page) clears its unread state.
    if (!cursor) await markRead(convoId, userId);

    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Send a message to a conversation. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id: convoId } = await params;
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    const limit = rateLimit(
      `message:${userId}:${getClientIp(req)}`,
      60,
      60 * 1000,
    );
    if (!limit.success) {
      return jsonError("You're sending messages too fast. Slow down.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = sendMessageSchema.safeParse(body);
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

    const message = await sendMessage(convoId, userId, parsed.data.body);
    if (!message) return jsonError("Conversation not found", 404);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
