"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useHeroReady } from "@/components/IntroPlayingContext";

const NightSkyScene = dynamic(() => import("./NightSkyScene"), { ssr: false });

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function NightSky() {
  const [webglReady, setWebglReady] = useState(false);
  // On "/", IntroOverlay holds this false until the trace finishes and
  // flips it during HOLD_MS (see IntroPlayingContext) — the one quiet
  // stretch of the intro timeline with nothing else running, so Hero's
  // one-time Three.js/shader construction cost lands there instead of
  // competing with the trace or the color-sweep/particle burst. Other
  // pages have no IntroOverlay to gate this, so it's true from the start.
  const heroReady = useHeroReady();

  useEffect(() => {
    setWebglReady(detectWebGL());
  }, []);

  if (!webglReady || !heroReady) {
    return (
      <>
        <div className="sky-fixed" aria-hidden="true" />
        <div className="moon-glow" aria-hidden="true" />
      </>
    );
  }

  return <NightSkyScene />;
}
