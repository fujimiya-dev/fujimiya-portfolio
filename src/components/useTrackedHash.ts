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
// A same-page scroll-spy (see AboutScrollSpy) needs to flip the active nav
// item between "Top" and "About me" without a real navigation or hash
// change — there's nothing for hashchange/pathname to fire on. Every
// useTrackedHash instance (HorizonNav, MobileMenu) listens for this custom
// event instead, so scroll-driven updates land on the exact same `hash`
// state a click already uses, rather than a second parallel mechanism that
// could drift out of sync with it (which is exactly how the original
// About-me glow bug happened).
const SCROLL_SPY_EVENT = "app:scrollspy-hash";

// Click navigation and the scroll-spy observer can briefly disagree about
// which section is active while a click's scroll-into-view is still in
// flight. Suppressing scroll-spy-driven updates for a short window after a
// Top/About-me click lets the click's own optimistic value win outright
// instead of being fought over mid-scroll.
let scrollSpySuppressedUntil = 0;

export function suppressScrollSpyHash(durationMs: number) {
  scrollSpySuppressedUntil = Date.now() + durationMs;
}

export function setScrollSpyHash(hash: string) {
  if (Date.now() < scrollSpySuppressedUntil) return;
  window.dispatchEvent(new CustomEvent<string>(SCROLL_SPY_EVENT, { detail: hash }));
}

// markPendingHash flags that the upcoming pathname change was caused by
// one of our own tracked clicks (whose target hash is already known for
// certain), so the pathname-triggered resync is skipped exactly once for
// it instead of racing Next's own update.
export function useTrackedHash() {
  const pathname = usePathname();
  // Always starts at "" — never reads window.location.hash here. The hash
  // fragment is never sent to the server, so SSR can only ever render "".
  // Reading the real hash in this initializer (the previous version did)
  // meant the client's very first render — the one React diffs against the
  // server HTML during hydration — disagreed with the server on any hard
  // load of a hash URL (confirmed: loading "/#about" directly threw "Hydration
  // failed... this tree will be regenerated on the client", discarding and
  // rebuilding the whole nav). Starting at "" here matches the server
  // exactly; the pathname-effect below already runs once on mount regardless
  // of its dependency array and immediately corrects this to the real value,
  // same match-first-correct-second pattern React expects for anything only
  // knowable client-side.
  const [hash, setHashState] = useState("");
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
    const onScrollSpyHash = (e: Event) => setHashState((e as CustomEvent<string>).detail);
    window.addEventListener(SCROLL_SPY_EVENT, onScrollSpyHash);
    return () => window.removeEventListener(SCROLL_SPY_EVENT, onScrollSpyHash);
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
    // pendingRef only needs to be set when this click is ALSO about to
    // change pathname (arriving at "/" from elsewhere) — that's the only
    // case where the pathname-effect above is about to fire and would
    // otherwise race this value. A Top<->About-me click while pathname is
    // already "/" doesn't change pathname at all, so that effect never
    // re-fires as a result of it — if pendingRef were set here anyway, it
    // would sit there unconsumed and wrongly skip the *next*, unrelated
    // pathname change instead (confirmed: About me -> Works left this
    // instance's hash permanently stuck at "#about", since the Works
    // navigation's pathname-effect saw a stale pendingRef=true left over
    // from the earlier same-page About-me click and skipped resyncing).
    if (pathname !== "/") pendingRef.current = true;
    setHashState(nextHash);
  }

  return [hash, markPendingHash] as const;
}
