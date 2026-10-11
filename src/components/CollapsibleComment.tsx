"use client";

import { useEffect, useRef, useState } from "react";

const COLLAPSED_LINES = 6;

// Clamps work.comment to 6 lines with a show-more/less toggle, only when
// the content actually overflows that many lines *at the current rendered
// width* — re-checked on resize via ResizeObserver, not just on mount,
// since the same text can wrap to a different number of lines at a
// different viewport width.
export default function CollapsibleComment({
  text,
  showMoreLabel,
  showLessLabel,
}: {
  text: string;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  // A hidden clone, always clamped to COLLAPSED_LINES regardless of
  // `expanded`, used purely to measure whether the real text overflows at
  // the current width — the visible paragraph can't double as this
  // measurement once expanded (no clamp applied there -> scrollHeight
  // trivially equals clientHeight), so overflow could never be
  // (re-)detected while expanded without a separate always-clamped copy.
  const measureRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const clampStyle = !expanded
    ? {
        display: "-webkit-box",
        WebkitLineClamp: COLLAPSED_LINES,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
        // Softly fades the last visible line when collapsed, as a visual
        // cue that there's more below — only while actually clamped (an
        // unclamped, non-overflowing paragraph has nothing to hint at).
        ...(overflowing
          ? {
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
            }
          : {}),
      }
    : undefined;

  return (
    <div className="relative">
      <p
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute inset-x-0 top-0 -z-10 whitespace-pre-line text-[15px] leading-relaxed"
        style={{ display: "-webkit-box", WebkitLineClamp: COLLAPSED_LINES, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {text}
      </p>

      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft" style={clampStyle}>
        {text}
      </p>

      {overflowing && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? showLessLabel : showMoreLabel}
            className="hover-glow-text flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs transition-colors hover:border-accent-teal"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      )}
    </div>
  );
}
