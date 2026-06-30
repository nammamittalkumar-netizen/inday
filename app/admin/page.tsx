import Link from "next/link";
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  UserPlus,
  Mail,
  Shield,
  MessagesSquare,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

import { getAdminStats } from "@/lib/admin-data";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Stat = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip (bg + text). */
  accent: string;
  hint?: string;
  href?: string;
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards: Stat[] = [
    {
      label: "Users",
      value: stats.users,
      icon: Users,
      accent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      hint: `${stats.newUsers7d} new this week`,
      href: "/admin/users",
    },
    {
      label: "Posts",
      value: stats.posts,
      icon: FileText,
      accent: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      hint: `${stats.newPosts7d} new this week`,
      href: "/admin/posts",
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: MessageSquare,
      accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Likes",
      value: stats.likes,
      icon: Heart,
      accent: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Follows",
      value: stats.follows,
      icon: UserPlus,
      accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Messages",
      value: stats.messages,
      icon: Mail,
      accent: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Conversations",
      value: stats.conversations,
      icon: MessagesSquare,
      accent: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: Shield,
      accent: "bg-primary/15 text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* This-week highlight */}
      <Card className="overflow-hidden border-border bg-gradient-to-br from-primary/10 to-background">
        <CardContent className="flex flex-wrap items-center gap-8 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-4" />
            Last 7 days
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {stats.newUsers7d.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">New users</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {stats.newPosts7d.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">New posts</p>
          </div>
        </CardContent>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, accent, hint, href }) => {
          const body = (
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    accent,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {href ? (
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                ) : null}
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
                {hint ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                ) : null}
              </div>
            </CardContent>
          );

          return href ? (
            <Card
              key={label}
              className="group transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <Link href={href}>{body}</Link>
            </Card>
          ) : (
            <Card key={label}>{body}</Card>
          );
        })}
      </div>
    </div>
  );
}
