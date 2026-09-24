"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import introPathData from "./introPathData.json";
import {
  useSetIntroPlaying,
  useSetHeroReady,
  peekForcePlayIntro,
  clearForcePlayIntro,
  peekInitialAutoPlayIntro,
  clearInitialAutoPlayIntro,
} from "./IntroPlayingContext";

// Timing (ms).
const DRAW_MS = 4000;
const HOLD_MS = 500; // pause after the trace finishes, before the sweep starts
const SWEEP_MS = 2800; // left-to-right color+particle sweep across all glyphs
const PER_GLYPH_COLOR_MS = 300; // each glyph's own blue->mint snap, once the sweep reaches it
const GLYPH_VANISH_DELAY_MS = 150; // hold on the mint color just long enough to register before vanishing
const GLYPH_VANISH_MS = 250; // that glyph's own fade-out, once it's turned mint and burst into particles
// A bit more dramatic than the original 3-6/60-220 per follow-up feedback —
// bumped moderately (count, spread, size), not maxed out.
const PARTICLES_PER_GLYPH_MIN = 5;
const PARTICLES_PER_GLYPH_MAX = 9;
const PARTICLE_MIN_MS = 1400;
const PARTICLE_MAX_MS = 2200;
const PARTICLE_MIN_DIST = 80;
const PARTICLE_MAX_DIST = 280;
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

// Decides once, at mount, whether this playthrough should actually run.
// The force-play flag (set by IntroTriggerLink — the "Fujimiya.dev" logo
// and "Top" nav link only) always wins. Otherwise this only plays once,
// and only if the true hard page load that started this session landed
// directly on bare "/" (no hash) — see peekInitialAutoPlayIntro. Every
// later client-side arrival at "/" (e.g. "About me", or "Top" without an
// explicit click) skips straight to "done" instead of replaying the trace.
//
// Deliberately does NOT read window.location.hash itself here: IntroOverlay
// can mount for the first time well after the actual page load (e.g. the
// user's hard load was "/research" and this is the first time they've ever
// navigated near "/"), at which point a hash read would be racing the very
// same client-side navigation that's about to change it.
function shouldPlayOnMount() {
  if (peekForcePlayIntro()) return true;
  return peekInitialAutoPlayIntro();
}

