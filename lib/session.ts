import { auth } from "@/lib/auth";

/** Returns the logged-in user (id, name, email) or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Returns the logged-in user's id or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
