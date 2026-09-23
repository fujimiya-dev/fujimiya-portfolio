"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, SelectiveBloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Starfield from "./Starfield";
import MilkyWay from "./MilkyWay";
// オーロラ、一時非表示（コンポーネント自体は Aurora.tsx に残したまま、マウントだけ外している）
// import Aurora from "./Aurora";
import Moon from "./Moon";
import MoonGlow from "./MoonGlow";
// 地形・遠景の丘・地霧、一時非表示（コンポーネント自体は各ファイルに残したまま、マウントだけ外している）
// import Terrain from "./Terrain";
// import DistantHill from "./DistantHill";
import GrassField from "./GrassField";
// もや(GrassMist)、一時非表示（コンポーネント自体は GrassMist.tsx に残したまま、マウントだけ外している）
// import GrassMist from "./GrassMist";
// import GroundFog from "./GroundFog";
// 川、一時非表示（コンポーネント自体は River.tsx に残したまま、マウントだけ外している）
// import River from "./River";
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
  // Three explicit quality tiers rather than a single mobile/desktop split —
  // this scene is mounted on every page, so a mid tier (a smaller/narrower
  // desktop window, not just phones) matters for keeping it cheap without
  // dropping straight to the mobile floor.
  // Stars are now sampled directly within the visible frustum (not a full
  // sphere with most of it invisible), so a "comfortable visible density"
  // needs a far smaller total than before — starting point per the
  // requested few-thousand range, tuned from there.
  const starCount = tier === "high" ? 3500 : tier === "mid" ? 2000 : 900;
  // 奥行方向(near/mid/far全レイヤー)の草の量を全体的に底上げ — 元の
  // 1150/740/380から約20%増。near/midの比率を上げた前回とは別に、count
  // 自体を上げることでfarを含む全レイヤーに均等に反映させる。
  const grassCount = tier === "high" ? 1380 : tier === "mid" ? 890 : 460;
  // もや、一時非表示
  // const mistPlaneCount = tier === "low" ? 2 : 3;
  const dprCeiling = tier === "high" ? (dprBoost ? 2 : 1.3) : tier === "mid" ? 1.5 : 1;
  const bloomIntensity = tier === "low" ? 0.18 : 0.3;
  const glowBloomIntensity = tier === "low" ? 1.15 : tier === "mid" ? 1.5 : 1.8;
  const multisampling = tier === "high" ? 4 : 0;
  // オーロラ、一時非表示
  // const auroraOctaves = tier === "high" ? 5 : tier === "mid" ? 4 : 3;
  // 地霧、一時非表示
  // const fogOctaves = tier === "high" ? 4 : tier === "mid" ? 3 : 2;
  // 川、一時非表示
  // const riverReflectionSize = tier === "low" ? 192 : 256;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "demand"}
        dpr={[1, dprCeiling]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#05070f"]} />
        <PerformanceMonitor onDecline={() => setDprBoost(false)} onIncline={() => setDprBoost(true)} />
        <ParallaxRig>
          <SkyBackdrop />
          <MilkyWay />
          {/* オーロラ、一時非表示 */}
          {/* <Aurora octaves={auroraOctaves} /> */}
          <Starfield count={starCount} />
          <MoonGlow ref={glowRef} />
          <Moon />
          {/* 川、一時非表示 */}
          {/* <River reflectionSize={riverReflectionSize} /> */}
          {/* 地形・遠景の丘・地霧、一時非表示 */}
          {/* <DistantHill /> */}
          {/* <Terrain /> */}
          {/* <GroundFog octaves={fogOctaves} /> */}
          <GrassField count={grassCount} lowTier={tier === "low"} />
          {/* もや、一時非表示 */}
          {/* <GrassMist planeCount={mistPlaneCount} /> */}
        </ParallaxRig>
        <EffectComposer multisampling={multisampling}>
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
