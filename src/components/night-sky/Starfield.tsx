"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";

// Magnitude-based star field, adapted from the procedural-starfield skill's
// star.vert/star.frag (see procedural-stars-threejs/celestial-shaders.md),
// recolored to a navy/mint palette instead of the skill's blackbody warm tones.
const VERTEX_SHADER = /* glsl */ `
  attribute float aMagnitude;
  attribute float aColorMix;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBaseSizePx;
  uniform vec3 uMoonDir;
  varying float vBrightness;
  varying float vColorMix;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vColorMix = aColorMix;

    // Each magnitude step is ~2.512x dimmer (Pogson's ratio).
    float brightness = pow(2.512, -aMagnitude);

    float size = uBaseSizePx * pow(brightness, 0.35);
    size = clamp(size, 0.4, 3.2);

    // Multi-frequency twinkle, unique per star via hash-seeded phase.
    float phase = hash(position.xy + position.z) * 6.283;
    float twinkle = 1.0
      + sin(uTime * 2.3 + phase) * 0.32
      + sin(uTime * 5.7 + phase * 2.0) * 0.18
      + sin(uTime * 11.0 + phase * 3.0) * 0.1;
    // Brighter stars twinkle less (their apparent disc is more stable).
    float twinkleAmt = mix(1.0, twinkle, clamp(1.0 - brightness * 0.4, 0.25, 1.0));

    // Stars angularly close to the moon catch a touch of extra brightness —
    // a gentle stand-in for "washed out by moonlight" that still reads as
    // sparkle rather than the fainter ones simply vanishing.
    float moonAlign = max(dot(normalize(position), uMoonDir), 0.0);
    float moonBoost = pow(moonAlign, 3.5) * 0.3;

    vBrightness = brightness * twinkleAmt * (1.0 + moonBoost);
    // A touch of size pulse alongside the brightness pulse reads as an
    // actual glinting sparkle rather than just a dimmer/brighter dot.
    size *= mix(1.0, clamp(twinkleAmt, 0.5, 1.6), 0.35);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mvPosition.z, 1.0);
    float screenSize = size * uPixelRatio * (95.0 / dist);
    float capSize = brightness > 1.0 ? 13.0 : 4.0;
    gl_PointSize = clamp(screenSize, 0.6, capSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorWhite;
  uniform vec3 uColorMint;
  varying float vBrightness;
  varying float vColorMix;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);

    float core = smoothstep(0.5, 0.05, dist);
    float glow = exp(-dist * dist / (0.35 * 0.35)) * 0.35;
    float alpha = core + glow;

    // Diffraction-spike hint, only for the brightest handful of stars.
    float spike = 0.0;
    if (vBrightness > 1.1) {
      float angle = atan(uv.y, uv.x);
      spike = pow(abs(cos(angle * 2.0)), 32.0) * (1.0 - dist * 3.0);
      spike = max(spike, 0.0) * (vBrightness - 1.1) * 0.5;
    }

    vec3 color = mix(uColorWhite, uColorMint, vColorMix);
    // Visibility floor keeps faint stars as soft points without crossing the
    // bloom threshold; only genuinely bright stars push past it.
    float visibility = clamp(0.32 + vBrightness * 0.45, 0.32, 1.6);

    vec3 finalColor = color * visibility;
    gl_FragColor = vec4(finalColor, (alpha + spike) * min(alpha + spike, 1.0));
  }
`;

export default function Starfield({ count }: { count: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const moonPos = useMoonPosition();

  const { positions, magnitudes, colorMixes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const magnitudes = new Float32Array(count);
    const colorMixes = new Float32Array(count);

    const minMagnitude = -1.0;
    const maxMagnitude = 6.2;

    for (let i = 0; i < count; i++) {
      const radius = 16 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 9;

      // Astronomical magnitude distribution: many faint, few bright.
      magnitudes[i] = minMagnitude + Math.pow(Math.random(), 0.4) * (maxMagnitude - minMagnitude);
      colorMixes[i] = Math.random() < 0.25 ? 0.5 + Math.random() * 0.5 : 0;
    }

    return { positions, magnitudes, colorMixes };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uBaseSizePx: { value: 2.2 },
      uColorWhite: { value: new THREE.Color("#eafcef") },
      uColorMint: { value: new THREE.Color("#a9d8c2") },
      uMoonDir: { value: new THREE.Vector3(0, 0, -1) },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMoonDir.value
        .set(moonPos[0], moonPos[1], moonPos[2])
        .normalize();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aMagnitude" args={[magnitudes, 1]} />
        <bufferAttribute attach="attributes-aColorMix" args={[colorMixes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
