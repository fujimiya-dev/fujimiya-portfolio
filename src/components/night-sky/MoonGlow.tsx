"use client";

import { forwardRef, useMemo } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";
import { useQualityTier } from "./useEnvironmentFlags";

// A soft radial wash behind the moon, sized several times larger than the
// moon disc itself. Rendered as its own mesh so NightSkyScene can target it
// with a separate SelectiveBloom pass — the moon body stays crisp while
// this layer is the one allowed to bloom broadly, tinting the surrounding
// sky rather than the moon's own surface.
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float d = length(uv);
    // Steepened from 2.2 — at that value the glow's own alpha right at the
    // Moon's edge (d ≈ moonRadius / glowHalfWidth) was still substantial,
    // and once Moon.tsx's own lighting became genuinely flat (no more
    // NdotL-driven shading), that leftover brightness read as an obvious
    // bright rim around an otherwise uniform disc — worse than before,
    // when the disc's own shading variation had hidden it. A much steeper
    // falloff (plus the smaller glowSize below) pushes the glow's value at
    // the Moon's edge down close to zero, so it doesn't visibly ring the
    // disc; the visible bloom now comes almost entirely from inside the
    // Moon's own silhouette outward into the sky, not wrapping its edge.
    float falloff = pow(clamp(1.0 - d, 0.0, 1.0), 10.0);
    gl_FragColor = vec4(uColor, falloff);
  }
`;

const MoonGlow = forwardRef<THREE.Mesh>(function MoonGlow(_props, ref) {
  const position = useMoonPosition();
  const tier = useQualityTier();
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#8fe0ab") } }), []);
  // Sized in world units, so it must shrink on the much narrower mobile
  // frustum or it overruns the whole screen instead of staying corner-confined.
  // Shrunk further (from a ~1.3x-of-original pass) alongside the steeper
  // falloff above — see that comment. The tradeoff is a noticeably more
  // contained glow (less ambient sky tint spreading away from the Moon)
  // than the earlier, larger sizing.
  const glowSize = tier === "low" ? 24 : tier === "mid" ? 34 : 45;

  return (
    <Billboard position={position}>
      <mesh ref={ref}>
        <planeGeometry args={[glowSize, glowSize]} />
        <shaderMaterial
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
});

export default MoonGlow;
