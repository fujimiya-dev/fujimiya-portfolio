"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, SelectiveBloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Starfield from "./Starfield";
import MilkyWay from "./MilkyWay";
import Moon from "./Moon";
import MoonGlow from "./MoonGlow";
import GrassField from "./GrassField";
import SkyBackdrop from "./SkyBackdrop";
import ParallaxRig from "./ParallaxRig";
import { useQualityTier, useReducedMotionFlag, usePageVisible } from "./useEnvironmentFlags";

export default function NightSkyScene() {
  const tier = useQualityTier();
  const reducedMotion = useReducedMotionFlag();
  const pageVisible = usePageVisible();
  const [dprBoost, setDprBoost] = useState(true);
  const glowRef = useRef<THREE.Mesh>(null);

  const active = pageVisible && !reducedMotion;
  const isMobile = tier === "mobile";
  const starCount = isMobile ? 250 : 720;
  const grassCount = isMobile ? 220 : 650;
  const dprCeiling = isMobile ? 1 : dprBoost ? 2 : 1.3;
  const bloomIntensity = isMobile ? 0.18 : 0.3;
  const glowBloomIntensity = isMobile ? 1.15 : 1.8;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "demand"}
        dpr={[1, dprCeiling]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#030e2e"]} />
        <PerformanceMonitor onDecline={() => setDprBoost(false)} onIncline={() => setDprBoost(true)} />
        <ParallaxRig>
          <SkyBackdrop />
          <MilkyWay />
          <Starfield count={starCount} />
          <MoonGlow ref={glowRef} />
          <Moon />
          <GrassField count={grassCount} />
        </ParallaxRig>
        <EffectComposer multisampling={isMobile ? 0 : 4}>
          <Bloom mipmapBlur intensity={bloomIntensity} luminanceThreshold={0.7} luminanceSmoothing={0.15} radius={0.2} />
          <SelectiveBloom
            selection={glowRef}
            mipmapBlur
            intensity={glowBloomIntensity}
            luminanceThreshold={0}
            luminanceSmoothing={0.6}
            radius={0.75}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
