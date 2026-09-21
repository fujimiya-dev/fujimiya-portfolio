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
    float falloff = pow(clamp(1.0 - d, 0.0, 1.0), 1.45);
    gl_FragColor = vec4(uColor, falloff);
  }
`;

const MoonGlow = forwardRef<THREE.Mesh>(function MoonGlow(_props, ref) {
  const position = useMoonPosition();
  const tier = useQualityTier();
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#8fe0ab") } }), []);
  // Sized in world units, so it must shrink on the much narrower mobile
  // frustum or it overruns the whole screen instead of staying corner-confined.
  const glowSize = tier === "low" ? 26 : tier === "mid" ? 38 : 50;

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
