"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Home, MessageCircle, PenSquare, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

/** Mobile-only bottom tab bar for top-level navigation (logged-in only). */
export function BottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;

  const user = session?.user;

  const items = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/" || pathname === "/feed",
    },
    {
      href: "/discover",
      label: "Discover",
      icon: Search,
      active: pathname === "/discover",
    },
    {
      href: "/new",
      label: "Post",
      icon: PenSquare,
      active: pathname === "/new",
    },
    {
      href: "/notifications",
      label: "Alerts",
      icon: Bell,
      active: pathname === "/notifications",
    },
    {
      href: "/messages",
      label: "Chats",
      icon: MessageCircle,
      active: pathname.startsWith("/messages"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: null,
      active: pathname.startsWith("/profile") || pathname === "/settings",
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-6">
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? (
              <Icon className="size-5" />
            ) : (
              <UserAvatar
                name={user?.name}
                image={user?.image}
                className={cn("size-5", active && "ring-2 ring-primary")}
                fallbackClassName="text-[0.6rem]"
              />
            )}
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
