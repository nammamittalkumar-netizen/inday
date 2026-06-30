"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { FeedPost } from "@/lib/types";

type Props = {
  post: FeedPost;
  currentUserId: string | null;
  /** When true the body links to the post detail page. */
  linkToDetail?: boolean;
  onDeleted?: (id: string) => void;
};

export function PostCard({
  post: initial,
  currentUserId,
  linkToDetail = true,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId === post.author.id;

  // Logged-out visitors only get a preview: the server already truncated the
  // body and stripped the photo, so full content never reaches the client.
  const gated = post.gated;

  async function toggleLike() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    if (liking) return;
    setLiking(true);

    // Optimistic update.
    const prev = { likedByMe: post.likedByMe, likeCount: post.likeCount };
    setPost((p) => ({
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
    }));

    try {
      const res = await apiFetch<{ liked: boolean; likeCount: number }>(
        `/api/posts/${post.id}/like`,
        { method: "POST" },
      );
      setPost((p) => ({ ...p, likedByMe: res.liked, likeCount: res.likeCount }));
    } catch (err) {
      setPost((p) => ({ ...p, ...prev })); // rollback
      toast.error(err instanceof ApiError ? err.message : "Couldn't update like");
    } finally {
      setLiking(false);
    }
  }

  async function saveEdit() {
    const body = draft.trim();
    if (body.length === 0) {
      toast.error("Post can't be empty");
      return;
    }
    if (body.length > 500) {
      toast.error("Posts are limited to 500 characters");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      setPost((p) => ({ ...p, body }));
      setEditing(false);
      toast.success("Post updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/posts/${post.id}`, { method: "DELETE" });
      toast.success("Post deleted");
      onDeleted?.(post.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete post");
      setDeleting(false);
    }
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5",
        deleting && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/profile/${post.author.id}`}
          aria-label={post.author.name}
          className="transition-transform hover:scale-105"
        >
          <UserAvatar
            name={post.author.name}
            image={post.author.image}
            className="size-11 ring-2 ring-transparent transition-shadow hover:ring-primary/20"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 text-sm">
              <Link
                href={`/profile/${post.author.id}`}
                className="font-semibold hover:underline"
              >
                {post.author.name}
              </Link>
              <span className="text-muted-foreground">
                {" · "}
                <time dateTime={post.createdAt}>
                  {relativeTime(post.createdAt)}
                </time>
              </span>
            </div>

            {isOwner && !editing && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground"
                      aria-label="Post options"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={deletePost}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                rows={3}
                aria-label="Edit post"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(post.body);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : gated ? (
            <Link href="/login" className="block">
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-muted-foreground">
                {post.body}
              </p>
            </Link>
          ) : linkToDetail ? (
            <Link href={`/post/${post.id}`} className="block">
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {post.body}
              </p>
            </Link>
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {post.body}
            </p>
          )}

          {!editing && !gated && post.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <Image
                src={post.imageUrl}
                alt="Incident photo"
                width={680}
                height={510}
                sizes="(max-width: 640px) 100vw, 600px"
                className="max-h-[28rem] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          )}

          {!editing && gated && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="size-3.5" />
                Log in to read the full post, like &amp; comment
              </span>
              <Button render={<Link href="/login" />} size="sm">
                Log in
              </Button>
            </div>
          )}

          {!editing && !gated && linkToDetail && post.commentCount > 0 && (
            <div className="mt-3 space-y-0.5">
              {post.commentCount > post.previewComments.length && (
                <Link
                  href={`/post/${post.id}`}
                  className="block text-sm text-muted-foreground hover:underline"
                >
                  View all {post.commentCount}{" "}
                  {post.commentCount === 1 ? "comment" : "comments"}
                </Link>
              )}
              {post.previewComments.map((c) => (
                <p key={c.id} className="truncate text-[15px] leading-relaxed">
                  <Link
                    href={`/profile/${c.authorId}`}
                    className="font-semibold hover:underline"
                  >
                    {c.authorName}
                  </Link>{" "}
                  <span className="text-foreground/90">{c.body}</span>
                </p>
              ))}
            </div>
          )}

          {!editing && !gated && (
            <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-2 text-muted-foreground">
              <button
                type="button"
                onClick={toggleLike}
                aria-pressed={post.likedByMe}
                aria-label={post.likedByMe ? "Unlike" : "Like"}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors active:scale-95",
                  post.likedByMe
                    ? "text-rose-600 hover:bg-rose-500/10"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                <Heart
                  className={cn(
                    "size-4 transition-transform",
                    post.likedByMe && "scale-110 fill-current",
                  )}
                />
                <span className="tabular-nums">{post.likeCount}</span>
              </button>

              <Link
                href={`/post/${post.id}`}
                aria-label="View comments"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground active:scale-95"
              >
                <MessageCircle className="size-4" />
                <span className="tabular-nums">{post.commentCount}</span>
              </Link>

              <ShareButton
                path={`/post/${post.id}`}
                variant="ghost"
                size="icon-sm"
                label="Share post"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
