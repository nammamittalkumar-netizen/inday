import { getCurrentUserId } from "@/lib/session";
import { FeedSection } from "@/components/feed-section";
import { Landing } from "@/components/landing";

// Always render fresh: the feed reflects new posts immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUserId = await getCurrentUserId();

  // New / logged-out visitors get the landing page; members get their feed.
  if (!currentUserId) return <Landing />;

  return <FeedSection currentUserId={currentUserId} />;
}
