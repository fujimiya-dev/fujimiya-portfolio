"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import introPathData from "./introPathData.json";

// Timing (ms).
const DRAW_MS = 4000;
const HOLD_MS = 500; // pause after the trace finishes, before the color morph
const MORPH_MS = 1200; // blue -> mint color transition
const TEXT_FADE_MS = 800; // text fade-out, starts together with the particle burst
const PARTICLE_MIN_MS = 1400;
const PARTICLE_MAX_MS = 2200;
const PARTICLE_COUNT = 50;
const PARTICLE_MIN_DIST = 60;
const PARTICLE_MAX_DIST = 220;
// Background starts fading a little before the particles finish dispersing,
// so the two resolve into the real Hero starfield at roughly the same time.
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

type Phase = "drawing" | "morphing" | "dispersing" | "done";

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

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setPhase("morphing");
        setMinted(true);
      }, DRAW_MS + HOLD_MS)
    );

    timers.push(
      setTimeout(() => {
        setPhase("dispersing");
        setTextFading(true);
        setParticles(spawnParticles(els));
        timers.push(setTimeout(() => setBgFading(true), BG_FADE_DELAY_MS));
        timers.push(
          setTimeout(() => {
            setParticles([]);
            setPhase("done");
          }, PARTICLE_MAX_MS)
        );
      }, DRAW_MS + HOLD_MS + MORPH_MS)
    );

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [mounted]);

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
          filter: minted ? MINT_FILTER : NEON_FILTER,
          transition: `filter ${MORPH_MS}ms ease${textFading ? `, opacity ${TEXT_FADE_MS}ms ease` : ""}`,
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
            stroke={minted ? MINT_STROKE : NEON_STROKE}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: `stroke ${MORPH_MS}ms ease` }}
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

function spawnParticles(glyphEls: SVGPathElement[]): Particle[] {
  const lengths = glyphEls.map((el) => el.getTotalLength());
  const totalLength = lengths.reduce((a, b) => a + b, 0);
  if (totalLength <= 0) return [];

  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let target = Math.random() * totalLength;
    let glyphIndex = 0;
    while (glyphIndex < lengths.length - 1 && target > lengths[glyphIndex]) {
      target -= lengths[glyphIndex];
      glyphIndex++;
    }
    const el = glyphEls[glyphIndex];
    const ctm = el.getScreenCTM();
    if (!ctm) continue;
    const localLength = Math.min(target, lengths[glyphIndex]);
    const pt = el.getPointAtLength(localLength).matrixTransform(ctm);

    const angle = Math.random() * Math.PI * 2;
    const dist = PARTICLE_MIN_DIST + Math.random() * (PARTICLE_MAX_DIST - PARTICLE_MIN_DIST);

    particles.push({
      id: i,
      x: pt.x,
      y: pt.y,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      size: 2 + Math.random() * 3,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      duration: PARTICLE_MIN_MS + Math.random() * (PARTICLE_MAX_MS - PARTICLE_MIN_MS),
    });
  }
  return particles;
}
