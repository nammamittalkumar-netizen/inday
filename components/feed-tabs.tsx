"use client";

import { useState } from "react";
import { Compass, TrendingUp, Users } from "lucide-react";

import { Feed } from "@/components/feed";
import { cn } from "@/lib/utils";
import type { FeedMode, FeedPage } from "@/lib/types";

const TABS: { mode: FeedMode; label: string; icon: typeof Compass }[] = [
  { mode: "for-you", label: "For you", icon: Compass },
  { mode: "following", label: "Following", icon: Users },
  { mode: "trending", label: "Trending", icon: TrendingUp },
];

type Props = {
  /** SSR-preloaded first page for the default "for-you" tab. */
  initialForYou: FeedPage;
  currentUserId: string | null;
};

export function FeedTabs({ initialForYou, currentUserId }: Props) {
  const [mode, setMode] = useState<FeedMode>("for-you");
  const isLoggedIn = !!currentUserId;

  return (
    <div className="space-y-5">
      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Feed filter"
        className="flex w-full gap-1 rounded-full border border-border bg-muted/60 p-1"
      >
        {TABS.map(({ mode: m, label, icon: Icon }) => {
          const active = mode === m;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Remount per tab so each loads its own page; "for-you" keeps SSR data. */}
      <Feed
        key={mode}
        mode={mode}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
        initial={mode === "for-you" ? initialForYou : undefined}
      />
    </div>
  );
}
