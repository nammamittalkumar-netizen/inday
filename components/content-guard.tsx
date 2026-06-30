"use client";

import { useEffect } from "react";

/**
 * Discourages casual copying and inspection: blocks copy/cut, the right-click
 * context menu, and common devtools / view-source keyboard shortcuts.
 *
 * NOTE: This is a deterrent only. Anyone can still read the page via "disable
 * JavaScript", the browser menu, or by opening devtools before the page loads.
 * Client-side code can never be truly hidden — don't rely on this for secrecy.
 */
export function ContentGuard() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      // `e.key` can be undefined for some synthetic events (autofill, IME),
      // so read it defensively — never call a method on it directly.
      const rawKey = e.key;
      if (typeof rawKey !== "string" || rawKey.length === 0) return;
      const key = rawKey.toLowerCase();

      const isDevtools =
        rawKey === "F12" ||
        // Ctrl/Cmd+Shift+I / J / C  → devtools
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        // Ctrl/Cmd+U → view source
        ((e.ctrlKey || e.metaKey) && key === "u") ||
        // Ctrl/Cmd+S → save page
        ((e.ctrlKey || e.metaKey) && key === "s");

      // Block copy/cut shortcuts except inside form fields.
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const isCopyCut =
        (e.ctrlKey || e.metaKey) && ["c", "x"].includes(key) && !inField;

      if (isDevtools || isCopyCut) e.preventDefault();
    };

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
