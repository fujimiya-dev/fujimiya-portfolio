"use client";

import { useEffect, useRef, useState } from "react";
import HorizonNav from "@/components/HorizonNav";
import LanguageToggle from "@/components/LanguageToggle";
import IntroTriggerLink from "@/components/IntroTriggerLink";
import type { Locale } from "@/i18n/types";

const LOGO_CLASS = "font-intro text-[27px] text-[#eaf6ff] [text-shadow:0_0_4px_#eaf6ff,0_0_11px_#7FB7FF,0_0_22px_#1E40FF]";

export default function DesktopNavBar({
  links,
  locale,
}: {
  links: { href: string; label: string }[];
  locale: Locale;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [logoRect, setLogoRect] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    function update() {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      // Midpoint between the screen edge (x=0) and the bar's actual left
      // edge (where "Top" starts) — measured live so it tracks the bar's
      // real position (which shifts with locale/label-width/viewport)
      // instead of a value that would drift out of sync.
      setLogoRect({ left: rect.left / 2, top: rect.top });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center lg:grid">
      <div aria-hidden="true" />
      <div className="flex items-center gap-7 whitespace-nowrap">
        {/* Invisible same-size placeholder — keeps this row's total width
            (and therefore the grid's centering of the bar as a whole)
            byte-for-byte identical to when the logo rendered inline here.
            The real, visible logo is the separately fixed-positioned
            element below, driven by a live measurement rather than static
            CSS, since "screen edge to bar edge" isn't expressible as a
            fixed offset — it depends on the bar's actual rendered
            position, which itself depends on locale/label widths. */}
        <span className={`${LOGO_CLASS} invisible`} aria-hidden="true">
          Fujimiya.dev
        </span>
        <div ref={barRef} className="flex items-center gap-7 whitespace-nowrap">
          <HorizonNav links={links} />
          <span className="h-4 w-px bg-[rgba(158,212,255,0.35)]" aria-hidden="true" />
          <LanguageToggle current={locale} />
        </div>
      </div>
      <div aria-hidden="true" />

      {logoRect && (
        <div className="fixed z-50" style={{ left: logoRect.left, top: logoRect.top }}>
          <IntroTriggerLink href="/" className={LOGO_CLASS}>
            Fujimiya.dev
          </IntroTriggerLink>
        </div>
      )}
    </div>
  );
}
