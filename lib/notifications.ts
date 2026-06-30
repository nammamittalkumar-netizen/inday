import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { NotificationItem, NotificationKind } from "@/lib/types";

const PAGE_SIZE = 20;

type CreateInput = {
  type: NotificationType;
  recipientId: string;
  actorId: string;
  postId?: string | null;
};

/**
 * Record a notification for `recipientId` triggered by `actorId`.
 *
 * Best-effort: this never throws, so a notification failure can't break the
 * core action (liking, commenting, following) that triggered it.
 *
 * - Skips self-notifications (you don't get pinged for your own actions).
 * - Collapses duplicate *unread* notifications of the same kind, so a quick
 *   like → unlike → like only ever leaves one unread row.
 */
export async function createNotification({
  type,
  recipientId,
  actorId,
  postId = null,
}: CreateInput): Promise<void> {
  try {
    if (recipientId === actorId) return;

    const existing = await prisma.notification.findFirst({
      where: { type, recipientId, actorId, postId, read: false },
      select: { id: true },
    });
    if (existing) return;

    await prisma.notification.create({
      data: { type, recipientId, actorId, postId },
    });
  } catch {
    // Notifications are non-critical; swallow and move on.
  }
}

/** Count of unread notifications for the badge. */
export function getUnreadCount(recipientId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId, read: false },
  });
}

/** Mark every unread notification for this user as read. Returns the count. */
export async function markAllRead(recipientId: string): Promise<number> {
  const { count } = await prisma.notification.updateMany({
    where: { recipientId, read: false },
    data: { read: true },
  });
  return count;
}

/**
 * Load a page of a user's notifications, newest first, plus the current
 * unread count. Cursor-paginated like the post feed.
 */
export async function getNotifications(
  recipientId: string,
  cursor?: string | null,
): Promise<{
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        read: true,
        createdAt: true,
        actor: { select: { id: true, name: true, image: true } },
        post: { select: { id: true, body: true } },
      },
    }),
    getUnreadCount(recipientId),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    notifications: page.map((n) => ({
      id: n.id,
      type: n.type as NotificationKind,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor,
      post: n.post,
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
    unreadCount,
  };
}
