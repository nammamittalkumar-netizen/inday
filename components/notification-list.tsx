"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, Loader2, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { NOTIFICATIONS_READ_EVENT } from "@/components/notification-bell";
import { apiFetch, ApiError } from "@/lib/api-client";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  NotificationItem,
  NotificationKind,
  NotificationPage,
} from "@/lib/types";

const VERB: Record<NotificationKind, string> = {
  LIKE: "liked your post",
  COMMENT: "commented on your post",
  FOLLOW: "started following you",
};

const ICON: Record<NotificationKind, typeof Heart> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
};

/** Where a notification leads when tapped. */
function hrefFor(n: NotificationItem): string {
  if (n.type === "FOLLOW") return `/profile/${n.actor.id}`;
  return n.post ? `/post/${n.post.id}` : `/profile/${n.actor.id}`;
}

export function NotificationList() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load the first page, then mark everything read so the badge clears.
  // `reloadKey` lets the Retry button re-run this effect.
  useEffect(() => {
    let active = true;
    apiFetch<NotificationPage>("/api/notifications")
      .then((page) => {
        if (!active) return;
        setItems(page.notifications);
        setCursor(page.nextCursor);
        if (page.unreadCount > 0) {
          apiFetch("/api/notifications/read", { method: "POST" })
            .then(() => {
              window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load notifications",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const page = await apiFetch<NotificationPage>(
        `/api/notifications?cursor=${cursor}`,
      );
      setItems((prev) => [...prev, ...page.notifications]);
      setCursor(page.nextCursor);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't load more",
      );
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  if (!loaded && loading) return <NotificationSkeleton />;

  if (error && items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Bell className="size-6" />
        </div>
        <p className="text-lg font-medium">Couldn&apos;t load notifications</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {error}
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            setError(null);
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Bell className="size-6" />
        </div>
        <p className="text-lg font-medium">No notifications yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          When someone likes, comments on, or follows you, it&apos;ll show up
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((n) => {
          const Icon = ICON[n.type];
          return (
            <li key={n.id}>
              <Link
                href={hrefFor(n)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:bg-accent",
                  !n.read && "border-primary/30 bg-primary/5",
                )}
              >
                <span className="relative shrink-0">
                  <UserAvatar
                    name={n.actor.name}
                    image={n.actor.image}
                    className="size-9"
                    fallbackClassName="text-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-background text-muted-foreground">
                    <Icon className="size-3" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{n.actor.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {VERB[n.type]}
                    </span>
                  </p>
                  {n.post && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      &ldquo;{n.post.body}&rdquo;
                    </p>
                  )}
                  <time
                    dateTime={n.createdAt}
                    className="mt-0.5 block text-xs text-muted-foreground"
                  >
                    {relativeTime(n.createdAt)}
                  </time>
                </div>
                {!n.read && (
                  <span
                    aria-hidden
                    className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {cursor && (
        <div className="pt-2 text-center">
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

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-3 rounded-xl border border-border bg-card px-3 py-3"
        >
          <div className="size-9 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
