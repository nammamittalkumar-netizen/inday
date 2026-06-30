import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Prev/next pager that preserves the current `?q=` search term. */
export function AdminPagination({
  basePath,
  page,
  pageCount,
  query,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  query: string;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="size-4" />
            Prev
          </Button>
        ) : (
          <Button render={<Link href={href(page - 1)} />} variant="outline" size="sm">
            <ChevronLeft className="size-4" />
            Prev
          </Button>
        )}
        {page >= pageCount ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button render={<Link href={href(page + 1)} />} variant="outline" size="sm">
            Next
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
