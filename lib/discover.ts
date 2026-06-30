import { prisma } from "@/lib/prisma";
import type { SearchUser, SuggestedUser } from "@/lib/types";

const SEARCH_LIMIT = 20;
const SUGGESTIONS_LIMIT = 12;

type UserCard = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
};

/** Which of `ids` does `currentUserId` already follow? */
async function followingSet(
  currentUserId: string | null,
  ids: string[],
): Promise<Set<string>> {
  if (!currentUserId || ids.length === 0) return new Set();
  const links = await prisma.follow.findMany({
    where: { followerId: currentUserId, followingId: { in: ids } },
    select: { followingId: true },
  });
  return new Set(links.map((l) => l.followingId));
}

/**
 * Search users by display name (case-insensitive substring) or by exact user id.
 * Results are annotated with the viewer's follow state.
 */
export async function searchUsers(
  query: string,
  currentUserId: string | null,
  limit = SEARCH_LIMIT,
): Promise<SearchUser[]> {
  const q = query.trim();
  if (q.length === 0) return [];

  const people: UserCard[] = await prisma.user.findMany({
    where: {
      OR: [{ name: { contains: q, mode: "insensitive" } }, { id: q }],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, image: true, bio: true },
  });

  const followed = await followingSet(
    currentUserId,
    people.map((p) => p.id),
  );

  return people.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    bio: p.bio,
    isFollowing: followed.has(p.id),
    isMe: p.id === currentUserId,
  }));
}

function sharedInterestReason(count: number): string {
  return count === 1 ? "1 shared interest" : `${count} shared interests`;
}

/**
 * "Who to follow" suggestions for a signed-in user. Ranks people who share the
 * most interests first, then backfills with the most-followed accounts. Excludes
 * the viewer and anyone they already follow.
 */
export async function getSuggestedUsers(
  currentUserId: string,
  limit = SUGGESTIONS_LIMIT,
): Promise<SuggestedUser[]> {
  // Don't suggest the viewer or people they already follow.
  const following = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const exclude = new Set<string>([currentUserId, ...following.map((f) => f.followingId)]);

  const myInterests = await prisma.interest.findMany({
    where: { users: { some: { id: currentUserId } } },
    select: { id: true },
  });
  const myInterestIds = myInterests.map((i) => i.id);

  const suggestions: SuggestedUser[] = [];
  const picked = new Set<string>(exclude);

  // Phase 1 — people who share at least one interest, ranked by overlap.
  if (myInterestIds.length > 0) {
    const matches = await prisma.user.findMany({
      where: {
        id: { notIn: [...exclude] },
        interests: { some: { id: { in: myInterestIds } } },
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        interests: {
          where: { id: { in: myInterestIds } },
          select: { id: true },
        },
      },
      take: limit * 4,
    });

    matches
      .map((m) => ({ user: m, shared: m.interests.length }))
      .sort((a, b) => b.shared - a.shared)
      .slice(0, limit)
      .forEach(({ user, shared }) => {
        picked.add(user.id);
        suggestions.push({
          id: user.id,
          name: user.name,
          image: user.image,
          bio: user.bio,
          isFollowing: false,
          isMe: false,
          reason: sharedInterestReason(shared),
        });
      });
  }

  // Phase 2 — backfill with the most-followed accounts not already chosen.
  if (suggestions.length < limit) {
    const popular = await prisma.user.findMany({
      where: { id: { notIn: [...picked] } },
      orderBy: { followers: { _count: "desc" } },
      take: limit - suggestions.length,
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        _count: { select: { followers: true } },
      },
    });

    for (const p of popular) {
      suggestions.push({
        id: p.id,
        name: p.name,
        image: p.image,
        bio: p.bio,
        isFollowing: false,
        isMe: false,
        reason:
          p._count.followers > 0 ? "Popular on Inday" : "New to Inday",
      });
    }
  }

  return suggestions;
}
