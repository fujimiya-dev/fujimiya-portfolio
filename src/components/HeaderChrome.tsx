"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HOME_PATHS } from "@/components/HorizonNav";

// Past this much scroll on the home page, the header switches from
// transparent (so Hero's night sky/grass reads as full-bleed on first
// load) to solid+blurred (so nav text stays legible once page content has
// scrolled up underneath it). Tuned by eye — small enough that the switch
// happens right as content starts passing under the header, not well after.
const SCROLL_THRESHOLD_PX = 40;

export default function HeaderChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = HOME_PATHS.includes(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Non-home pages are always in the solid state (see `solid` below) —
    // no need to pay for a scroll listener there.
    if (!isHome) return;

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
  }, [isHome]);

  const solid = !isHome || scrolled;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 px-5 py-4 header-chrome ${solid ? "header-solid" : "header-transparent"}`}>
      {children}
    </header>
  );
}
