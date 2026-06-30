import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiscoverView } from "@/components/discover-view";
import { getSuggestedUsers } from "@/lib/discover";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Discover people",
  description: "Search for people and find new accounts to follow on Inday.",
};

export default async function DiscoverPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/discover");

  const suggestions = await getSuggestedUsers(userId);

  return <DiscoverView suggestions={suggestions} />;
}