type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  duration: number;
  spawnTime: number;
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function IntroOverlay() {
  const setIntroPlaying = useSetIntroPlaying();
  const setHeroReady = useSetHeroReady();
  const [phase, setPhase] = useState<Phase>(() => (shouldPlayOnMount() ? "drawing" : "done"));
  // TopNav/main each create their own stacking context in layout.tsx, so a
  // z-index alone here can't escape main's context to sit above TopNav —
  // portal straight onto <body> instead, where our z-index is compared
  // directly against TopNav's.
  const [mounted, setMounted] = useState(false);
  const [minted, setMinted] = useState(false);
  const [bgFading, setBgFading] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Particles live entirely outside React state — pushed/filtered in place
  // by the canvas render loop — since 60-120 of them re-rendering as DOM
  // nodes on every spawn was the main cost behind the mid-animation stutter.
  const particlesRef = useRef<Particle[]>([]);
  // getTotalLength()/getScreenCTM() both force a synchronous layout pass;
  // calling either from inside the per-frame sweep tick or from
  // spawnForGlyph (i.e. while particles are actively being triggered) was
  // the other source of jank. Both are computed once up front and cached
  // here instead.
  const glyphLengthsRef = useRef<number[]>([]);
  const glyphCTMsRef = useRef<(DOMMatrix | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    // The pathname-keyed effect in IntroPlayingContext only fires on an
    // actual route change, so it won't notice a same-route replay
    // (clicking "Top" while already on "/"). This mount-only effect is
    // what actually flips introPlaying true for every real playthrough.
    if (phase === "drawing") {
      setIntroPlaying?.(true);
    }
    // Only safe to clear these *after* the phase decision above has been
    // committed — clearing them inside shouldPlayOnMount itself would lose
    // the flag on StrictMode's first (discarded) initializer call.
    clearForcePlayIntro();
    clearInitialAutoPlayIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const lengths: number[] = [];
    for (const el of els) {
      const length = el.getTotalLength();
      lengths.push(length);
      el.style.transition = "none";
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
    }
    glyphLengthsRef.current = lengths;
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

    // Right as the trace finishes, let Hero start mounting — this lands its
    // one-time Three.js/shader construction cost in the HOLD_MS pause that
    // follows, the one stretch of the intro with nothing else animating,
    // rather than during the trace itself or racing the color-sweep/particle
    // burst that starts right after HOLD_MS.
    const toHeroReady = setTimeout(() => setHeroReady?.(true), DRAW_MS);

    const toSweeping = setTimeout(() => {
      setPhase("sweeping");
      setMinted(true);
    }, DRAW_MS + HOLD_MS);

    return () => {
      clearTimeout(toHeroReady);
      clearTimeout(toSweeping);
    };
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
    // Snapshot every glyph's screen transform once, before the tick loop
    // starts — calling getScreenCTM() lazily as each glyph gets triggered
    // would force a layout recalculation mid-rAF-loop.
    glyphCTMsRef.current = els.map((el) => el.getScreenCTM());

    const triggered = new Set<number>();
    const start = performance.now();
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const spawnForGlyph = (el: SVGPathElement, i: number) => {
      const length = glyphLengthsRef.current[i];
      const ctm = glyphCTMsRef.current[i];
      if (!length || length <= 0 || !ctm) return;
      const count = PARTICLES_PER_GLYPH_MIN + Math.floor(Math.random() * (PARTICLES_PER_GLYPH_MAX - PARTICLES_PER_GLYPH_MIN + 1));
      const now = performance.now();
      for (let n = 0; n < count; n++) {
        const pt = el.getPointAtLength(Math.random() * length).matrixTransform(ctm);
        const angle = Math.random() * Math.PI * 2;
        const dist = PARTICLE_MIN_DIST + Math.random() * (PARTICLE_MAX_DIST - PARTICLE_MIN_DIST);
        particlesRef.current.push({
          x: pt.x,
          y: pt.y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 2.5 + Math.random() * 4,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          duration: PARTICLE_MIN_MS + Math.random() * (PARTICLE_MAX_MS - PARTICLE_MIN_MS),
          spawnTime: now,
        });
      }
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP_MS);
      els.forEach((el, i) => {
        if (!triggered.has(i) && positions[i] <= t) {
          triggered.add(i);
          // Snap to mint immediately, hold it just long enough to read as
          // "this letter turned green", then burst its own particles and
          // fade this glyph out on its own — instead of every glyph
          // staying visible until one fade at the very end of the sweep.
          el.style.transition = `stroke ${PER_GLYPH_COLOR_MS}ms ease, opacity ${GLYPH_VANISH_MS}ms ease ${GLYPH_VANISH_DELAY_MS}ms`;
          el.style.stroke = MINT_STROKE;
          el.style.opacity = "0";
          spawnForGlyph(el, i);
        }
      });
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      timers.push(setTimeout(() => setBgFading(true), BG_FADE_DELAY_MS));
      timers.push(
        setTimeout(() => {
          particlesRef.current = [];
          // Hand the frameloop back to NightSkyScene right as the overlay
          // goes away — frameloop="always" resumes continuous rendering on
          // its own very next tick, confirmed with no stale/black frame at
          // the reveal. (A standalone invalidate() import from
          // @react-three/fiber was tried here as an extra safety net, but
          // it pulls the entire Three.js/R3F chain into this page's
          // synchronous bundle — NightSky.tsx keeps that dependency behind
          // a next/dynamic(ssr:false) split specifically to avoid that, so
          // it was removed once verified unnecessary.)
          setIntroPlaying?.(false);
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

  // Canvas particle renderer — a single element instead of 60-120 divs.
  // Runs only during "sweeping" and is torn down (canceled + cleared) the
  // moment the phase leaves it, so nothing keeps painting once the intro
  // is done.
  useEffect(() => {
    if (phase !== "sweeping") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        const elapsed = now - p.spawnTime;
        if (elapsed >= p.duration) continue;
        const eased = easeOutCubic(elapsed / p.duration);
        const x = p.x + p.dx * eased;
        const y = p.y + p.dy * eased;
        const radius = Math.max(0.1, (p.size / 2) * (1 - eased * 0.8));
        ctx.globalAlpha = 1 - eased;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.45, p.color);
        grad.addColorStop(0.75, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      particlesRef.current = alive;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
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
          // The ambient glow drifts blue->mint smoothly across the whole
          // sweep (it's one shared filter over the composited group, so it
          // can't snap per-glyph without reintroducing the multi-filter
          // banding problem) while each glyph's own crisp core stroke snaps
          // color and vanishes individually as the sweep passes over it —
          // see the per-glyph opacity transition set in the tick loop above.
          filter: minted ? MINT_FILTER : NEON_FILTER,
          transition: `filter ${SWEEP_MS}ms ease`,
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

      <canvas ref={canvasRef} className="fixed inset-0 z-[102]" style={{ pointerEvents: "none", mixBlendMode: "screen" }} aria-hidden="true" />
    </>,
    document.body
  );
}
