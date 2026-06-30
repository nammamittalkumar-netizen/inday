/** Thin client-side JSON fetch wrapper that throws a readable error. */
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      firstIssue(data) ||
      "Request failed. Please try again.";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function firstIssue(data: unknown): string | null {
  if (
    data &&
    typeof data === "object" &&
    "issues" in data &&
    Array.isArray((data as { issues: unknown }).issues)
  ) {
    const issues = (data as { issues: { message?: string }[] }).issues;
    return issues[0]?.message ?? null;
  }
  return null;
}
