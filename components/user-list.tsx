"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/follow-button";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { FollowConnectionType, FollowUser, FollowUserPage } from "@/lib/types";

type Props = {
  userId: string;
  type: FollowConnectionType;
  initial: FollowUserPage;
};

export function UserList({ userId, type, initial }: Props) {
  const [users, setUsers] = useState<FollowUser[]>(initial.users);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const page = await apiFetch<FollowUserPage>(
        `/api/users/${userId}/${type}?cursor=${cursor}`,
      );
      setUsers((prev) => [...prev, ...page.users]);
      setCursor(page.nextCursor);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, userId, type]);

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
        <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Users className="size-5" />
        </div>
        <p className="font-medium">
          {type === "followers" ? "No followers yet" : "Not following anyone yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-3 py-3">
            <Link
              href={`/profile/${u.id}`}
              aria-label={u.name}
              className="shrink-0"
            >
              <UserAvatar name={u.name} image={u.image} className="size-11" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${u.id}`}
                className="block truncate font-medium hover:underline"
              >
                {u.name}
              </Link>
              {u.bio && (
                <p className="truncate text-sm text-muted-foreground">{u.bio}</p>
              )}
            </div>
            {!u.isMe && (
              <div className="shrink-0">
                <FollowButton targetId={u.id} initialFollowing={u.isFollowing} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {cursor && (
        <div className="pt-1 text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
