import Link from "next/link";
import { Shield } from "lucide-react";

import { listUsers } from "@/lib/admin-data";
import { getCurrentUserId } from "@/lib/session";
import { fullDate } from "@/lib/format";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { UserActions } from "@/components/admin/user-actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: SearchParams) {
  const { q, page } = await searchParams;
  const query = q?.trim() ?? "";
  const currentPage = Number(page) || 1;

  const [{ rows, total, pageCount, page: safePage }, currentUserId] =
    await Promise.all([listUsers(query, currentPage), getCurrentUserId()]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Users <span className="text-muted-foreground">({total})</span>
        </h2>
        <AdminSearch
          action="/admin/users"
          defaultValue={query}
          placeholder="Search name or email…"
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No users match “{query}”.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 text-right font-medium">Posts</th>
                  <th className="p-3 text-right font-medium">Followers</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border align-middle transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="p-3">
                      <Link
                        href={`/profile/${u.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <UserAvatar
                          name={u.name}
                          image={u.image}
                          className="size-8"
                          fallbackClassName="text-xs"
                        />
                        <span>
                          <span className="block font-medium">{u.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {u.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          u.role === "ADMIN"
                            ? "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {u.role === "ADMIN" ? (
                          <Shield className="size-3" />
                        ) : null}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums">{u.postCount}</td>
                    <td className="p-3 text-right tabular-nums">
                      {u.followerCount}
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {fullDate(u.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <UserActions
                        userId={u.id}
                        userName={u.name}
                        role={u.role}
                        isSelf={u.id === currentUserId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <AdminPagination
        basePath="/admin/users"
        page={safePage}
        pageCount={pageCount}
        query={query}
      />
    </div>
  );
}
