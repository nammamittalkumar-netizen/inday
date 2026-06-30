import type { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** How many rows the user/post admin tables show per page. */
export const ADMIN_PAGE_SIZE = 20;

export type AdminStats = {
  users: number;
  posts: number;
  comments: number;
  likes: number;
  follows: number;
  conversations: number;
  messages: number;
  admins: number;
  /** Sign-ups in the last 7 days. */
  newUsers7d: number;
  /** Posts created in the last 7 days. */
  newPosts7d: number;
};

/** Aggregate platform-wide counts for the dashboard. */
export async function getAdminStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    posts,
    comments,
    likes,
    follows,
    conversations,
    messages,
    admins,
    newUsers7d,
    newPosts7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.follow.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.post.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    users,
    posts,
    comments,
    likes,
    follows,
    conversations,
    messages,
    admins,
    newUsers7d,
    newPosts7d,
  };
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  createdAt: string;
  postCount: number;
  followerCount: number;
};

export type AdminUserPage = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
};

/** Paginated, optionally-searched list of users for the admin table. */
export async function listUsers(
  search: string,
  page: number,
): Promise<AdminUserPage> {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const safePage = Math.max(1, page);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true } },
      },
    }),
  ]);

  return {
    rows: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      postCount: u._count.posts,
      followerCount: u._count.followers,
    })),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export type AdminPostRow = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: { id: string; name: string };
  likeCount: number;
  commentCount: number;
};

export type AdminPostPage = {
  rows: AdminPostRow[];
  total: number;
  page: number;
  pageCount: number;
};

/** Paginated, optionally-searched list of posts for the admin table. */
export async function listPosts(
  search: string,
  page: number,
): Promise<AdminPostPage> {
  const where: Prisma.PostWhereInput = search
    ? {
        OR: [
          { body: { contains: search, mode: "insensitive" } },
          { author: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  const safePage = Math.max(1, page);

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        body: true,
        imageUrl: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  return {
    rows: posts.map((p) => ({
      id: p.id,
      body: p.body,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
    })),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}
