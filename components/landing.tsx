import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, PenSquare, Rss } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageMarquee } from "@/components/image-marquee";
import { HeroIntro } from "@/components/hero-intro";

const rowOne = ["cld-sample", "coffee_cup", "balloons", "shoes", "bike", "couple"];
const rowTwo = ["butterfly", "dog", "sheep", "kitten", "sample", "cld-sample-2"];

const features = [
  {
    icon: PenSquare,
    title: "Log an incident",
    body: "Write down the thing that went sideways today — in a sentence or two, with a photo if you have one.",
  },
  {
    icon: Rss,
    title: "Read the feed",
    body: "A living stream of the small incidents from everyone's day, newest first.",
  },
  {
    icon: Heart,
    title: "React & relate",
    body: "Like the ones that hit home, leave a comment, follow the people who get it.",
  },
];

const steps = [
  { n: "01", t: "Sign up", d: "Takes ten seconds. Name, email, done." },
  { n: "02", t: "Post your day", d: "Drop the incident while it's fresh." },
  { n: "03", t: "Find your people", d: "Like, comment, follow. Feel less alone." },
];

export function Landing() {
  return (
    <div className="space-y-20 py-6">
      {/* ── Hero (GSAP load animation) ─────────────────────── */}
      <HeroIntro />

      {/* ── Scrolling image strips (full-bleed, break out of the column) ── */}
      <section
        className="fade-up relative left-1/2 w-screen -translate-x-1/2 space-y-3 sm:space-y-4"
        style={{ animationDelay: "360ms" }}
      >
        <ImageMarquee ids={rowOne} scrollDriven />
        <ImageMarquee ids={rowTwo} reverse scrollDriven />
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            A tiny ritual for the end of your day
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            No followers to perform for. Just the honest small stuff.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-3 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ n, t, d }) => (
          <div key={n} className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="text-3xl font-bold tracking-tight text-primary/30">
              {n}
            </div>
            <h3 className="mt-1 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-rose-500/10 px-6 py-12 text-center shadow-sm">
        <MessageCircle className="pointer-events-none absolute -right-6 -top-6 size-32 text-primary/10" />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Had one of those days?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          It takes ten seconds to sign up and get it off your chest.
        </p>
        <div className="mt-6">
          <Button render={<Link href="/signup" />} size="lg" className="group">
            Get started — it&apos;s free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
