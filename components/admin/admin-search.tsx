import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Plain GET form that pushes `?q=` (and resets to page 1) — server-rendered,
 * no client JS needed. `action` is the route segment to submit back to.
 */
export function AdminSearch({
  action,
  defaultValue,
  placeholder,
}: {
  action: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <form action={action} className="flex gap-2">
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="max-w-xs"
      />
      <Button type="submit" variant="outline">
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}
