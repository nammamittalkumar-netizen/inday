import { NextResponse } from "next/server";

import { getFollowConnections } from "@/lib/users";
import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Users this user follows, newest first. Private to the account owner. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return jsonError("Unauthorized", 401);
    if (currentUserId !== id) return jsonError("This list is private", 403);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const page = await getFollowConnections(id, "following", currentUserId, cursor);
    return NextResponse.json(page);
  } catch (error) {
    return handleApiError(error);
  }
}
