"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import introPathData from "./introPathData.json";

// Timing (ms).
const DRAW_MS = 4000;
const HOLD_MS = 500; // pause after the trace finishes, before the sweep starts
const SWEEP_MS = 2800; // left-to-right color+particle sweep across all glyphs
const PER_GLYPH_COLOR_MS = 300; // each glyph's own blue->mint snap, once the sweep reaches it
const TEXT_FADE_MS = 800; // whole-text fade-out once the sweep finishes
const PARTICLES_PER_GLYPH_MIN = 3;
const PARTICLES_PER_GLYPH_MAX = 6;
const PARTICLE_MIN_MS = 1400;
const PARTICLE_MAX_MS = 2200;
const PARTICLE_MIN_DIST = 60;
const PARTICLE_MAX_DIST = 220;
// Background starts fading a little before the last-spawned particles finish
// dispersing, so the two resolve into the real Hero starfield at roughly the
// same time.
const BG_FADE_DELAY_MS = 1300;
const BG_FADE_MS = 900;
// Each glyph's own trace takes this fraction of DRAW_MS, with glyphs'
// start times staggered evenly across the remaining span so consecutive
// letters overlap slightly — reading as one continuous left-to-right
// stroke rather than a per-letter typewriter chop.
const PER_GLYPH_FRACTION = 0.35;

// Matches Starfield.tsx's cool/white/warm palette.
const PARTICLE_COLORS = ["#3ecf8e", "#a8f5c8", "#8ef0a0"];

const NEON_STROKE = "#eaf6ff";
const NEON_FILTER = "drop-shadow(0 0 8px #1E40FF) drop-shadow(0 0 20px #7FB7FF)";
const MINT_STROKE = "#a8f5c8";
const MINT_FILTER = "drop-shadow(0 0 8px #3ecf8e) drop-shadow(0 0 20px #8ef0a0)";

type Phase = "drawing" | "sweeping" | "done";

type Particle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  duration: number;
};

export default function IntroOverlay() {
  const [phase, setPhase] = useState<Phase>("drawing");
  // TopNav/main each create their own stacking context in layout.tsx, so a
  // z-index alone here can't escape main's context to sit above TopNav —
  // portal straight onto <body> instead, where our z-index is compared
  // directly against TopNav's.
  const [mounted, setMounted] = useState(false);
  const [minted, setMinted] = useState(false);
  const [textFading, setTextFading] = useState(false);
  const [bgFading, setBgFading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const particleIdRef = useRef(0);

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

    const toSweeping = setTimeout(() => {
      setPhase("sweeping");
      setMinted(true);
    }, DRAW_MS + HOLD_MS);

    return () => clearTimeout(toSweeping);
  }, [mounted]);

  // Left-to-right sweep: reuses the same 0->1 "progress" idea as the trace
  // itself. Each glyph's own left-edge position (normalized against the
  // full text's bounding box) is compared against progress every frame —
  // once progress reaches it, that glyph snaps to mint and spawns its own
  // handful of particles, instead of the whole word changing at once.
  useEffect(() => {
    if (phase !== "sweeping") return;
    const els = pathRefs.current.filter((el): el is SVGPathElement => el !== null);
    if (els.length === 0) return;

    const [vbX, , vbWidth] = introPathData.viewBox.split(" ").map(Number);
    const positions = els.map((el) => (el.getBBox().x - vbX) / vbWidth);

    const triggered = new Set<number>();
    const start = performance.now();
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const spawnForGlyph = (el: SVGPathElement) => {
      const length = el.getTotalLength();
      const ctm = el.getScreenCTM();
      if (length <= 0 || !ctm) return;
      const count = PARTICLES_PER_GLYPH_MIN + Math.floor(Math.random() * (PARTICLES_PER_GLYPH_MAX - PARTICLES_PER_GLYPH_MIN + 1));
      const next: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const pt = el.getPointAtLength(Math.random() * length).matrixTransform(ctm);
        const angle = Math.random() * Math.PI * 2;
        const dist = PARTICLE_MIN_DIST + Math.random() * (PARTICLE_MAX_DIST - PARTICLE_MIN_DIST);
        next.push({
          id: particleIdRef.current++,
          x: pt.x,
          y: pt.y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 2 + Math.random() * 3,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          duration: PARTICLE_MIN_MS + Math.random() * (PARTICLE_MAX_MS - PARTICLE_MIN_MS),
        });
      }
      if (next.length > 0) setParticles((prev) => [...prev, ...next]);
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP_MS);
      els.forEach((el, i) => {
        if (!triggered.has(i) && positions[i] <= t) {
          triggered.add(i);
          el.style.transition = `stroke ${PER_GLYPH_COLOR_MS}ms ease`;
          el.style.stroke = MINT_STROKE;
          spawnForGlyph(el);
        }
      });
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setTextFading(true);
      timers.push(setTimeout(() => setBgFading(true), BG_FADE_DELAY_MS));
      timers.push(
        setTimeout(() => {
          setParticles([]);
          setPhase("done");
        }, PARTICLE_MAX_MS)
      );
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const tm of timers) clearTimeout(tm);
    };
  }, [phase]);

  if (!mounted || phase === "done") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99] bg-[#020308]"
        style={{
          opacity: bgFading ? 0 : 1,
          transition: bgFading ? `opacity ${BG_FADE_MS}ms ease` : "none",
          pointerEvents: bgFading ? "none" : "auto",
        }}
        aria-hidden="true"
      />

      <svg
        ref={svgRef}
        viewBox={introPathData.viewBox}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: "min(90vw, 900px)",
          height: "auto",
          pointerEvents: "none",
          opacity: textFading ? 0 : 1,
          // The ambient glow drifts blue->mint smoothly across the whole
          // sweep (it's one shared filter over the composited group, so it
          // can't snap per-glyph without reintroducing the multi-filter
          // banding problem) while each glyph's own crisp core stroke snaps
          // color abruptly as the sweep passes over it, below.
          filter: minted ? MINT_FILTER : NEON_FILTER,
          transition: `filter ${SWEEP_MS}ms ease${textFading ? `, opacity ${TEXT_FADE_MS}ms ease` : ""}`,
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
            stroke={NEON_STROKE}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {particles.length > 0 && (
        <div className="fixed inset-0 z-[102]" style={{ pointerEvents: "none", mixBlendMode: "screen" }} aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="intro-particle"
              style={
                {
                  position: "fixed",
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  borderRadius: "9999px",
                  background: `radial-gradient(circle, #ffffff 0%, ${p.color} 45%, transparent 75%)`,
                  animationDuration: `${p.duration}ms`,
                  "--dx": `${p.dx}px`,
                  "--dy": `${p.dy}px`,
                } as React.CSSProperties
              }
            />
          ))}
          <style jsx>{`
            .intro-particle {
              animation-name: intro-particle-disperse;
              animation-timing-function: ease-out;
              animation-fill-mode: forwards;
            }
            @keyframes intro-particle-disperse {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              100% {
                transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </>,
    document.body
  );
}
