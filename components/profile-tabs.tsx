"use client";

import { useState } from "react";
import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import type { FeedPost, ProfileComment } from "@/lib/types";

type Tab = "posts" | "liked" | "comments";

type Props = {
  currentUserId: string | null;
  isMe: boolean;
  ownerName: string;
  posts: FeedPost[];
  liked: FeedPost[];
  comments: ProfileComment[];
};

export function ProfileTabs({
  currentUserId,
  isMe,
  ownerName,
  posts,
  liked,
  comments,
}: Props) {
  const [tab, setTab] = useState<Tab>("posts");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "posts", label: "Posts", count: posts.length },
    { key: "liked", label: "Liked", count: liked.length },
    { key: "comments", label: "Comments", count: comments.length },
  ];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Profile activity"
        className="flex gap-1 rounded-lg border border-border bg-card p-1 text-sm"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <TabList
          empty={isMe ? "You haven't posted yet." : `${ownerName} hasn't posted yet.`}
          show={posts.length > 0}
        >
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={currentUserId} />
          ))}
        </TabList>
      )}

      {tab === "liked" && (
        <TabList
          empty={isMe ? "You haven't liked anything yet." : `${ownerName} hasn't liked anything yet.`}
          show={liked.length > 0}
        >
          {liked.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={currentUserId} />
          ))}
        </TabList>
      )}

      {tab === "comments" && (
        <TabList
          empty={isMe ? "You haven't commented yet." : `${ownerName} hasn't commented yet.`}
          show={comments.length > 0}
        >
          {comments.map((c) => (
            <Link
              key={c.id}
              href={`/post/${c.post.id}`}
              className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
            >
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {c.body}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <time dateTime={c.createdAt}>{relativeTime(c.createdAt)}</time>
                {" · on "}
                <span className="italic">
                  &ldquo;{c.post.body.slice(0, 60)}
                  {c.post.body.length > 60 ? "…" : ""}&rdquo;
                </span>
              </p>
            </Link>
          ))}
        </TabList>
      )}
    </div>
  );
}

function TabList({
  show,
  empty,
  children,
}: {
  show: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  if (!show) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return <div className="space-y-3">{children}</div>;
}
