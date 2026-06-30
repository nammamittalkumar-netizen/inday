"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/types";

const POLL_MS = 20_000;

export function ConversationList() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await apiFetch<{ conversations: ConversationSummary[] }>(
        "/api/conversations",
      );
      setItems(res.conversations);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load chats");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, [load]);

  if (!loaded && loading) return <ListSkeleton />;

  if (error && items.length === 0) {
    return (
      <Empty
        title="Couldn't load chats"
        body={error}
        action={
          <Button variant="outline" onClick={() => load()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        title="No conversations yet"
        body="Start a chat from someone's profile — you can message people you follow or who follow you."
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent"
          >
            <UserAvatar
              name={c.user.name}
              image={c.user.image}
              className="size-11 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate font-medium",
                    c.unread > 0 && "font-semibold",
                  )}
                >
                  {c.user.name}
                </span>
                <time
                  dateTime={c.lastMessageAt}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {relativeTime(c.lastMessageAt)}
                </time>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm text-muted-foreground",
                    c.unread > 0 && "text-foreground",
                  )}
                >
                  {c.lastMessage
                    ? `${c.lastMessage.fromMe ? "You: " : ""}${c.lastMessage.body}`
                    : "No messages yet"}
                </p>
                {c.unread > 0 && (
                  <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <MessageCircle className="size-6" />
      </div>
      <p className="text-lg font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-3 py-3">
          <div className="size-11 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-2.5 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
