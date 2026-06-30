import { getFeed } from "@/lib/posts";
import { FeedTabs } from "@/components/feed-tabs";

/** Server component: fetches the first feed page and renders the feed UI. */
export async function FeedSection({
  currentUserId,
}: {
  currentUserId: string | null;
}) {
  const initial = await getFeed(null, currentUserId, "for-you");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">The daily feed</h1>
        <p className="text-sm text-muted-foreground">
          Small incidents from people&apos;s days — switch between everyone, the
          people you follow, and what&apos;s trending.
        </p>
      </div>
      <FeedTabs initialForYou={initial} currentUserId={currentUserId} />
    </div>
  );
}
