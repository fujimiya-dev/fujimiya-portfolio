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

  useEffect(() => {
    setWebglReady(detectWebGL());
  }, []);

  if (!webglReady) {
    return (
      <>
        <div className="sky-fixed" aria-hidden="true" />
        <div className="moon-glow" aria-hidden="true" />
      </>
    );
  }

  return <NightSkyScene />;
}
