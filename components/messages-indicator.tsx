"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

/** Window event a thread fires after marking its messages read. */
export const MESSAGES_READ_EVENT = "inday:messages-read";

const POLL_MS = 30_000;

/** Inbox icon with an unread badge. Polls the count while signed in. */
export function MessagesIndicator({ className }: { className?: string }) {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<{ count: number }>(
        "/api/messages/unread-count",
      );
      setCount(res.count);
    } catch {
      // Non-critical badge.
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const kickoff = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onRead = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener(MESSAGES_READ_EVENT, onRead);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(MESSAGES_READ_EVENT, onRead);
    };
  }, [status, refresh]);

  if (status !== "authenticated") return null;

  return (
    <Button
      render={<Link href="/messages" />}
      variant="ghost"
      size="icon"
      className={className}
      aria-label={count > 0 ? `Messages, ${count} unread` : "Messages"}
    >
      <span className="relative inline-flex">
        <MessageCircle className="size-5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
    </Button>
  );
}
