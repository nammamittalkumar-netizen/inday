import { formatDistanceToNow } from "date-fns";

/** First initial of a name, uppercased. Falls back to "?". */
export function initialOf(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

/** Up to two initials (first + last word), e.g. "Ada Lovelace" → "AL". */
export function initialsOf(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Deterministic, pleasant background color derived from a name — the colored
 * default-avatar pattern used by Google, Slack and Discord. The same name
 * always yields the same hue.
 */
export function avatarColor(seed?: string | null): string {
  const str = seed?.trim() || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // keep it a 32-bit int
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 45%)`;
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
