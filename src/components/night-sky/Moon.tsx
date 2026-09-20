"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";

// Adapted from the procedural-starfield skill's moon.vert/moon.frag (see
// procedural-stars-threejs/celestial-shaders.md), but deliberately de-tuned
// away from photoreal shading: the scene's other elements (particle stars,
// shader-painted grass) read as illustrated rather than physically lit, so
// a crisp specular sphere stood out. The terminator is stretched into a
// very wide, soft band, crater relief is kept as faint low-contrast texture
// rather than real AO/highlight, and the limb brightening is a gentle wide
// glow instead of a thin fresnel highlight — the goal is "a moon painted
// into the scene," not a rendered satellite.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uSunDir;
  uniform vec3 uMoonColor;
  uniform vec3 uShadowColor;
  uniform vec3 uEarthshineColor;
  uniform float uCraterScale;
  uniform float uCraterDepth;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
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

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(vViewPosition);

    // Multi-scale crater height field: a few large sparse craters, more
    // medium ones, and fine small-scale texture — not one uniform dot size.
    float hBig = craters(vPosition * uCraterScale * 0.45);
    float hMed = craters(vPosition * uCraterScale);
    float hSmall = craters(vPosition * uCraterScale * 3.2);
    float height = clamp(hBig * 0.5 + hMed * 0.35 + hSmall * 0.25, 0.0, 1.0);

    // Terminator uses the clean geometric normal only. Deliberately a very
    // wide, gentle band (not a realistic ~sun-angular-size terminator) so
    // the disc reads as evenly, softly lit — "painted" rather than a
    // photoreal sphere with a sharp day/night line.
    float NdotL = dot(N, L);
    float diffuse = smoothstep(-0.4, 0.15, NdotL);

    // Crater relief kept only as faint texture — contrast intentionally
    // much lower than a realistic AO/specular map would use, so the face
    // reads as one softly glowing shape rather than a lit 3D object.
    float ao = mix(1.0 - uCraterDepth * 0.16, 1.0, height);
    float rim = smoothstep(0.55, 0.85, height) * 0.05;

    vec3 litColor = uMoonColor * (ao + rim);
    vec3 color = mix(uShadowColor, litColor, diffuse);

    // Earthshine: faint complementary glow strongest away from the lit face.
    float earthshine = (1.0 - diffuse) * 0.12;
    color += uEarthshineColor * earthshine * ao;

    // A gentle, wide limb brightening instead of a sharp specular-looking
    // highlight — low fresnel power spreads it across much of the visible
    // edge rather than pinching it into a thin bright ring.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    color += uMoonColor * fresnel * 0.18;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Moon() {
  const position = useMoonPosition();
  const uniforms = useMemo(
    () => ({
      uSunDir: { value: new THREE.Vector3(0.35, 0.4, 1.0).normalize() },
      uMoonColor: { value: new THREE.Color("#aad4ae") },
      uShadowColor: { value: new THREE.Color("#22374f") },
      uEarthshineColor: { value: new THREE.Color("#4a6a8a") },
      uCraterScale: { value: 2.6 },
      uCraterDepth: { value: 0.55 },
    }),
    []
  );

  return (
    <mesh position={position}>
      <sphereGeometry args={[3.4, 64, 64]} />
      <shaderMaterial vertexShader={VERTEX_SHADER} fragmentShader={FRAGMENT_SHADER} uniforms={uniforms} toneMapped={false} />
    </mesh>
  );
}
