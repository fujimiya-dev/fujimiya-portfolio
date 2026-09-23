"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import introPathData from "./introPathData.json";

// Timing (ms), per spec: 2.6s stroke-on trace, 0.6s hold, 0.5s fade-out.
const DRAW_MS = 2600;
const HOLD_MS = 600;
const FADE_MS = 500;
// Each glyph's own trace takes this fraction of DRAW_MS, with glyphs'
// start times staggered evenly across the remaining span so consecutive
// letters overlap slightly — reading as one continuous left-to-right
// stroke rather than a per-letter typewriter chop.
const PER_GLYPH_FRACTION = 0.35;

type Phase = "drawing" | "fading" | "done";

export default function IntroOverlay() {
  const [phase, setPhase] = useState<Phase>("drawing");
  // TopNav/main each create their own stacking context in layout.tsx, so a
  // z-index alone here can't escape main's context to sit above TopNav —
  // portal straight onto <body> instead, where our z-index is compared
  // directly against TopNav's.
  const [mounted, setMounted] = useState(false);
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

    const toFading = setTimeout(() => setPhase("fading"), DRAW_MS + HOLD_MS);
    const toDone = setTimeout(() => setPhase("done"), DRAW_MS + HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(toFading);
      clearTimeout(toDone);
    };
  }, [mounted]);

  if (phase === "done" || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020308]"
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox={introPathData.viewBox}
        style={{
          width: "min(90vw, 900px)",
          height: "auto",
          filter: "drop-shadow(0 0 8px #1E40FF) drop-shadow(0 0 20px #1E40FF)",
        }}
      >
        <defs>
          <filter id="intro-glow" x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {introPathData.glyphs.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={d}
            fill="none"
            stroke="#eaf6ff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#intro-glow)"
          />
        ))}
      </svg>
    </div>,
    document.body
  );
}
