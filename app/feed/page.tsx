import type { Metadata } from "next";

import { getCurrentUserId } from "@/lib/session";
import { FeedSection } from "@/components/feed-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The feed",
  description: "Public feed of daily incidents shared on Inday.",
};

export default async function FeedPage() {
  const currentUserId = await getCurrentUserId();
  return <FeedSection currentUserId={currentUserId} />;
}
