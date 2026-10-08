"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { useIntroPlaying, useSetSceneReady } from "@/components/IntroPlayingContext";

// Reports "a real frame has actually been drawn" back to IntroOverlay's skip
// path, via the SceneReady context — distinct from the Canvas merely being
// mounted, since shader compilation + the first draw call still takes real,
// variable time after that. Must render *inside* <Canvas> since useThree /
// useFrame only work within the R3F tree.
//
// compileAsync (parallel shader compilation, available since three 0.159) is
// fired here too, best-effort, so that first real draw call is cheaper when
// it happens. But readiness itself is NOT gated on its promise settling —
// deliberately: compileAsync's only purpose is to make the first frame's
// render() call cheap; it is not a prerequisite for that frame to happen.
// If render() runs before compileAsync resolves, three.js just compiles
// synchronously as part of that render instead — slower, but by the time
// useFrame's callback below actually fires, that cost has already been
// paid either way, and it happened behind the still-opaque skip overlay
// either way. Gating on the promise too (as an earlier version of this did)
// risks never firing at all if it happens not to resolve in a given
// environment, leaving sceneReady permanently false and every skip falling
// back to IntroOverlay's 3-second safety timeout instead of its real signal.
function SceneReadySignal() {
  const setSceneReady = useSetSceneReady();
  const firedRef = useRef(false);
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const renderer = gl as unknown as {
      compileAsync?: (scene: THREE.Scene, camera: THREE.Camera) => Promise<unknown>;
    };
    renderer.compileAsync?.(scene, camera).catch(() => {});
  }, [gl, scene, camera]);

  useFrame(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setSceneReady?.(true);
  });

  return null;
}

export default function NightSkyScene() {
  const tier = useQualityTier();
  const reducedMotion = useReducedMotionFlag();
  const pageVisible = usePageVisible();
  const introPlaying = useIntroPlaying();
  const [dprBoost, setDprBoost] = useState(true);
  const glowRef = useRef<THREE.Mesh>(null);

  // IntroOverlay's black background fully covers Hero anyway while it's
  // playing, so pausing the frameloop here costs nothing visually but saves
  // the main thread from running Hero's WebGL render loop and the intro's
  // own SVG/canvas animation at the same time — that overlap was the main
  // cause of the intro stuttering partway through.
  const active = pageVisible && !reducedMotion && !introPlaying;
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
  // "low" (mobile) used to sit flat at 1 regardless of the device's actual
  // devicePixelRatio — on a typical 2-3x phone screen that's the canvas
  // rendering at a third (or less) of native resolution and then being
  // upscaled, which read as blurry/low-res grass (and everything else in
  // the scene). Still responds to PerformanceMonitor like the high tier
  // does, but with a floor (1.5) that stays well above the old flat 1
  // instead of matching high tier's low-power floor.
  const dprCeiling = tier === "high" ? (dprBoost ? 2 : 1.3) : tier === "mid" ? 1.5 : dprBoost ? 2 : 1.5;
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
        <SceneReadySignal />
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
