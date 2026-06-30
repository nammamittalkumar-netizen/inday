import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ConnectionsView } from "@/components/connections-view";
import { getProfile, getFollowConnections } from "@/lib/users";
import { getCurrentUserId } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id, null);
  return { title: profile ? `${profile.name} is following` : "Following" };
}

export default async function FollowingPage({ params }: Params) {
  const { id } = await params;
  const currentUserId = await getCurrentUserId();

  // Followers/following lists are private to the account owner.
  if (currentUserId !== id) {
    redirect(currentUserId ? `/profile/${id}` : `/login?callbackUrl=/profile/${id}`);
  }

  const [profile, initial] = await Promise.all([
    getProfile(id, currentUserId),
    getFollowConnections(id, "following", currentUserId),
  ]);
  if (!profile) notFound();

  return (
    <ConnectionsView
      profileId={profile.id}
      profileName={profile.name}
      followers={profile.stats.followers}
      following={profile.stats.following}
      active="following"
      initial={initial}
    />
  );
}
