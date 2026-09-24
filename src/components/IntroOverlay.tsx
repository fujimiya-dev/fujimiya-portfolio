"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import introPathData from "./introPathData.json";

// Timing (ms).
const DRAW_MS = 4000;
const HOLD_MS = 400; // pause after the trace finishes, before the panels split
const SPLIT_MS = 1900; // panel slide-open duration
// Each glyph's own trace takes this fraction of DRAW_MS, with glyphs'
// start times staggered evenly across the remaining span so consecutive
// letters overlap slightly — reading as one continuous left-to-right
// stroke rather than a per-letter typewriter chop.
const PER_GLYPH_FRACTION = 0.35;
// Text is fully faded once the user has scrolled this fraction of one
// viewport height.
const SCROLL_FADE_VH_FRACTION = 0.6;

type Phase = "drawing" | "splitting" | "revealed";

export default function IntroOverlay() {
  const [phase, setPhase] = useState<Phase>("drawing");
  // TopNav/main each create their own stacking context in layout.tsx, so a
  // z-index alone here can't escape main's context to sit above TopNav —
  // portal straight onto <body> instead, where our z-index is compared
  // directly against TopNav's.
  const [mounted, setMounted] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Runs on the render *after* mounted flips true — the <path> elements only
  // exist in the DOM from that render onward (gated by `!mounted` below), so
  // doing this in the same effect that calls setMounted would find every
  // ref still null and silently skip the whole animation.
  useEffect(() => {
    if (!mounted) return;
    const els = pathRefs.current.filter((el): el is SVGPathElement => el !== null);
    if (els.length === 0) return;

    const perGlyphMs = DRAW_MS * PER_GLYPH_FRACTION;
    const spanMs = DRAW_MS - perGlyphMs;

    for (const el of els) {
      const length = el.getTotalLength();
      el.style.transition = "none";
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
    }
    // Force a synchronous layout flush so the browser actually commits this
    // fully-hidden state before the transitions are enabled below —
    // without it, a single rAF can still get coalesced with this write and
    // the strokes jump straight to fully drawn instead of animating.
    void els[0].getBoundingClientRect();
    requestAnimationFrame(() => {
      els.forEach((el, i) => {
        const delay = els.length > 1 ? (spanMs * i) / (els.length - 1) : 0;
        el.style.transition = `stroke-dashoffset ${perGlyphMs}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`;
        el.style.strokeDashoffset = "0";
      });
    });

    const toSplitting = setTimeout(() => setPhase("splitting"), DRAW_MS + HOLD_MS);
    const toRevealed = setTimeout(() => setPhase("revealed"), DRAW_MS + HOLD_MS + SPLIT_MS);
    return () => {
      clearTimeout(toSplitting);
      clearTimeout(toRevealed);
    };
  }, [mounted]);

  // Scroll-linked text fade — only wired up once the panels have fully split
  // open. Registering it any earlier would let an accidental scroll during
  // the trace/split fade the text out before the reveal even finishes.
  useEffect(() => {
    if (phase !== "revealed") return;

    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      setTextOpacity(Math.max(0, 1 - window.scrollY / (vh * SCROLL_FADE_VH_FRACTION)));
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  if (!mounted) return null;

  const isSplitting = phase === "splitting";
  const showPanels = phase === "drawing" || phase === "splitting";
  const panelTransition = isSplitting ? `transform ${SPLIT_MS}ms cubic-bezier(0.76, 0, 0.24, 1)` : "none";

  return createPortal(
    <>
      {showPanels && (
        <>
          <div
            className="fixed inset-x-0 top-0 z-[99] bg-[#020308]"
            style={{
              height: "50vh",
              transform: isSplitting ? "translateY(-100%)" : "translateY(0)",
              transition: panelTransition,
            }}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[99] bg-[#020308]"
            style={{
              height: "50vh",
              transform: isSplitting ? "translateY(100%)" : "translateY(0)",
              transition: panelTransition,
            }}
            aria-hidden="true"
          />
        </>
      )}

      <svg
        viewBox={introPathData.viewBox}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: "min(90vw, 900px)",
          height: "auto",
          opacity: textOpacity,
          pointerEvents: textOpacity <= 0 ? "none" : "auto",
          // Glow comes entirely from these two stacked CSS drop-shadows now.
          // An SVG feGaussianBlur filter on the strokes was tried too, but
          // stacking a third blur pass on top of these two produced visible
          // 8-bit banding in the glow gradient — these alone render smooth
          // and the crisp core stroke reads better besides.
          filter: "drop-shadow(0 0 8px #1E40FF) drop-shadow(0 0 20px #1E40FF)",
        }}
        aria-hidden="true"
      >
        {introPathData.glyphs.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={d}
            fill="none"
            stroke="#eaf6ff"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </>,
    document.body
  );
}
