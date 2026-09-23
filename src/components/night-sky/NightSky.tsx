"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    setWebglReady(detectWebGL());
  }, []);

  useEffect(() => {
    if (!webglReady) return;
    // Defer the heavy Three.js/WebGL scene mount (shader compilation for
    // grass/stars/moon/river/postprocessing) so it doesn't compete with
    // IntroOverlay's first paint on "/" — mounting both at once caused a
    // ~500ms+ main-thread stall right as the intro's stroke-dashoffset
    // transition started, measured via an in-page rAF timeline recorder.
    // requestIdleCallback (unlike a bare setTimeout(0)) waits for an actual
    // idle slot, giving the intro's first frame priority; the timeout caps
    // how long we wait on browsers where idle never comes soon.
    const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 50));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setSceneReady(true), { timeout: 800 });
    return () => cic(id);
  }, [webglReady]);

  if (!webglReady || !sceneReady) {
    return (
      <>
        <div className="sky-fixed" aria-hidden="true" />
        <div className="moon-glow" aria-hidden="true" />
      </>
    );
  }

  return <NightSkyScene />;
}
