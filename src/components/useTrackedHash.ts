"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Tracks window.location.hash alongside Next's usePathname() — needed
// because hash-based nav items ("About me" -> "/#about") share the same
// pathname ("/") as plain-route items ("Top" -> "/") and can only be told
// apart by hash.
//
// The naive version of this — a plain `useEffect(() =>
// setHash(window.location.hash), [pathname])` — is racy: a client-side
// <Link> navigation to a hash updates window.location.hash slightly
// *after* the new route's first render/effect pass (confirmed earlier
// while building IntroPlayingContext's own hash handling). That means the
// pathname-triggered effect can read the *stale* hash and stomp back over
// the correct value an onClick handler already set optimistically moments
// earlier — which is exactly what made the active-item glow (and the
// mobile menu's active-page text) silently fail to update specifically
// for "About me": its pathname change ("/works" -> "/") always coincides
// with this exact race, while every other nav item's pathname change
// alone is enough to resolve correctly regardless of hash.
//
// markPendingHash flags that the upcoming pathname change was caused by
// one of our own tracked clicks (whose target hash is already known for
// certain), so the pathname-triggered resync is skipped exactly once for
// it instead of racing Next's own update.
export function useTrackedHash() {
  const pathname = usePathname();
  const [hash, setHashState] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const pendingRef = useRef(false);

  useEffect(() => {
    // Covers browser back/forward and any other hash change that isn't
    // one of our own tracked clicks (those go through markPendingHash
    // instead, further down).
    const onHashChange = () => setHashState(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (pendingRef.current) {
      pendingRef.current = false;
      return;
    }
    // Any pathname change NOT caused by a tracked click (direct load,
    // programmatic navigation, browser back/forward already also caught
    // above) — window.location.hash is reliable to read here.
    setHashState(window.location.hash);
  }, [pathname]);

  function markPendingHash(nextHash: string) {
    pendingRef.current = true;
    setHashState(nextHash);
  }

  return [hash, markPendingHash] as const;
}
