import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_FOLDERS = new Set(["avatars", "posts"]);

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return jsonError("Unauthorized", 401);

    if (!isCloudinaryConfigured()) {
      return jsonError(
        "Image uploads aren't configured yet. Add your Cloudinary keys to continue.",
        503,
      );
    }

    const limit = rateLimit(`upload:${userId}:${getClientIp(req)}`, 30, 60 * 1000);
    if (!limit.success) {
      return jsonError("Too many uploads. Slow down a moment.", 429);
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const kind = String(form?.get("kind") ?? "posts");

    if (!(file instanceof File)) {
      return jsonError("No file provided", 400);
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("Only JPEG, PNG, WebP or GIF images are allowed", 415);
    }
    if (file.size > MAX_BYTES) {
      return jsonError("Image must be 5 MB or smaller", 413);
    }

    const folder = `dailylog/${ALLOWED_FOLDERS.has(kind) ? kind : "posts"}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer, file.type, folder);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
