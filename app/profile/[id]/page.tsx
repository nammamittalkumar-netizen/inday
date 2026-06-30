import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import {
  getPostsByAuthor,
  getLikedPosts,
  getCommentsByAuthor,
} from "@/lib/posts";
import { getProfile } from "@/lib/users";
import { canMessage } from "@/lib/messages";
import { getCurrentUserId } from "@/lib/session";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/follow-button";
import { MessageButton } from "@/components/message-button";
import { ShareButton } from "@/components/share-button";
import { ProfileTabs } from "@/components/profile-tabs";
import { fullDate } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id, null);
  if (!profile) return { title: "Profile not found" };
  return {
    title: profile.name,
    description: profile.bio ?? `${profile.name}'s incidents on Inday.`,
  };
}

function Stat({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg py-1 text-center transition-colors hover:bg-muted"
      >
        {inner}
      </Link>
    );
  }
  return <div className="py-1 text-center">{inner}</div>;
}

export default async function ProfilePage({ params }: Params) {
  const { id } = await params;
  const currentUserId = await getCurrentUserId();

  const profile = await getProfile(id, currentUserId);
  if (!profile) notFound();

  const [posts, liked, comments, canDm] = await Promise.all([
    getPostsByAuthor(profile.id, currentUserId),
    getLikedPosts(profile.id, currentUserId),
    getCommentsByAuthor(profile.id),
    currentUserId ? canMessage(currentUserId, profile.id) : Promise.resolve(false),
  ]);

  const { stats, isMe } = profile;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <UserAvatar
            name={profile.name}
            image={profile.image}
            className="size-16"
            fallbackClassName="text-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              Joined {fullDate(profile.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isMe ? (
              <Button
                render={<Link href="/profile/edit" />}
                variant="outline"
                size="sm"
              >
                <Pencil className="size-4" />
                Edit profile
              </Button>
            ) : (
              <>
                <FollowButton
                  targetId={profile.id}
                  initialFollowing={profile.isFollowing}
                />
                {canDm && <MessageButton targetId={profile.id} />}
              </>
            )}
            <ShareButton path={`/profile/${profile.id}`} size="icon-sm" />
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="mt-5 grid grid-cols-4 gap-1 border-t border-border pt-4">
          <Stat value={stats.posts} label="Posts" />
          <Stat
            value={stats.followers}
            label="Followers"
            // Follower/following lists are private to the account owner.
            href={isMe ? `/profile/${profile.id}/followers` : undefined}
          />
          <Stat
            value={stats.following}
            label="Following"
            href={isMe ? `/profile/${profile.id}/following` : undefined}
          />
          <Stat value={stats.likesReceived} label="Likes" />
        </div>
      </div>

      <ProfileTabs
        currentUserId={currentUserId}
        isMe={isMe}
        ownerName={profile.name}
        posts={posts}
        liked={liked}
        comments={comments}
      />
    </div>
  );
}
