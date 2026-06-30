"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Sparkles, UserX, X } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { FollowButton } from "@/components/follow-button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { FollowUser, SearchUser, SuggestedUser } from "@/lib/types";

type Props = {
  suggestions: SuggestedUser[];
};

const DEBOUNCE_MS = 300;

export function DiscoverView({ suggestions }: Props) {
  const [query, setQuery] = useState("");
  // null = a search is pending for the current query; an array = its results.
  const [results, setResults] = useState<SearchUser[] | null>(null);
  const reqId = useRef(0);

  const trimmed = query.trim();

  function onQueryChange(value: string) {
    setQuery(value);
    // New keystroke invalidates any shown results until the next fetch lands.
    setResults(null);
  }

  useEffect(() => {
    // Empty query: we render suggestions instead, so there's nothing to fetch.
    if (trimmed.length === 0) return;

    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<{ users: SearchUser[] }>(
          `/api/users/search?q=${encodeURIComponent(trimmed)}`,
        );
        // Ignore responses from stale keystrokes.
        if (id !== reqId.current) return;
        setResults(data.users);
      } catch (err) {
        if (id !== reqId.current) return;
        toast.error(err instanceof ApiError ? err.message : "Search failed");
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  const searching = trimmed.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover people</h1>
        <p className="text-sm text-muted-foreground">
          Search by name or user ID, or follow someone new.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search people…"
          aria-label="Search people"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {searching ? (
        <SearchResults query={trimmed} results={results} />
      ) : (
        <Suggestions suggestions={suggestions} />
      )}
    </div>
  );
}

function SearchResults({
  query,
  results,
}: {
  query: string;
  results: SearchUser[] | null;
}) {
  if (results === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Searching…
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<UserX className="size-5" />}
        title="No people found"
        subtitle={`Nothing matched “${query}”.`}
      />
    );
  }

  return <UserRows users={results} />;
}

function Suggestions({ suggestions }: { suggestions: SuggestedUser[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Sparkles className="size-4" />
        Suggested for you
      </div>
      {suggestions.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No suggestions yet"
          subtitle="Add some interests to your profile to find people like you."
        />
      ) : (
        <UserRows users={suggestions} />
      )}
    </section>
  );
}

/** Shared list rendering for both search results and suggestions. */
function UserRows({ users }: { users: (FollowUser & { reason?: string })[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {users.map((u) => (
        <li key={u.id} className="flex items-center gap-3 px-3 py-3">
          <Link href={`/profile/${u.id}`} aria-label={u.name} className="shrink-0">
            <UserAvatar name={u.name} image={u.image} className="size-11" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${u.id}`}
              className="block truncate font-medium hover:underline"
            >
              {u.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {u.reason ?? u.bio ?? ""}
            </p>
          </div>
          {!u.isMe && (
            <div className="shrink-0">
              <FollowButton targetId={u.id} initialFollowing={u.isFollowing} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
