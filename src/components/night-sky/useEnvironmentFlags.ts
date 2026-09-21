"use client";

import { useEffect, useState } from "react";

// "high" — normal-size PC window. "mid" — a smaller/narrower window that's
// still not a phone (this scene renders on every page, always-on, so a
// midpoint tier matters more here than it would for an occasional effect).
// "low" — mobile/narrow viewports.
export type QualityTier = "high" | "mid" | "low";

export function useQualityTier(): QualityTier {
  const [tier, setTier] = useState<QualityTier>("high");

  useEffect(() => {
    const lowMq = window.matchMedia("(max-width: 640px)");
    const midMq = window.matchMedia("(max-width: 1024px)");
    const update = () => {
      if (lowMq.matches) setTier("low");
      else if (midMq.matches) setTier("mid");
      else setTier("high");
    };
    update();
    lowMq.addEventListener("change", update);
    midMq.addEventListener("change", update);
    return () => {
      lowMq.removeEventListener("change", update);
      midMq.removeEventListener("change", update);
    };
  }, []);

  return tier;
}

export function useReducedMotionFlag(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
