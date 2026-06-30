import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";

import { listPosts } from "@/lib/admin-data";
import { relativeTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { PostActions } from "@/components/admin/post-actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminPostsPage({ searchParams }: SearchParams) {
  const { q, page } = await searchParams;
  const query = q?.trim() ?? "";
  const currentPage = Number(page) || 1;

  const { rows, total, pageCount, page: safePage } = await listPosts(
    query,
    currentPage,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Posts <span className="text-muted-foreground">({total})</span>
        </h2>
        <AdminSearch
          action="/admin/posts"
          defaultValue={query}
          placeholder="Search body or author…"
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No posts match “{query}”.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <Card
              key={p.id}
              className="transition-colors hover:border-foreground/20 hover:bg-muted/30"
            >
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <Link
                      href={`/profile/${p.author.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {p.author.name}
                    </Link>
                    <span>·</span>
                    <Link href={`/post/${p.id}`} className="hover:underline">
                      {relativeTime(p.createdAt)}
                    </Link>
                  </div>
                  <p className="line-clamp-3 text-sm whitespace-pre-wrap">
                    {p.body}
                  </p>
                  {p.imageUrl ? (
                    <p className="text-xs text-muted-foreground">📷 has image</p>
                  ) : null}
                  <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5" />
                      {p.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" />
                      {p.commentCount}
                    </span>
                  </div>
                </div>
                <PostActions postId={p.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdminPagination
        basePath="/admin/posts"
        page={safePage}
        pageCount={pageCount}
        query={query}
      />
    </div>
  );
}
