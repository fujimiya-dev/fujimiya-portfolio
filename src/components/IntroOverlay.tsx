"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Timing (ms), per spec: 2.6s draw-on sweep, 0.6s hold, 0.5s fade-out.
const DRAW_MS = 2600;
const HOLD_MS = 600;
const FADE_MS = 500;

type Phase = "drawing" | "fading" | "done";

export default function IntroOverlay() {
  const [phase, setPhase] = useState<Phase>("drawing");
  // TopNav/main each create their own stacking context in layout.tsx, so a
  // z-index alone here can't escape main's context to sit above TopNav —
  // portal straight onto <body> instead, where our z-index is compared
  // directly against TopNav's.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const toFading = setTimeout(() => setPhase("fading"), DRAW_MS + HOLD_MS);
    const toDone = setTimeout(() => setPhase("done"), DRAW_MS + HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(toFading);
      clearTimeout(toDone);
    };
  }, []);

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
      <div
        className="intro-reveal text-center"
        style={{
          fontFamily: "var(--font-intro)",
          color: "#eaf6ff",
          textShadow: "0 0 2px #eaf6ff, 0 0 10px #7FB7FF, 0 0 22px #1E40FF, 0 0 48px #1E40FF",
        }}
      >
        <p className="text-3xl leading-tight sm:text-5xl">Welcome to the</p>
        <p className="text-4xl leading-tight sm:text-6xl">Moonlit Dream</p>
      </div>

      <style jsx>{`
        .intro-reveal {
          -webkit-mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
          mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 0% 100%;
          mask-size: 0% 100%;
          animation: intro-reveal-sweep ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes intro-reveal-sweep {
          to {
            -webkit-mask-size: 140% 100%;
            mask-size: 140% 100%;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
