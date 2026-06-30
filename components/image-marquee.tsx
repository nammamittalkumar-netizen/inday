"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const BASE =
  "https://res.cloudinary.com/demo/image/upload/w_560,h_400,c_fill,g_auto,q_auto,f_auto";

/**
 * Infinite horizontal image strip. The list is duplicated so a -50% shift is
 * seamless. By default it loops on a CSS timer (pausing on hover); with
 * `scrollDriven`, GSAP ScrollTrigger ties the horizontal position to the page
 * scroll as the section passes through the viewport. Reduced-motion users get
 * the static strip.
 */
export function ImageMarquee({
  ids,
  reverse = false,
  scrollDriven = false,
}: {
  ids: string[];
  reverse?: boolean;
  /** Drive the strip by scroll position (GSAP) instead of a timer. */
  scrollDriven?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollDriven) return;
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // Honour users who prefer less motion — leave the strip still.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        {
          xPercent: reverse ? 0 : -50,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom", // section's top hits viewport bottom
            end: "bottom top", // section's bottom hits viewport top
            scrub: 0.5, // follow scroll, with a touch of smoothing
          },
        },
      );
    }, container);

    return () => ctx.revert();
  }, [scrollDriven, reverse]);

  const doubled = [...ids, ...ids];
  return (
    <div ref={containerRef} className="marquee relative overflow-hidden">
      <div
        ref={trackRef}
        className={`marquee-track gap-3 sm:gap-4 ${reverse ? "reverse" : ""} ${
          scrollDriven ? "gsap-marquee" : ""
        }`}
      >
        {doubled.map((id, i) => (
          <div
            key={`${id}-${i}`}
            className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:h-40 sm:w-64"
          >
            <Image
              src={`${BASE}/${id}.jpg`}
              alt=""
              fill
              sizes="256px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {/* Soft edge fades so images dissolve into the background. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent sm:w-20" />
    </div>
  );
}
