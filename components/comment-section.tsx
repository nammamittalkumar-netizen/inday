"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/format";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { PostComment } from "@/lib/types";

const MAX = 300;

type Props = {
  postId: string;
  initialComments: PostComment[];
  currentUserId: string | null;
};

export function CommentSection({
  postId,
  initialComments,
  currentUserId,
}: Props) {
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const value = body.trim();
    if (!value) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ comment: PostComment }>(
        `/api/posts/${postId}/comments`,
        { method: "POST", body: JSON.stringify({ body: value }) },
      );
      setComments((prev) => [...prev, res.comment]);
      setBody("");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't add comment",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      await apiFetch(`/api/comments/${id}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't delete comment",
      );
    }
  }

  return (
    <section className="space-y-4" aria-label="Comments">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {currentUserId ? (
        <form onSubmit={addComment} className="space-y-2">
          <label htmlFor="comment" className="sr-only">
            Add a comment
          </label>
          <Textarea
            id="comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={MAX}
            placeholder="Add a comment…"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {body.length}/{MAX}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || body.trim().length === 0}
            >
              {submitting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-3">
            <Link href={`/profile/${c.author.id}`} aria-label={c.author.name}>
              <UserAvatar
                name={c.author.name}
                image={c.author.image}
                className="size-8"
                fallbackClassName="text-xs"
              />
            </Link>
            <div className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <Link
                    href={`/profile/${c.author.id}`}
                    className="font-medium hover:underline"
                  >
                    {c.author.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {" · "}
                    <time dateTime={c.createdAt}>{relativeTime(c.createdAt)}</time>
                  </span>
                </div>
                {currentUserId === c.author.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground"
                    aria-label="Delete comment"
                    onClick={() => deleteComment(c.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                {c.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
