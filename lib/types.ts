export type PreviewComment = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
};

export type Author = {
  id: string;
  name: string;
  image: string | null;
};

export type FeedPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** A couple of most-recent comments, oldest-first, for an inline preview. */
  previewComments: PreviewComment[];
  /** True when only a preview is sent (logged-out visitor). */
  gated: boolean;
};

export type FeedPage = {
  posts: FeedPost[];
  nextCursor: string | null;
};

/** Which slice of posts a feed request wants. */
export type FeedMode = "for-you" | "following" | "trending";

export const FEED_MODES: FeedMode[] = ["for-you", "following", "trending"];

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
};

export type PostDetail = FeedPost & {
  comments: PostComment[];
};

export type PublicUser = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
};

export type ProfileStats = {
  posts: number;
  likesReceived: number;
  comments: number;
  followers: number;
  following: number;
};

export type ProfileComment = {
  id: string;
  body: string;
  createdAt: string;
  post: { id: string; body: string };
};

export type Profile = PublicUser & {
  stats: ProfileStats;
  isFollowing: boolean;
  isMe: boolean;
};

/** A user as shown in a followers/following list. */
export type FollowUser = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  /** Does the current viewer follow this user? */
  isFollowing: boolean;
  /** Is this the current viewer? */
  isMe: boolean;
};

export type FollowUserPage = {
  users: FollowUser[];
  nextCursor: string | null;
};

export type FollowConnectionType = "followers" | "following";

export type NotificationKind = "LIKE" | "COMMENT" | "FOLLOW";

export type NotificationItem = {
  id: string;
  type: NotificationKind;
  read: boolean;
  createdAt: string;
  actor: Author;
  /** Present for LIKE/COMMENT; a short preview of the post body. */
  post: { id: string; body: string } | null;
};

export type NotificationPage = {
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
};

/** A direct-message conversation as shown in the inbox list. */
export type ConversationSummary = {
  id: string;
  /** The other participant (1:1 chats). */
  user: Author;
  lastMessage: {
    body: string;
    createdAt: string;
    /** True when the current user sent the last message. */
    fromMe: boolean;
  } | null;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  /** True when the current user sent it. */
  fromMe: boolean;
};

export type MessagePage = {
  messages: ChatMessage[];
  nextCursor: string | null;
};
