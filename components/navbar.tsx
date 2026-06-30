"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, PenSquare, LogOut, User as UserIcon, Settings, Bell, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { MessagesIndicator } from "@/components/messages-indicator";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = session?.user;

  async function handleSignOut() {
    await signOut({ redirect: false });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <BrandLogo />

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          {status === "loading" ? null : user ? (
            <>
              <MessagesIndicator />
              <NotificationBell />
              <Button render={<Link href="/new" />} size="sm">
                <PenSquare className="size-4" />
                New Post
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <UserAvatar
                    name={user.name}
                    image={user.image}
                    className="size-8"
                    fallbackClassName="text-sm"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="truncate">
                      {user.name}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <UserIcon className="size-4" />
                    My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/notifications" />}>
                    <Bell className="size-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/messages" />}>
                    <MessageCircle className="size-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost" size="sm">
                Log in
              </Button>
              <Button render={<Link href="/signup" />} size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 sm:hidden">
          {user && <MessagesIndicator />}
          {user && <NotificationBell />}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-border bg-background sm:hidden">
          <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 py-3">
            {status === "loading" ? null : user ? (
              <>
                <span className="px-1 py-2 text-sm text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {user.name}
                  </span>
                </span>
                <Button render={<Link href="/new" />} onClick={() => setOpen(false)}>
                  <PenSquare className="size-4" />
                  New Post
                </Button>
                <Button
                  render={<Link href="/profile" />}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <UserIcon className="size-4" />
                  My profile
                </Button>
                <Button
                  render={<Link href="/notifications" />}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Bell className="size-4" />
                  Notifications
                </Button>
                <Button
                  render={<Link href="/messages" />}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle className="size-4" />
                  Messages
                </Button>
                <Button
                  render={<Link href="/settings" />}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="size-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  render={<Link href="/login" />}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Button>
                <Button render={<Link href="/signup" />} onClick={() => setOpen(false)}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
