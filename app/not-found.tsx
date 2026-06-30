import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page or post you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button render={<Link href="/" />} className="mt-6">
        Back to feed
      </Button>
    </div>
  );
}
