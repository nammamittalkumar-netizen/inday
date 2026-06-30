import { prisma } from "@/lib/prisma";
import type {
  FeedMode,
  FeedPage,
  FeedPost,
  PostDetail,
  PreviewComment,
} from "@/lib/types";

/** How many recent comments to surface as an inline preview on a card. */
const PREVIEW_COMMENTS = 2;

export const PAGE_SIZE = 10;

/** How far back the "trending" tab looks. */
const TRENDING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch a page of feed posts using cursor pagination.
 *
 * - `for-you`   — every post, newest first (default).
 * - `following` — only posts from people `currentUserId` follows, newest first.
 * - `trending`  — most-liked posts from the last 24h (single ranked page).
 *
 * `currentUserId` determines `likedByMe` per post.
 */
export async function getFeed(
  cursor: string | null,
  currentUserId: string | null,
  mode: FeedMode = "for-you",
): Promise<FeedPage> {
  const gated = !currentUserId;

  if (mode === "trending") {
    const since = new Date(Date.now() - TRENDING_WINDOW_MS);
    const posts = await prisma.post.findMany({
      take: PAGE_SIZE,
      where: { createdAt: { gte: since } },
      // Most-liked first, then most-commented, then newest as tiebreakers.
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      select: postSelect(currentUserId),
    });
    return {
      posts: posts.map((p) => serializePost(p, gated)),
      nextCursor: null, // trending is a single ranked page
    };
  }

  // "following" needs the set of authors the viewer follows.
  let where: { authorId?: { in: string[] } } | undefined;
  if (mode === "following") {
    if (!currentUserId) return { posts: [], nextCursor: null };
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const ids = follows.map((f) => f.followingId);
    if (ids.length === 0) return { posts: [], nextCursor: null };
    where = { authorId: { in: ids } };
  }

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE + 1, // fetch one extra to detect the next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    ...(where ? { where } : {}),
    orderBy: { createdAt: "desc" },
    select: postSelect(currentUserId),
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  return {
    posts: page.map((p) => serializePost(p, gated)),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

export async function getPostsByAuthor(
  authorId: string,
  currentUserId: string | null,
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: postSelect(currentUserId),
  });
  return posts.map((p) => serializePost(p, !currentUserId));
}

/** Posts a given user has liked, newest-liked first. */
export async function getLikedPosts(
  userId: string,
  currentUserId: string | null,
): Promise<FeedPost[]> {
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { post: { select: postSelect(currentUserId) } },
  });
  return likes.map((l) => serializePost(l.post, !currentUserId));
}

/** Comments a given user has written, newest first, with post context. */
export async function getCommentsByAuthor(authorId: string) {
  const comments = await prisma.comment.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      post: { select: { id: true, body: true } },
    },
  });
  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    post: c.post,
  }));
}

export async function getPostDetail(
  id: string,
  currentUserId: string | null,
): Promise<PostDetail | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      ...postSelect(currentUserId),
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!post) return null;

  return {
    ...serializePost(post, !currentUserId),
    comments: post.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
  };
}

// ── helpers ──────────────────────────────────────────────────────────

function postSelect(currentUserId: string | null) {
  return {
    id: true,
    body: true,
    imageUrl: true,
    createdAt: true,
    updatedAt: true,
    author: { select: { id: true, name: true, image: true } },
    _count: { select: { likes: true, comments: true } },
    likes: currentUserId
      ? { where: { userId: currentUserId }, select: { id: true } }
      : { where: { id: "__none__" }, select: { id: true } },
    // Most-recent comments for the inline preview (newest first; the serializer
    // reverses them so they read oldest → newest, Instagram-style).
    comments: {
      take: PREVIEW_COMMENTS,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        author: { select: { id: true, name: true } },
      },
    },
  } as const;
}

type RawPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; image: string | null };
  _count: { likes: number; comments: number };
  likes: { id: string }[];
  comments?: { id: string; body: string; author: { id: string; name: string } }[];
};

const PREVIEW_LEN = 80;

/**
 * @param gated when true (logged-out viewer) only a short text preview is
 *   returned and the image URL is stripped, so full content never reaches the
 *   client.
 */
function serializePost(post: RawPost, gated: boolean): FeedPost {
  // Newest-first from the DB → reverse to read oldest → newest under the post.
  const previewComments: PreviewComment[] = gated
    ? []
    : (post.comments ?? [])
        .slice(0, PREVIEW_COMMENTS)
        .reverse()
        .map((c) => ({
          id: c.id,
          authorId: c.author.id,
          authorName: c.author.name,
          body: c.body,
        }));

  return {
    id: post.id,
    body: gated ? post.body.slice(0, PREVIEW_LEN).trimEnd() + "…" : post.body,
    imageUrl: gated ? null : post.imageUrl,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    previewComments,
    gated,
  };
}
