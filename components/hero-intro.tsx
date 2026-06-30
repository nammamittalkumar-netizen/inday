"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

import { Button } from "@/components/ui/button";

/**
 * Landing hero. The text + CTAs animate in on load with a staggered GSAP
 * timeline. `gsap.from` sets the start state inside useLayoutEffect (before
 * paint) so there's no flash of the final position. Reduced-motion users get
 * the static, already-visible markup.
 */
export function HeroIntro() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-animate]", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="space-y-6 text-center">
      <span
        data-animate
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
      >
        <Sparkles className="size-3.5 text-primary" />
        The diary of small disasters
      </span>

      <h1
        data-animate
        className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
      >
        Everything that happened,{" "}
        <span className="bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">
          in a day.
        </span>
      </h1>

      <p
        data-animate
        className="mx-auto max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
      >
        <span className="font-semibold text-foreground">Inday</span> is a public
        feed for the small things that went sideways today — the spilled coffee,
        the missed bus, the bug that ate three hours. Post yours, read theirs.
      </p>

      <div
        data-animate
        className="flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <Button render={<Link href="/signup" />} size="lg" className="group">
          Create your account
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <Button render={<Link href="/feed" />} variant="outline" size="lg">
          Browse the feed
        </Button>
      </div>

      <p data-animate className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
