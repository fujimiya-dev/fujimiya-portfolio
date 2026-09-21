"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A curtain-like aurora band near the top of the sky, on the same BackSide
// sphere approach as MilkyWay/SkyBackdrop so it lives in the same 3D scene
// rather than a 2D overlay. Two techniques drive its texture, both public,
// widely-documented shader methods rather than anyone's specific work:
//  - ridged fBM: each octave is 1-|n| (folding a signed noise field back on
//    itself) instead of the plain smooth fBM used for the Milky Way's
//    clouds — that fold is what turns soft noise into the sharp vertical
//    streaks an aurora curtain actually has.
//  - real aurora curtains shift color with altitude (oxygen glow low, N2/
//    higher-altitude glow shifting toward red-violet higher up); reused
//    here only as a *structure* — color itself stays in the site's mint
//    palette, just tinting cooler/violet-leaning toward the curtain's top
//    edge instead of switching hue entirely.
// Stage 2: flow noise (domain warping) drives the animation — each fBM
// octave samples through its own slowly rotating, independently scrolling
// frame rather than the whole field just sliding sideways, which is what
// makes the curtain read as twisting/flowing rather than panning. All
// motion here runs far slower than the stars' twinkle or the grass's wind
// (full cycles measured in tens of seconds), and is already frozen
// correctly by the shared Canvas frameloop gating (Page Visibility /
// reduced-motion) via uTime.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vWorldDir = normalize((modelMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uCenterElevation;
  uniform float uBandWidth;
  uniform float uCenterAzimuth;
  uniform float uAzimuthWidth;
  uniform float uBrightness;
  uniform int   uOctaves;
  uniform vec3  uColorLow;
  uniform vec3  uColorHigh;

  varying vec3 vWorldDir;

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

  // 1 - |n| folds a signed noise field back on itself, turning smooth
  // undulation into a sharp ridge at each zero-crossing — squaring narrows
  // the ridge further. Standard "ridged fBM" construction.
  float ridgedNoise(vec2 p) {
    float n = noise(p) * 2.0 - 1.0;
    float r = 1.0 - abs(n);
    return r * r;
  }

  mat2 rotate2d(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  // Flow noise: each octave is sampled through its own rotated, scrolling
  // frame (domain warping) instead of the same static field just marching
  // forward in time. A plain "scroll the whole fBM sideways" animation
  // reads as a flat texture sliding past — rotating each octave by a
  // different amount and flowing it along its own rotated axis is what
  // makes the ridges twist and fold into each other as they drift, the way
  // a real curtain does. This is the standard, widely-documented "flow
  // noise" construction, not tied to any one implementation.
  float ridgedFbmFlow(vec2 p, int oct, float time) {
    float sum = 0.0, amp = 0.5, maxA = 0.0, prev = 1.0, freq = 1.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      float fi = float(i);
      float angle = fi * 0.85 + time * 0.012;
      mat2 rot = rotate2d(angle);
      vec2 flow = rot * vec2(time * (0.035 + fi * 0.012), time * -0.02);
      vec2 samplePos = rot * (p * freq) + flow;

      float r = ridgedNoise(samplePos);
      sum += r * amp * prev;
      // Weighting each octave by the previous one's ridge value is what
      // gives ridged fBM its sharper, more organic peaks rather than just
      // stacked independent layers.
      prev = r;
      maxA += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return sum / maxA;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float t = uTime;

    // A gentle two-frequency wave in the curtain's own vertical position,
    // slowly drifting over time — a single sine would read as too regular/
    // mechanical, so a second, faster, smaller wave is layered on top, and
    // each drifts at its own slow rate so the shape never quite repeats.
    float wave = sin(dir.x * 2.0 + t * 0.08) * 0.06 + sin(dir.x * 3.7 - t * 0.05 + 1.3) * 0.03;
    float bandCenter = uCenterElevation + wave;

    // The curtain's thickness and overall brightness also breathe slowly,
    // each sampled from its own slow time-scrolled noise rather than a
    // clean sine, so they don't pulse in lockstep with each other.
    float widthMod = 0.8 + 0.35 * noise(vec2(dir.x * 0.6, t * 0.02));
    float brightMod = 0.75 + 0.45 * noise(vec2(dir.x * 0.5 + 91.0, t * 0.025));
    float bandWidth = uBandWidth * widthMod;

    float distFromCenter = dir.y - bandCenter;
    // Gaussian envelope — inherently smooth with no hard edge, so the top/
    // bottom fade is "free" rather than needing a separate smoothstep cut.
    float envelope = exp(-(distFromCenter * distFromCenter) / (bandWidth * bandWidth));

    // dir.x is continuous and bounded (no atan2-style wrap) within the
    // camera's limited forward FOV, so it's safe to sample directly.
    vec2 p = vec2(dir.x * 7.0, dir.y * 5.0);
    float ridge = ridgedFbmFlow(p, uOctaves, t);

    // Confines the curtain to one side of the sky (away from the moon and
    // the Milky Way's sweep) instead of spanning the full width — another
    // smooth Gaussian, so it fades out rather than being clipped.
    float azimuthOffset = dir.x - uCenterAzimuth;
    float azimuthEnvelope = exp(-(azimuthOffset * azimuthOffset) / (uAzimuthWidth * uAzimuthWidth));

    float intensity = envelope * azimuthEnvelope * ridge * uBrightness * brightMod;

    // Altitude-style color shift, remapped into the site's mint/blue
    // palette: mint at the band's lower edge, a faint cool-violet lean at
    // its upper edge — never a full hue change, just a cooler tilt.
    float heightT = clamp((dir.y - (bandCenter - bandWidth)) / (bandWidth * 2.0), 0.0, 1.0);
    vec3 color = mix(uColorLow, uColorHigh, heightT);

    vec3 finalColor = color * intensity;
    // Kept under the scene's shared Bloom luminance threshold (0.7), same
    // reasoning as the Milky Way band — this must never rely on Bloom.
    finalColor = min(finalColor, vec3(0.55));

    gl_FragColor = vec4(finalColor, intensity);
  }
`;

export default function Aurora({ octaves }: { octaves: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Low, near-horizon altitude — the aurora is an atmospheric
      // phenomenon much closer than the Milky Way, so it belongs low in
      // the sky rather than near the zenith. Kept just above where the
      // grass silhouettes reach, not overlapping them.
      uCenterElevation: { value: 0.14 },
      uBandWidth: { value: 0.12 },
      // Biased to the left side of the sky, opposite the moon (which sits
      // in the top-right corner) and away from the Milky Way's diagonal
      // sweep through the upper-middle/right — so the two read as separate
      // phenomena instead of overlapping in the same region.
      uCenterAzimuth: { value: -0.55 },
      uAzimuthWidth: { value: 0.5 },
      uBrightness: { value: 0.55 },
      uOctaves: { value: octaves },
      uColorLow: { value: new THREE.Color("#cdeedd") },
      uColorHigh: { value: new THREE.Color("#b3c6e8") },
    }),
    [octaves]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <sphereGeometry args={[58, 64, 48]} />
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
