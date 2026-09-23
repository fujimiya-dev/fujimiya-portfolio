"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  MILKY_WAY_BAND_TILT,
  MILKY_WAY_BAND_ROLL,
  MILKY_WAY_BAND_WIDTH,
  MILKY_WAY_BAND_CURVE,
} from "./milkyWayBand";

// The rendered band is widened slightly below (uBandWidth) for more visual
// presence, but MILKY_WAY_BAND_WIDTH itself stays untouched — that's the
// shared constant Starfield.tsx also reads for its own band-biased star
// density, and the request was explicitly to leave the star clustering as
// it is. Deliberately not importing the widened value into that shared
// constant, so the two stay decoupled: the visual band reads a bit bigger
// without moving where stars cluster to match it.
// Widened two more steps beyond the earlier +12% pass, per request — only
// this multiplier changes; sparkle/mottle/dust/BAND_BIAS (density/texture)
// are untouched, so the band gets visually broader without reading as any
// denser or star-crowded than before.
const RENDER_BAND_WIDTH = MILKY_WAY_BAND_WIDTH * 1.45;

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
  uniform float uBandRoll;
  uniform float uBandCurve;
  uniform float uCoreSpread;
  uniform float uCoreBoost;
  uniform float uDustDepth;
  uniform float uDustWidth;
  uniform vec3  uCoreColor;
  uniform vec3  uEdgeColor;

  varying vec3 vWorldDir;

  // A sin()-based hash loses precision once its dot-product argument gets
  // large — and the sparkle layer below samples noise at up to ~150x this
  // shader's uv scale, comfortably into the range where that shows up as a
  // patterned/blocky region rather than true noise (this is what produced
  // the sharp trapezoid patch: not a bounded coordinate range, but a hash
  // that stops looking random past a certain input magnitude). This
  // fract/dot-mix hash has no trig call and stays well-behaved much
  // further out.
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
    float sum = 0.0, amp = 1.0, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.1;
    }
    return sum / maxA;
  }

  // 3D counterparts, sampled directly by direction vector so the coarse
  // "mottle" layer has no angle-wrap seam to worry about at all (unlike the
  // 2D noise() above, which needs the continuous d.x proxy instead of raw
  // galLon for the same reason).
  float hash3(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i + vec3(0.0, 0.0, 0.0)), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  float fbm3(vec3 p, int oct) {
    float sum = 0.0, amp = 1.0, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise3(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.1;
    }
    return sum / maxA;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);

    // Roll around the view axis first — this is what actually makes the
    // band cross the screen diagonally (the old code only pitched it up/
    // down via dir.y/dir.z, which produces a band that's roughly level,
    // not a corner-to-corner sweep) — then pitch it up and away from the
    // horizon via uBandTilt.
    float cr = cos(uBandRoll), sr = sin(uBandRoll);
    vec3 d = vec3(dir.x * cr - dir.y * sr, dir.x * sr + dir.y * cr, dir.z);

    float galLat = d.y * cos(uBandTilt) - d.z * sin(uBandTilt);
    float galLon = atan(d.x, d.z * cos(uBandTilt) + d.y * sin(uBandTilt));

    // A gentle bow along the band's length instead of a perfectly straight
    // strip. sin(galLon * N) is only continuous across the atan2 wrap
    // (galLon jumping from +pi to -pi) when N is an integer — sin(N*theta)
    // is 2*pi-periodic in theta iff N is a whole number. The previous
    // factor of 1.5 broke that, producing a genuine discontinuity (not just
    // a precision issue) exactly where the wrap crossed the band, which
    // read as a hard crack splitting it in two.
    float curvedLat = galLat + uBandCurve * sin(galLon * 2.0);
    float band = exp(-curvedLat * curvedLat / (uBandWidth * uBandWidth));

    // galLon (atan2 output) jumps from +pi to -pi at its wrap-around — sampled
    // directly into noise(), that jump reads as a hard seam wherever it
    // crosses the band. d.x is continuous everywhere (no branch cut) and
    // tracks the same "position along the band" for our purposes, so the
    // texture noise is sampled from it instead; galLon itself is kept for
    // the band's actual shape (band/core), which are smooth functions of it
    // and don't have this problem.
    vec2 uv = vec2(d.x * 6.0, curvedLat * 8.0);
    float structure = fbm(uv * 3.0, 5);
    structure = structure * 0.7 + 0.3;

    // Two independent-frequency 3D fBM layers multiplied together — a coarse
    // patchiness (11.0) modulated by finer variation (34.0), sampled by the
    // raw (unrolled, untilted) direction so it reads as one continuous
    // texture draped across the whole sky rather than being warped by the
    // band's own coordinate frame.
    float mottle = mix(0.25, 1.45, fbm3(dir * 11.0, 4)) * mix(0.6, 1.3, fbm3(dir * 34.0, 3));

    // Dust lane offset from the band's true centerline rather than sitting
    // exactly on it — a real, un-retouched photo never has its dust lane
    // perfectly bisecting the band; a small fixed offset breaks that
    // "drawn with a ruler" symmetry.
    // uDustWidth (0.04) is narrow enough that per-triangle interpolation of
    // vWorldDir (linear, then renormalized) leaves visible faceting in it —
    // widening the effective width by the local screen-space derivative
    // keeps the falloff smooth regardless of the sphere's mesh density,
    // rather than needing an ever-finer mesh to chase a sharper Gaussian.
    float dustWidthAA = max(uDustWidth, fwidth(curvedLat) * 1.5);
    float dustOffset = (curvedLat - 0.03) / dustWidthAA;
    float dustProfile = exp(-dustOffset * dustOffset);
    float dustNoise = fbm(uv * 4.0 + 1.7, 4);
    float dust = dustProfile * smoothstep(0.3, 0.7, dustNoise) * uDustDepth;

    // Angular distance from the galactic core, in the *original* (pre-roll)
    // direction space — coreDir is where roll+tilt maps back to galLon=0,
    // galLat=0. x*x instead of pow(x, 2.0): pow() is undefined for a
    // negative base in GLSL, and toCore's sign varies.
    vec3 coreDir = normalize(vec3(
      sin(uBandTilt) * sin(uBandRoll),
      sin(uBandTilt) * cos(uBandRoll),
      cos(uBandTilt)
    ));
    float toCore = acos(clamp(dot(dir, coreDir), -1.0, 1.0)) / uCoreSpread;
    float bulge = exp(-(toCore * toCore));

    float mw = band * structure * mottle * (1.0 - dust) + bulge * band * uCoreBoost;
    // Deliberately not run through atmosphericExtinction — the Milky Way is
    // a distant galaxy, not something sitting inside the scene's own
    // atmosphere, so it shouldn't dim near the horizon the way stars and
    // the sky's own base color do.
    mw *= uBrightness;

    // The core's warm tint never fully replaces the band's own color, even
    // at the brightest point — capped at 90% so bandColor always shows
    // through a little.
    vec3 col = mix(uEdgeColor, uCoreColor, clamp(bulge * 1.2, 0.0, 1.0) * 0.9);
    col *= mw;

    // Dense point-like sparkle, layered on top of the smooth cloud texture
    // above rather than folded into it — the band needs to read as countless
    // individual star grains, not just brightness variation in a haze. Two
    // frequencies (offset so they don't share a grid) avoid an even, single-
    // scale speckle and give a more organic density variation.
    float sparkleA = pow(noise(uv * 90.0), 9.0);
    float sparkleB = pow(noise(uv * 150.0 + 47.0), 11.0);
    float sparkle = (sparkleA * 0.8 + sparkleB * 0.55) * band * (1.0 - dust * 0.4);
    col += vec3(0.95, 1.0, 0.98) * sparkle;

    // Kept under the scene's shared Bloom luminance threshold (0.7) so this
    // continuously-rendered band never relies on Bloom for its glow.
    mw = min(mw, 0.6);
    col = min(col, vec3(0.6));

    gl_FragColor = vec4(col, mw);
  }
