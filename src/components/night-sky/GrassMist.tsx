"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { terrainHeightAt } from "./terrainHeight";

// A soft blue haze that reads as light seeping up out of the grass itself —
// not a ground plane, not a point cluster (that first attempt read as a
// pile of distinct soft "bubbles," each point's own circular edge still
// visible where it didn't fully overlap its neighbors). This version is a
// single billboard quad whose alpha comes directly from fBM noise (the
// same technique used for the Milky Way's mottling and GroundFog's own
// wisps) — a continuous, boundary-less density field with real gaps in it,
// not a stack of discrete shapes.
//
// Billboard, not a ground-plane like GroundFog was: a horizontal quad
// viewed at this scene's near-grazing angle always projects to a thin
// band-shaped region of the screen near the horizon, no matter what
// texture is painted on it — that shape alone is what read as "a layer"
// last time, independent of the noise on top of it. A camera-facing quad
// has no such constraint; its footprint is just its own rectangle, freely
// shaped by the noise mask inside it.

const CENTER_X = 0;
const CENTER_Z = -7; // matches the grass field's own near+mid depth range
const QUAD_WIDTH = 20;
const QUAD_HEIGHT = 5.5; // low and wide — hugs the ground, not a tall cloud

const COLOR_CORE = "#1E40FF";
const COLOR_HIGHLIGHT = "#7FB7FF";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorHighlight;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p, int oct) {
    float sum = 0.0, amp = 0.5, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.03;
    }
    return sum / maxA;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    // Contains the cloud within the quad with no hard rectangular edge —
    // wider than tall, matching the quad's own low, wide proportions.
    float radial = 1.0 - smoothstep(0.18, 0.5, length(centered * vec2(1.0, 1.6)));

    vec2 p = vUv * 3.2 + vec2(uTime * 0.014, -uTime * 0.009);
    float n = fbm(p, 5);
    // Pulled toward mid-range so density genuinely hits zero in real gaps
    // between patches, not just thins out — a continuous field with holes
    // in it, not a uniform wash.
    float density = smoothstep(0.4, 0.8, n);

    float alpha = density * radial * uOpacity;

    vec3 color = mix(uColorCore, uColorHighlight, smoothstep(0.45, 0.85, n));
    // Capped well under 1.0 for the same reason as elsewhere in this scene
    // (ACES tonemapping pre-scales color by ~1.67x before its compression
    // curve even runs) — but scaled proportionally across all three
    // channels rather than clamped independently. An independent per-
    // channel clamp cut blue (both source colors' dominant channel) much
    // harder than red/green, which desaturated the whole cloud toward gray
    // instead of keeping it blue.
    float maxC = max(color.r, max(color.g, color.b));
    if (maxC > 0.6) color *= 0.6 / maxC;

    gl_FragColor = vec4(color * alpha, 1.0);
  }
`;

export default function GrassMist({ planeCount = 1 }: { planeCount?: number }) {
  const materialRefs = useRef<(THREE.ShaderMaterial | null)[]>([]);

  const placements = useMemo(() => {
    const list: { x: number; y: number; z: number; scale: number }[] = [];
    for (let i = 0; i < planeCount; i++) {
      // Spread further apart than the quad's own width so neighboring
      // planes mostly don't overlap — additive blending stacks brightness
      // in any overlap, which is what pushed the cloud from blue toward a
      // washed-out white/pale look once more than one plane was in play.
      const x = CENTER_X + (i - (planeCount - 1) / 2) * QUAD_WIDTH * 0.85;
      const z = CENTER_Z + (Math.random() - 0.5) * 2;
      const y = terrainHeightAt(x, z) + 0.7;
      list.push({ x, y, z, scale: 0.9 + Math.random() * 0.3 });
    }
    return list;
  }, [planeCount]);

  useFrame((state) => {
    materialRefs.current.forEach((mat) => {
      if (mat) mat.uniforms.uTime.value = state.clock.elapsedTime;
    });
  });

  return (
    <>
      {placements.map((p, i) => (
        <Billboard key={i} position={[p.x, p.y, p.z]}>
          <mesh scale={p.scale}>
            <planeGeometry args={[QUAD_WIDTH, QUAD_HEIGHT]} />
            <shaderMaterial
              ref={(el) => {
                materialRefs.current[i] = el;
              }}
              vertexShader={VERTEX_SHADER}
              fragmentShader={FRAGMENT_SHADER}
              uniforms={{
                uTime: { value: 0 },
                uColorCore: { value: new THREE.Color(COLOR_CORE) },
                uColorHighlight: { value: new THREE.Color(COLOR_HIGHLIGHT) },
                // Lowered — at 0.4 (and especially once multiple planes
                // are in view) the cloud read as too opaque/whitish rather
                // than a faint blue haze with stars showing through.
                uOpacity: { value: 0.2 },
              }}
              transparent
              depthWrite={false}
              blending={THREE.CustomBlending}
              blendEquation={THREE.AddEquation}
              blendSrc={THREE.OneFactor}
              blendDst={THREE.OneFactor}
            />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}
