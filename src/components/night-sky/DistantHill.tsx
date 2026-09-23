"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_GROUND_Y } from "./terrainHeight";

// A single, low-contrast hill silhouette tucked into the screen's lower-
// left, far behind the main terrain — not another layer of detail, just a
// place for the eye to rest beyond the grass field's own edge, per the
// "視線の逃げ場" request. Kept deliberately understated: it reads as a
// shape barely darker than the sky/haze behind it, not a second landmass
// competing with the actual foreground.
const HILL_Z = -30;
const HILL_X_FRACTION = -0.62; // left of center, as a fraction of the
// frustum half-width at HILL_Z — negative = screen-left, matching the
// moon's position on the right so the composition balances.
// Sized as a fraction of the frustum's own half-width at HILL_Z (not a
// fixed world size) — a fixed radius looked fine on a wide desktop
// frustum but ate most of a narrow mobile one, since the same 15-unit
// radius is a much bigger fraction of a much narrower view.
const HILL_RADIUS_X_FRACTION = 0.5;
const HILL_RADIUS_Z_FRACTION = 0.3;
const HILL_PEAK = 3.4; // rises well above the regular terrain amplitude at
// this depth (~0.15) so it silhouettes as a distinct, deliberate hill
// rather than reading as more of the same ground undulation.
const SEGMENTS = 36;

function hash2(x: number, y: number): number {
  const frac = (v: number) => v - Math.floor(v);
  let p3x = frac(x * 0.1031);
  let p3y = frac(y * 0.103);
  let p3z = frac(x * 0.0973);
  const d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  p3x += d;
  p3y += d;
  p3z += d;
  return frac((p3x + p3y) * p3z);
}

function smootherstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

function smoothHash(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const xf = smootherstep(x - x0);
  const zf = smootherstep(z - z0);
  const n00 = hash2(x0, z0);
  const n10 = hash2(x0 + 1, z0);
  const n01 = hash2(x0, z0 + 1);
  const n11 = hash2(x0 + 1, z0 + 1);
  const ix0 = n00 + (n10 - n00) * xf;
  const ix1 = n01 + (n11 - n01) * xf;
  return ix0 + (ix1 - ix0) * zf;
}

function hillHeightAt(localX: number, localZ: number, radiusX: number, radiusZ: number): number {
  // Elongated radial falloff (wider along X than Z) so the silhouette reads
  // as a ridge glimpsed from the side, not a perfectly round dome.
  const dist = Math.sqrt((localX / radiusX) ** 2 + (localZ / radiusZ) ** 2);
  const bump = smootherstep(1 - dist);
  // A little low-frequency, smoothly-interpolated irregularity on the ridge
  // line itself, so the silhouette isn't a mathematically perfect bump —
  // kept gentle and bilinearly smoothed (not raw per-cell hash) so it reads
  // as a soft, natural rise rather than a faceted/jagged outline.
  const ripple = (smoothHash(localX * 0.12, localZ * 0.12) - 0.5) * 0.35;
  return TERRAIN_GROUND_Y + HILL_PEAK * bump + ripple * bump;
}

function buildHillGeometry(centerX: number, radiusX: number, radiusZ: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const halfX = radiusX * 1.3;
  const halfZ = radiusZ * 1.3;

  for (let iz = 0; iz <= SEGMENTS; iz++) {
    const v = iz / SEGMENTS;
    const localZ = THREE.MathUtils.lerp(-halfZ, halfZ, v);
    for (let ix = 0; ix <= SEGMENTS; ix++) {
      const u = ix / SEGMENTS;
      const localX = THREE.MathUtils.lerp(-halfX, halfX, u);
      const y = hillHeightAt(localX, localZ, radiusX, radiusZ);
      positions.push(centerX + localX, y, HILL_Z + localZ);
    }
  }

  const rowStride = SEGMENTS + 1;
  for (let iz = 0; iz < SEGMENTS; iz++) {
    for (let ix = 0; ix < SEGMENTS; ix++) {
      const a = iz * rowStride + ix;
      const b = a + 1;
      const c = a + rowStride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uHazeColor;
  uniform vec3 uMoonDir;
  varying vec3 vNormal;

  void main() {
    vec3 N = normalize(vNormal);
    // Only the faintest hint of shading — this shape exists to be a
    // silhouette, not a lit object competing for attention.
    float diffuse = max(dot(N, normalize(uMoonDir)), 0.0) * 0.5 + 0.5;
    vec3 color = uHazeColor * (0.9 + 0.06 * diffuse);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function DistantHill() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const geometry = useMemo(() => {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const depth = camera.position.z - HILL_Z;
    const halfWidth = depth * Math.tan(vFov / 2) * camera.aspect;
    return buildHillGeometry(
      halfWidth * HILL_X_FRACTION,
      halfWidth * HILL_RADIUS_X_FRACTION,
      halfWidth * HILL_RADIUS_Z_FRACTION
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  const uniforms = useMemo(
    () => ({
      // Close to the sky's own dark navy at that part of the frame — a
      // hint of a shape, not a hard silhouette.
      uHazeColor: { value: new THREE.Color("#1a2338") },
      uMoonDir: { value: new THREE.Vector3(0.3, 0.55, 0.2).normalize() },
    }),
    []
  );

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={false}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}
