import crypto from "crypto";

/**
 * Minimal, dependency-free Cloudinary uploader using signed REST uploads.
 * Secrets never leave the server. Configure via environment variables:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** True when all Cloudinary env vars are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Build the Cloudinary signature: SHA-1 of the sorted params joined by `&`,
 * with the API secret appended. `file` and `api_key` are excluded by spec.
 */
function sign(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");
}

/**
 * Upload an image buffer to Cloudinary and return its secure HTTPS URL.
 * @param folder logical folder, e.g. "dailylog/avatars" or "dailylog/posts"
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Image uploads are not configured on the server.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign({ folder, timestamp });

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const form = new FormData();
  form.append("file", dataUri);
  form.append("api_key", API_KEY!);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form },
  );

  const data = (await res.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null;

  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message ?? "Cloudinary upload failed");
  }

  return data.secure_url;
}
