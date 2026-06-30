import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard JSON error envelope returned by every API route. */
export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Map a thrown error to a sensible JSON response. */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  // Avoid leaking internals; log server-side via the platform.
  return jsonError("Something went wrong", 500);
}
