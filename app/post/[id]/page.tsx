import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getPostDetail } from "@/lib/posts";
import { getCurrentUserId } from "@/lib/session";
import { PostCard } from "@/components/post-card";
import { CommentSection } from "@/components/comment-section";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostDetail(id, null);
  if (!post) return { title: "Post not found" };
  const snippet = post.body.slice(0, 70);
  return {
    title: `${post.author.name}: ${snippet}${post.body.length > 70 ? "…" : ""}`,
    description: post.body.slice(0, 160),
  };
}

export default async function PostPage({ params }: Params) {
  const { id } = await params;
  const currentUserId = await getCurrentUserId();
  // Full posts (with comments) are members-only — gate logged-out visitors.
  if (!currentUserId) redirect(`/login?callbackUrl=/post/${id}`);

  const post = await getPostDetail(id, currentUserId);
  if (!post) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      <PostCard post={post} currentUserId={currentUserId} linkToDetail={false} />

      <CommentSection
        postId={post.id}
        initialComments={post.comments}
        currentUserId={currentUserId}
      />
    </div>
  );
}
