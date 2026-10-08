"use client";

import { useEffect, useState, type ReactNode } from "react";

// Past this much scroll — on every page, not just the home page — the
// header switches from fully transparent (so whatever's underneath, Hero's
// night sky or any other page's own top content, reads as full-bleed right
// up to the viewport edge) to its gradient-backed "solid" state (so nav
// text stays legible once content has scrolled up underneath it). Tuned by
// eye — small enough that the switch happens right as content starts
// passing under the header, not well after.
const SCROLL_THRESHOLD_PX = 40;

export default function HeaderChrome({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    function apply() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply(); // covers landing already scrolled (e.g. a hash anchor) on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 px-5 py-4 header-chrome ${scrolled ? "header-solid" : "header-transparent"}`}>
      {children}
    </header>
  );
}
