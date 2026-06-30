"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Loader2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { dayBucket } from "@/lib/format";
import type { FeedMode, FeedPage, FeedPost } from "@/lib/types";

/** Group an already date-sorted list into consecutive day sections. */
function groupByDay(posts: FeedPost[]): { label: string; posts: FeedPost[] }[] {
  const groups: { label: string; posts: FeedPost[] }[] = [];
  for (const post of posts) {
    const label = dayBucket(post.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.posts.push(post);
    else groups.push({ label, posts: [post] });
  }
  return groups;
}

type Props = {
  mode: FeedMode;
  currentUserId: string | null;
  /** Preloaded (SSR) first page — only supplied for the default tab. */
  initial?: FeedPage;
  isLoggedIn: boolean;
};

export function Feed({ mode, currentUserId, initial, isLoggedIn }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>(initial?.posts ?? []);
  const [cursor, setCursor] = useState<string | null>(
    initial?.nextCursor ?? null,
  );
  // Start in the loading state when there's no SSR data, so the skeleton shows
  // immediately without a setState-in-effect cascade.
  const [loading, setLoading] = useState(!initial);
  const [loaded, setLoaded] = useState(!!initial);

  // Fetch the first page client-side when no SSR data was provided.
  useEffect(() => {
    if (initial) return;
    let active = true;
    apiFetch<FeedPage>(`/api/posts?mode=${mode}`)
      .then((page) => {
        if (!active) return;
        setPosts(page.posts);
        setCursor(page.nextCursor);
      })
      .catch((err) => {
        if (active) {
          toast.error(
            err instanceof ApiError ? err.message : "Couldn't load the feed",
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
  }, [mode, initial]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const page = await apiFetch<FeedPage>(
        `/api/posts?mode=${mode}&cursor=${cursor}`,
      );
      setPosts((prev) => [...prev, ...page.posts]);
      setCursor(page.nextCursor);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't load more posts",
      );
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, mode]);

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (!loaded && loading) {
    return <FeedSkeleton />;
  }

  if (posts.length === 0) {
    return <EmptyState mode={mode} isLoggedIn={isLoggedIn} />;
  }

  // Trending is a ranked list, not chronological — leave it ungrouped.
  const groups =
    mode === "trending"
      ? [{ label: "", posts }]
      : groupByDay(posts);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.label || "ranked"} className="space-y-3">
          {group.label && (
            <h2 className="sticky top-14 z-10 -mx-1 bg-background/80 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {group.label}
            </h2>
          )}
          {group.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDeleted={handleDeleted}
            />
          ))}
        </section>
      ))}

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

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-2.5 w-16 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  mode,
  isLoggedIn,
}: {
  mode: FeedMode;
  isLoggedIn: boolean;
}) {
  const content =
    mode === "following"
      ? isLoggedIn
        ? {
            icon: Users,
            title: "Your following feed is empty",
            body: "Follow some people and their incidents will show up here.",
            cta: { href: "/feed", label: "Browse everyone" },
          }
        : {
            icon: Users,
            title: "Log in to see who you follow",
            body: "Sign in to build a feed from the people you follow.",
            cta: { href: "/login", label: "Log in" },
          }
      : mode === "trending"
        ? {
            icon: TrendingUp,
            title: "Nothing trending yet",
            body: "No posts have picked up likes in the last 24 hours. Check back soon.",
            cta: null,
          }
        : {
            icon: Compass,
            title: "No incidents yet",
            body: "Be the first to post about your day.",
            cta: { href: "/new", label: "Write a post" },
          };

  const Icon = content.icon;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-lg font-medium">{content.title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {content.body}
      </p>
      {content.cta && (
        <Button render={<Link href={content.cta.href} />} className="mt-4">
          {content.cta.label}
        </Button>
      )}
    </div>
  );
}
