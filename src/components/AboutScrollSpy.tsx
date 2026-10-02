"use client";

import { useEffect } from "react";
import { setScrollSpyHash } from "@/components/useTrackedHash";

// Flips the nav's active item between "Top" and "About me" as the About
// section crosses the vertical center of the viewport during a manual
// scroll. Goes through setScrollSpyHash -> the same `hash` state
// useTrackedHash already exposes to clicks, rather than a second parallel
// mechanism that could drift out of sync with it (which is how the
// original About-me-indicator bug happened in the first place).
export default function AboutScrollSpy({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScrollSpyHash("#about");
          return;
        }
        // Outside the center band: above viewport-mid means the section
        // hasn't been reached yet (still "Top"); below means it's already
        // been scrolled past (stays "About me" — nothing else follows it
        // on this page).
        const stillApproaching = entry.boundingClientRect.top > window.innerHeight / 2;
        setScrollSpyHash(stillApproaching ? "" : "#about");
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return null;
}