`;

export default function MilkyWay() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      // Raised ~20% from the previous 1.1 for more overall presence, per
      // request — texture (mottle/dust/core tint/sparkle) below is
      // untouched, so this only scales the band's brightness, not its look.
      uBrightness: { value: 1.32 },
      // +12% over the shared MILKY_WAY_BAND_WIDTH (see RENDER_BAND_WIDTH
      // above) — kept modest since a wider band risks reading as a soft
      // "cloud" rather than a band with real texture, per the earlier
      // lesson on this exact shader.
      uBandWidth: { value: RENDER_BAND_WIDTH },
      uBandTilt: { value: MILKY_WAY_BAND_TILT },
      uBandRoll: { value: MILKY_WAY_BAND_ROLL },
      uBandCurve: { value: MILKY_WAY_BAND_CURVE },
      uCoreSpread: { value: 0.35 },
      uCoreBoost: { value: 1.3 },
      uDustDepth: { value: 0.8 },
      uDustWidth: { value: 0.04 },
      // Recolored toward a reference image's teal/mint night sky (sampled
      // directly from it: background gradient ~#093851-#22606d near the
      // brighter side, star particles ~#8ef1b4) — same band shape/texture
      // below, just a color swap. uCoreColor pushed further toward a more
      // saturated emerald to match the follow-up star-color intensification
      // (Starfield.tsx) — the original was pale enough to read closer to
      // white than green.
      uCoreColor: { value: new THREE.Color("#57e6a0") },
      uEdgeColor: { value: new THREE.Color("#123d34") },
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
