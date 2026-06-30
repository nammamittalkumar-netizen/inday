import { prisma } from "@/lib/prisma";
import type {
  Author,
  ChatMessage,
  ConversationSummary,
  MessagePage,
} from "@/lib/types";

const PAGE_SIZE = 30;

/** Canonical key for a 1:1 thread — order-independent, so one thread per pair. */
function conversationKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

/**
 * Can `meId` message `otherId`? Instagram-style: only when they **follow each
 * other** (a mutual connection). Requires both follow rows to exist.
 */
export async function canMessage(
  meId: string,
  otherId: string,
): Promise<boolean> {
  if (meId === otherId) return false;
  const mutual = await prisma.follow.count({
    where: {
      OR: [
        { followerId: meId, followingId: otherId },
        { followerId: otherId, followingId: meId },
      ],
    },
  });
  return mutual === 2;
}

/** Find or create the 1:1 conversation between two users. Returns its id. */
export async function getOrCreateConversation(
  meId: string,
  otherId: string,
): Promise<string> {
  const key = conversationKey(meId, otherId);
  const convo = await prisma.conversation.upsert({
    where: { key },
    update: {},
    create: {
      key,
      participants: { create: [{ userId: meId }, { userId: otherId }] },
    },
    select: { id: true },
  });
  return convo.id;
}

/** The current user's membership row for a conversation, or null. */
async function membership(convoId: string, meId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: convoId, userId: meId } },
    select: { id: true, lastReadAt: true },
  });
}

/** The other participant of a conversation, or null if I'm not in it. */
export async function getConversationMeta(
  convoId: string,
  meId: string,
): Promise<{ user: Author } | null> {
  const convo = await prisma.conversation.findFirst({
    where: { id: convoId, participants: { some: { userId: meId } } },
    select: {
      participants: {
        where: { userId: { not: meId } },
        select: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!convo || convo.participants.length === 0) return null;
  return { user: convo.participants[0]!.user };
}

/** Mark a conversation as read up to now for the current user. */
export async function markRead(convoId: string, meId: string): Promise<void> {
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: convoId, userId: meId },
    data: { lastReadAt: new Date() },
  });
}

/** Unread message count in one conversation for `meId`. */
function countUnread(
  convoId: string,
  meId: string,
  lastReadAt: Date | null,
): Promise<number> {
  return prisma.message.count({
    where: {
      conversationId: convoId,
      senderId: { not: meId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });
}

/** Inbox: the current user's conversations, most-recent first. */
export async function listConversations(
  meId: string,
): Promise<ConversationSummary[]> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId: meId },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          lastMessageAt: true,
          participants: {
            where: { userId: { not: meId } },
            select: { user: { select: { id: true, name: true, image: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderId: true },
          },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  });

  const summaries = await Promise.all(
    parts.map(async (p) => {
      const c = p.conversation;
      const other = c.participants[0]?.user;
      // A self-conversation or orphaned thread has no "other" — skip below.
      if (!other) return null;
      const last = c.messages[0] ?? null;
      const unread = await countUnread(c.id, meId, p.lastReadAt);
      const summary: ConversationSummary = {
        id: c.id,
        user: other,
        lastMessage: last
          ? {
              body: last.body,
              createdAt: last.createdAt.toISOString(),
              fromMe: last.senderId === meId,
            }
          : null,
        lastMessageAt: c.lastMessageAt.toISOString(),
        unread,
      };
      return summary;
    }),
  );

  return summaries.filter((s): s is ConversationSummary => s !== null);
}

/** A page of messages, newest-first (client reverses for display). */
export async function getMessages(
  convoId: string,
  meId: string,
  cursor?: string | null,
): Promise<MessagePage | null> {
  const member = await membership(convoId, meId);
  if (!member) return null;

  const rows = await prisma.message.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, body: true, createdAt: true, senderId: true },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    messages: page.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      fromMe: m.senderId === meId,
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

/** Send a message. Returns the created message, or null if not a participant. */
export async function sendMessage(
  convoId: string,
  meId: string,
  body: string,
): Promise<ChatMessage | null> {
  const member = await membership(convoId, meId);
  if (!member) return null;

  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: convoId, senderId: meId, body },
      select: { id: true, body: true, createdAt: true, senderId: true },
    }),
    prisma.conversation.update({
      where: { id: convoId },
      data: { lastMessageAt: now },
    }),
    // The sender has implicitly read up to their own message.
    prisma.conversationParticipant.updateMany({
      where: { conversationId: convoId, userId: meId },
      data: { lastReadAt: now },
    }),
  ]);

  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
    fromMe: true,
  };
}

/** Total unread messages across all of the current user's conversations. */
export async function totalUnread(meId: string): Promise<number> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId: meId },
    select: { conversationId: true, lastReadAt: true },
  });
  const counts = await Promise.all(
    parts.map((p) => countUnread(p.conversationId, meId, p.lastReadAt)),
  );
  return counts.reduce((sum, n) => sum + n, 0);
}
