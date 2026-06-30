import { formatDistanceToNow } from "date-fns";

/** First initial of a name, uppercased. Falls back to "?". */
export function initialOf(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

/** Human relative time, e.g. "2 hours ago". */
export function relativeTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Short clock time for chat bubbles, e.g. "3:42 PM". */
export function clockTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Absolute, readable date, e.g. "June 29, 2026". */
export function fullDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Whole-day difference (today = 0, yesterday = 1) ignoring clock time. */
function daysAgo(date: Date): number {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ms = startOf(new Date()) - startOf(date);
  return Math.round(ms / 86_400_000);
}

/**
 * Section label for grouping a feed by day: "Today", "Yesterday", or the
 * absolute date for anything older.
 */
export function dayBucket(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = daysAgo(date);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return fullDate(date);
}
