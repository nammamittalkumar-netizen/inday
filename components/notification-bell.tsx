"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

/** Window event the notifications page fires after marking everything read. */
export const NOTIFICATIONS_READ_EVENT = "inday:notifications-read";

const POLL_MS = 45_000;

/** Bell with an unread badge. Polls the count while signed in. */
export function NotificationBell({ className }: { className?: string }) {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<{ count: number }>(
        "/api/notifications/unread-count",
      );
      setCount(res.count);
    } catch {
      // Silent — the badge is non-critical.
    }
  }, []);

  useEffect(() => {
    // Nothing to poll until signed in; the component renders null anyway.
    if (status !== "authenticated") return;
    // Kick off the first read on the next tick so setState lands outside the
    // synchronous effect body (avoids cascading renders).
    const kickoff = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onRead = () => setCount(0);
    window.addEventListener("focus", onFocus);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    };
  }, [status, refresh]);

  if (status !== "authenticated") return null;

  return (
    <Button
      render={<Link href="/notifications" />}
      variant="ghost"
      size="icon"
      className={className}
      aria-label={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
    >
      <span className="relative inline-flex">
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
    </Button>
  );
}
