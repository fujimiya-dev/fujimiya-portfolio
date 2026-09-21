"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";

// Adapted from the procedural-starfield skill's moon.vert/moon.frag (see
// procedural-stars-threejs/celestial-shaders.md), but rebuilt around real
// lunar photometry rather than the skill's default Lambert (max(NdotL, 0))
// shading. Helfenstein & Veverka (1987) found the Moon's disc has almost no
// limb darkening near full phase — it reads as a nearly flat, evenly lit
// disc with a comparatively crisp terminator, not a smoothly shaded sphere,
// because its surface (rough regolith) reflects very differently from an
// ideal Lambertian ball. See the STEP 1/2/3 comments below for how each
// piece (flat lighting, albedo-based maria/craters, earthshine) maps to
// that.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uSunDir;
  uniform vec3 uMoonColor;
  uniform vec3 uMareColor;
  uniform vec3 uShadowColor;
  uniform vec3 uEarthshineColor;
  uniform float uCraterScale;
  uniform float uCraterDepth;
  uniform float uMareScale;
  uniform vec3 uPatternOffset;

  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  // Smooth 3D value noise (trilinear-interpolated hash lattice) — used only
  // to domain-warp the mare pattern below. A raw Voronoi cell boundary is a
  // straight polygon edge; real maria have wavy, irregular coastlines, so
  // the sample position is perturbed by this noise before the Voronoi
  // lookup rather than drawing the Voronoi pattern directly.
  float noise3(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  // Multi-octave fbm built on noise3 — a fine, all-over "grain" so the
  // surface reads as textured regolith rather than flat-shaded color
  // fields, the biggest single gap between the previous version and an
  // actual lunar photo.
  float fbm3(vec3 p, int oct) {
    float sum = 0.0, amp = 0.5, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise3(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.07;
    }
    return sum / maxA;
  }

  vec3 domainWarp(vec3 p, float freq, float strength) {
    vec3 offset = vec3(
      noise3(p * freq),
      noise3(p * freq + vec3(37.2, 17.1, 9.3)),
      noise3(p * freq + vec3(91.7, 3.4, 58.2))
    ) - 0.5;
    return p + offset * strength;
  }

  // Voronoi F1: low near cell centers (crater floors), rising toward cell
  // boundaries (crater rims/ridges).
  float craters(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    float minDist = 1.0;
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
      vec3 nb = vec3(float(x), float(y), float(z));
      vec3 pt = vec3(hash(i + nb), hash((i + nb) * 1.3), hash((i + nb) * 1.7));
      float d = length(nb + pt - f);
      minDist = min(minDist, d);
    }
    return smoothstep(0.0, 0.4, minDist);
  }

  // Maria as albedo, not shading. Real maria (the "seas") are a handful of
  // large, irregular dark patches — only some Voronoi cells become maria
  // (per-cell hash gate), and within a mare cell the blob fades toward the
  // cell's own boundary rather than filling it edge-to-edge, so it reads as
  // an uneven dark region, not a tiled pattern. This returns 0..1 purely as
  // a function of surface position — never touched by NdotL/diffuse — so
  // the mare/highland pattern stays exactly as contrasted right up to the
  // terminator line as it is at the sub-solar point, the way it does on the
  // real Moon. gateThreshold/edgeSoftness are exposed so the same function
  // can serve both the big, sparse, high-contrast mare layer and (at a
  // finer scale, with different parameters) contribute crater floors.
  float mareMask(vec3 p, float gateThreshold, float edgeSoftness) {
    vec3 i = floor(p); vec3 f = fract(p);
    float minDist = 1.0;
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
      vec3 nb = vec3(float(x), float(y), float(z));
      vec3 pt = vec3(hash(i + nb), hash((i + nb) * 1.3), hash((i + nb) * 1.7));
      float d = length(nb + pt - f);
      minDist = min(minDist, d);
    }
    vec3 cellId = i;
    float isMareCell = step(gateThreshold, hash(cellId * 2.7));
    float blob = 1.0 - smoothstep(0.05, edgeSoftness, minDist);
    return isMareCell * blob;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDir);

    // Multi-scale crater height field: a few large sparse craters, more
    // medium ones, and fine small-scale texture — not one uniform dot size.
    float hBig = craters(vPosition * uCraterScale * 0.45);
    float hMed = craters(vPosition * uCraterScale);
    float hSmall = craters(vPosition * uCraterScale * 3.2);
    float height = clamp(hBig * 0.5 + hMed * 0.35 + hSmall * 0.25, 0.0, 1.0);

    // Mare/highland albedo, two clearly different tiers rather than one
    // blended pattern. The big layer is the actual subject — a handful
    // (2-4) of large, low-frequency blobs at full mare/highland color
    // contrast, meant to read as continents at a glance. The fine layer
    // (much higher frequency, reusing the same function with a lower gate
    // threshold so more, smaller cells qualify) only ever nudges the
    // albedo a little — texture/seasoning, never competing with the big
    // pattern for attention.
    // Two warp passes at different frequencies — a finer one to round off
    // the Voronoi's straight edges, then a much lower-frequency, larger-
    // amplitude one on top to bow the whole coastline gently, the way a
    // real mare's outline wanders instead of just being individually
    // wrinkled. The single-warp version still looked like an artificial
    // blob; a coastline needs irregularity at more than one scale.
    // No fine/second mare layer this round — that second layer of small
    // patches was a large part of what read as "stains" rather than a
    // continent; one clean layer at a bigger scale is the actual request.
    // The second pass was originally far lower-frequency than the cell
    // size, which just nudged each blob's position rather than actually
    // wiggling its edge (a warp whose own wavelength is several cells wide
    // barely varies across any one cell). Brought up close to the cell
    // scale itself so it contributes real, medium-scale edge irregularity
    // distinct from the first pass's finer wiggle.
    vec3 warpedBig = domainWarp(vPosition + uPatternOffset, uMareScale * 0.8, 0.9 / uMareScale);
    warpedBig = domainWarp(warpedBig, uMareScale * 0.45, 1.3 / uMareScale);
    float mareBig = mareMask(warpedBig * uMareScale, 0.55, 0.78);
    // Contrast eased back — a visible but gentle tint difference rather
    // than a hard-edged dark/light split.
    vec3 albedo = mix(uMoonColor, uMareColor, mareBig * 0.62);

    // Fine all-over grain — two frequencies (a coarser mottle plus a finer
    // speckle) so it doesn't read as one uniform noise scale, applied as a
    // gentle multiplicative variation everywhere, maria included.
    float grainCoarse = fbm3(vPosition * 3.2, 4);
    float grainFine = fbm3(vPosition * 11.0, 3);
    float grain = grainCoarse * 0.65 + grainFine * 0.35;
    albedo *= 0.82 + 0.34 * grain;

    // A single bright ray-crater (a stand-in for something like Tycho) —
    // the single most recognizable feature a procedural moon was missing.
    // Built from the angle around a fixed crater-center direction: a small
    // bright disc at the center, surrounded by high-frequency streaks
    // along the azimuthal angle that fade out with angular distance, the
    // classic "splash" look of fresh ejecta rays.
    vec3 rayCenter = normalize(vec3(-0.22, -0.62, 0.75));
    vec3 dirN = normalize(vPosition);
    float cosToRay = dot(dirN, rayCenter);
    float angDist = acos(clamp(cosToRay, -1.0, 1.0));
    vec3 tangentRef = abs(rayCenter.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangentU = normalize(cross(tangentRef, rayCenter));
    vec3 tangentV = cross(rayCenter, tangentU);
    float az = atan(dot(dirN, tangentV), dot(dirN, tangentU));
    float rayStreakNoise = fbm3(vec3(az * 9.0, angDist * 3.0, 0.0), 3);
    float raySharp = smoothstep(0.42, 0.68, rayStreakNoise);
    float rayFalloff = smoothstep(0.34, 0.03, angDist);
    float rayMask = raySharp * rayFalloff;
    float rayCraterFloor = smoothstep(0.05, 0.0, angDist);
    albedo = mix(albedo, uMoonColor * 1.35, clamp(rayMask, 0.0, 1.0));
    albedo = mix(albedo, uMoonColor * 0.7, rayCraterFloor);

    // STEP 1 — flat-disc lighting, replacing ordinary Lambert shading.
    // Real lunar photometry (Helfenstein & Veverka 1987) shows almost no
    // limb darkening near full phase: the whole lit face reads as close to
    // one uniform brightness, not a smooth cos-falloff sphere gradient, and
    // the day/night line itself is comparatively crisp rather than a soft
    // gradient band. litMask does the actual day/night gating — widened
    // 3x from the first pass (±0.02 read as an unnaturally hard/aliased
    // edge) to a soft-but-local blur right at the line, not the wide
    // gradient sweeping across most of the disc that caused the original
    // "looks like a lit sphere" complaint. subtleShade is kept deliberately
    // shallow (a 12% range, not full NdotL contrast) so the lit and shadow
    // faces both stay flat on their own — only the boundary between them
    // softens.
    float NdotL = dot(N, L);
    float litMask = smoothstep(-0.06, 0.06, NdotL);
    float subtleShade = 0.88 + 0.12 * clamp(NdotL, 0.0, 1.0);
    float diffuse = litMask * subtleShade;

    // Craters rendered as visible albedo features (dark floor, bright rim)
    // rather than a faint AO tint — the reference photo shows individual
    // craters clearly, not just a subtle overall roughening.
    float craterFloor = 1.0 - smoothstep(0.0, 0.22, height);
    float craterRim = smoothstep(0.48, 0.62, height) * (1.0 - smoothstep(0.62, 0.86, height));
    vec3 texturedAlbedo = albedo;
    texturedAlbedo = mix(texturedAlbedo, texturedAlbedo * 0.6, craterFloor * uCraterDepth);
    texturedAlbedo = mix(texturedAlbedo, texturedAlbedo * 1.4, craterRim * uCraterDepth);

    vec3 litColor = texturedAlbedo;
    vec3 color = mix(uShadowColor, litColor, diffuse);

    // STEP 3 — earthshine. Faint, cool, complementary light on the dark
    // side (sunlight bounced off Earth, then off the Moon) rather than true
    // black — gated by litMask, not diffuse, for the same reason as the
    // terminator itself: gating by a gradual value would soften the sharp
    // line this rewrite exists to produce. The same mare/highland albedo
    // shows through it too, just faintly — earthshine still bounces off
    // the Moon's real surface, so the seas read very slightly darker even
    // in earthlight, not as a flat wash of one color.
    float earthshine = (1.0 - litMask) * 0.12;
    float earthshineAlbedo = mix(1.0, 0.65, mareBig);
    color += uEarthshineColor * earthshine * earthshineAlbedo;

    // No limb brightening/fresnel rim this round — real lunar limb
    // brightness matches the disc, so a rim-light term (however gentle)
    // reintroduces the exact "lit sphere" cue this shader is being
    // rewritten to remove.

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Moon() {
  const position = useMoonPosition();
  const uniforms = useMemo(
    () => ({
      // Phase only — how much of the disc is lit — comes from the angle
      // between this and the camera's own view direction to the Moon;
      // everything else (flat lighting, terminator blur, maria) is
      // unrelated to this value. The previous (0.35, 0.4, 1.0) sat at
      // roughly a 64° phase angle from the camera-to-Moon direction (close
      // to the classic half-moon case). Pulled in close to that view
      // direction for a near-full phase; a first attempt landed almost
      // exactly on it (~99% lit, no visible shadow at all), so backed off
      // partway for a thin, clearly-visible dark sliver instead of none.
      uSunDir: { value: new THREE.Vector3(0.06, 0.15, 0.99).normalize() },
      // Rough first pass toward a reference image's vivid emerald/teal
      // moon (sampled directly from it: lit highlands ~#88d7b6-#b5eede,
      // maria ~#308284-#348f88) — a straight color swap over the existing
      // shading/crater/mare logic, not a shader rework.
      uMoonColor: { value: new THREE.Color("#8ddcc0") },
      uMareColor: { value: new THREE.Color("#2f8c82") },
      uShadowColor: { value: new THREE.Color("#123028") },
      uEarthshineColor: { value: new THREE.Color("#2f6d63") },
      uCraterScale: { value: 2.6 },
      uCraterDepth: { value: 0.55 },
      // Lowered again (was 0.5) — even at 0.5 the maria still read as
      // scattered "stains" rather than a couple of continent-scale seas;
      // bigger cells with the reduced contrast/two-pass warp below is what
      // actually gets a "handful of big soft patches" look.
      uMareScale: { value: 0.32 },
      // Shifts which part of the (infinite, tiled) mare pattern lands on
      // the small visible crescent — only the framing changes, not the
      // pattern's own scale/shape. Found the same way as before: the
      // hash/Voronoi/domain-warp math ported to a small Node script,
      // searching random offsets for one whose mare coverage — sampled
      // over the actual visible-and-lit direction cone, with this round's
      // scale/warp/contrast — lands in the target range.
      uPatternOffset: { value: new THREE.Vector3(-23.54, -2.87, 24.16) },
    }),
    []
  );

  return (
    <mesh position={position}>
      {/* 1.6x the previous 3.4 radius, per explicit request */}
      <sphereGeometry args={[5.44, 64, 64]} />
      <shaderMaterial vertexShader={VERTEX_SHADER} fragmentShader={FRAGMENT_SHADER} uniforms={uniforms} toneMapped={true} />
    </mesh>
  );
}
