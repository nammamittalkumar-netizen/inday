import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { UserList } from "@/components/user-list";
import { cn } from "@/lib/utils";
import type { FollowConnectionType, FollowUserPage } from "@/lib/types";

type Props = {
  profileId: string;
  profileName: string;
  followers: number;
  following: number;
  active: FollowConnectionType;
  initial: FollowUserPage;
};

/** Instagram-style followers/following screen: header, tabs, and the list. */
export function ConnectionsView({
  profileId,
  profileName,
  followers,
  following,
  active,
  initial,
}: Props) {
  const tabs: { key: FollowConnectionType; label: string; count: number }[] = [
    { key: "followers", label: "Followers", count: followers },
    { key: "following", label: "Following", count: following },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${profileId}`}
          aria-label="Back to profile"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="truncate text-lg font-semibold">{profileName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/profile/${profileId}/${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
              active === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="tabular-nums">{t.count}</span> {t.label}
          </Link>
        ))}
      </div>

      <UserList userId={profileId} type={active} initial={initial} />
    </div>
  );
}
