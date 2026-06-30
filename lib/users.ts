import { prisma } from "@/lib/prisma";
import type {
  FollowConnectionType,
  FollowUser,
  FollowUserPage,
  Profile,
} from "@/lib/types";

const CONNECTIONS_PAGE_SIZE = 20;

/**
 * Load a public profile with social stats and the viewer's follow state.
 * Returns null if the user doesn't exist.
 */
export async function getProfile(
  id: string,
  currentUserId: string | null,
): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, image: true, bio: true, createdAt: true },
  });
  if (!user) return null;

  const [posts, likesReceived, comments, followers, following, follow] =
    await Promise.all([
      prisma.post.count({ where: { authorId: id } }),
      prisma.like.count({ where: { post: { authorId: id } } }),
      prisma.comment.count({ where: { authorId: id } }),
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
      currentUserId && currentUserId !== id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: id,
              },
            },
            select: { id: true },
          })
        : null,
    ]);

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    stats: { posts, likesReceived, comments, followers, following },
    isFollowing: Boolean(follow),
    isMe: currentUserId === id,
  };
}

/**
 * List a user's followers or the people they follow, newest first, annotated
 * with whether the current viewer follows each of them (for the Follow button).
 * Cursor is the underlying Follow row id.
 */
export async function getFollowConnections(
  userId: string,
  type: FollowConnectionType,
  currentUserId: string | null,
  cursor?: string | null,
): Promise<FollowUserPage> {
  const userSelect = {
    select: { id: true, name: true, image: true, bio: true },
  } as const;

  const rows = await prisma.follow.findMany({
    where: type === "followers" ? { followingId: userId } : { followerId: userId },
    orderBy: { createdAt: "desc" },
    take: CONNECTIONS_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, follower: userSelect, following: userSelect },
  });

  const hasMore = rows.length > CONNECTIONS_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, CONNECTIONS_PAGE_SIZE) : rows;
  // For "followers" we want the follower user; for "following", the followed one.
  const people = page.map((r) => (type === "followers" ? r.follower : r.following));

  // Which of these does the current viewer already follow?
  let followingSet = new Set<string>();
  if (currentUserId && people.length > 0) {
    const links = await prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: people.map((p) => p.id) },
      },
      select: { followingId: true },
    });
    followingSet = new Set(links.map((l) => l.followingId));
  }

  const users: FollowUser[] = people.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    bio: p.bio,
    isFollowing: followingSet.has(p.id),
    isMe: p.id === currentUserId,
  }));

  return {
    users,
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

/**
 * Toggle the current user's follow of `targetId`.
 * Returns the new follow state and the target's follower count.
 */
export async function toggleFollow(currentUserId: string, targetId: string) {
  const key = {
    followerId_followingId: {
      followerId: currentUserId,
      followingId: targetId,
    },
  };

  const existing = await prisma.follow.findUnique({ where: key });

  if (existing) {
    await prisma.follow.delete({ where: key });
  } else {
    await prisma.follow.create({
      data: { followerId: currentUserId, followingId: targetId },
    });
  }

  const followers = await prisma.follow.count({
    where: { followingId: targetId },
  });

  return { following: !existing, followers };
}
