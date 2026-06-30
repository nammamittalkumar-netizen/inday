"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Home, MessageCircle, PenSquare, User } from "lucide-react";

import { cn } from "@/lib/utils";

/** Mobile-only bottom tab bar for top-level navigation (logged-in only). */
export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== "authenticated") return null;

  const items = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/" || pathname === "/feed",
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
      icon: User,
      active: pathname.startsWith("/profile") || pathname === "/settings",
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-5">
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
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
