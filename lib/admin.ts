import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";

/** True when the current session belongs to an admin. */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === Role.ADMIN;
}

/**
 * Page guard: returns the admin session user, or redirects. Sends signed-out
 * visitors to the login page and signed-in non-admins back to the feed so the
 * admin area never reveals its existence to ordinary users.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== Role.ADMIN) redirect("/");
  return session.user;
}

/**
 * Route-handler guard: returns the admin user id, or `null` when the caller is
 * not an authenticated admin. API routes turn the `null` into a 401/403.
 */
export async function getAdminUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) return null;
  return session.user.id;
}
