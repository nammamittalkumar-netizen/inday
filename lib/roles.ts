import { Role } from "@prisma/client";

/**
 * Emails listed in the `ADMIN_EMAILS` env var (comma-separated) are always
 * treated as admins, even before their database `role` is promoted. This lets
 * you bootstrap the first admin on a fresh deployment without touching the DB.
 */
function bootstrapAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Resolve a user's effective role, honouring the `ADMIN_EMAILS` bootstrap. */
export function resolveRole(
  email: string | null | undefined,
  dbRole: Role,
): Role {
  if (dbRole === Role.ADMIN) return Role.ADMIN;
  if (email && bootstrapAdminEmails().has(email.toLowerCase())) {
    return Role.ADMIN;
  }
  return Role.USER;
}
