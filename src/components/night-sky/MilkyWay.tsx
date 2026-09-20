"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Procedural galactic band, adapted from the procedural-starfield skill's
// milky_way.frag (see procedural-stars-threejs/celestial-shaders.md).
// The skill's warm/cool temperature tint is replaced with a mint-core /
// navy-edge tint to match the site's palette, and brightness/dust/core
// values are toned down from the skill's "Fantasy" preset for restraint.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vWorldDir = normalize((modelMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uBrightness;
  uniform float uBandWidth;
  uniform float uBandTilt;
  uniform float uCoreGlow;
  uniform float uDustLanes;
  uniform vec3  uCoreColor;
  uniform vec3  uEdgeColor;

  varying vec3 vWorldDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p, int oct) {
    float sum = 0.0, amp = 1.0, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.1;
    }
    return sum / maxA;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);

    // Tilted galactic band coordinates.
    float galLat = dir.y * cos(uBandTilt) - dir.z * sin(uBandTilt);
    float galLon = atan(dir.x, dir.z * cos(uBandTilt) + dir.y * sin(uBandTilt));

    float band = exp(-galLat * galLat / (uBandWidth * uBandWidth));

    vec2 uv = vec2(galLon * 2.0, galLat * 8.0);
    float structure = fbm(uv * 3.0, 5);
    structure = structure * 0.7 + 0.3;

    float dust = fbm(uv * 4.0 + 1.7, 4);
    dust = smoothstep(0.35, 0.55, dust) * uDustLanes;

    float core = exp(-galLon * galLon * 2.0) * uCoreGlow;

    float mw = band * structure * (1.0 - dust) + core * band;
    mw *= uBrightness;

    vec3 col = mix(uEdgeColor, uCoreColor, clamp(core * 2.0 + 0.25, 0.0, 1.0));
    col *= mw;

    // Faint scattered star-like noise within the band.
    float starNoise = noise(uv * 80.0);
    starNoise = pow(starNoise, 8.0) * band * 0.15;
    col += vec3(0.9, 1.0, 0.95) * starNoise;

    gl_FragColor = vec4(col, mw);
  }
`;

export default function MilkyWay() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uBrightness: { value: 0.28 },
      uBandWidth: { value: 0.16 },
      uBandTilt: { value: 0.5 },
      uCoreGlow: { value: 0.3 },
      uDustLanes: { value: 0.28 },
      uCoreColor: { value: new THREE.Color("#cdeedd") },
      uEdgeColor: { value: new THREE.Color("#3e536f") },
    }),
    []
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Very slow drift for a living sky; naturally frozen when the Canvas
      // frameloop is paused (reduced-motion / hidden tab / demand mode).
      meshRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <sphereGeometry args={[60, 48, 32]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
