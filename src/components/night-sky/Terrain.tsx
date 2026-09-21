"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_NEAR_Z, TERRAIN_FAR_Z, TERRAIN_GROUND_Y, terrainHeightAt } from "./terrainHeight";

// A gently rolling heightfield standing in for the flat ground the scene
// used to have — built by hand as a grid mesh whose vertices sample
// terrainHeightAt() directly (the same function GrassField uses to plant
// blades), so the mesh and the grass growing on it always agree on where
// the ground actually is.
const SEGMENTS_X = 72;
const SEGMENTS_Z = 56;
const FRUSTUM_MARGIN = 1.25;

function buildTerrainGeometry(halfWidthNear: number, halfWidthFar: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iz = 0; iz <= SEGMENTS_Z; iz++) {
    const v = iz / SEGMENTS_Z;
    const z = THREE.MathUtils.lerp(TERRAIN_NEAR_Z, TERRAIN_FAR_Z, v);
    // The frustum's own half-width widens with depth — following that
    // shape (rather than a constant width) means every vertex generated is
    // one that can actually be on screen, the same reasoning Starfield and
    // GroundFog used for their own footprints.
    const halfWidth = THREE.MathUtils.lerp(halfWidthNear, halfWidthFar, v) * FRUSTUM_MARGIN;
    for (let ix = 0; ix <= SEGMENTS_X; ix++) {
      const u = ix / SEGMENTS_X;
      const x = THREE.MathUtils.lerp(-halfWidth, halfWidth, u);
      const y = terrainHeightAt(x, z);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const rowStride = SEGMENTS_X + 1;
  for (let iz = 0; iz < SEGMENTS_Z; iz++) {
    for (let ix = 0; ix < SEGMENTS_X; ix++) {
      const a = iz * rowStride + ix;
      const b = a + 1;
      const c = a + rowStride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDepthT;

  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    vDepthT = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uGroundColor;
  uniform vec3 uHazeColor;
  uniform vec3 uMoonDir;
  uniform vec3 uMoonTint;
  uniform float uGroundY;
  uniform float uAmplitudeNear;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vDepthT;

  void main() {
    vec3 N = normalize(vNormal);
    float diffuse = max(dot(N, normalize(uMoonDir)), 0.0) * 0.5 + 0.5;
    vec3 color = uGroundColor * (0.7 + 0.5 * diffuse);

    // Elevation tinting, added rather than multiplied — on a base color
    // this dark, even a wide multiplicative range barely moves the actual
    // pixel value (12/255 × 1.3 is still only ~16/255, invisible against a
    // near-black night scene), so ridgelines get a small additive lift
    // instead, letting them read as raised ground independent of the
    // (gentle) slope angle at any single point.
    float elevT = clamp((vWorldPos.y - uGroundY) / uAmplitudeNear * 0.5 + 0.5, 0.0, 1.0);
    color += vec3(0.02, 0.05, 0.045) * elevT;

    float moonBias = pow(max(dot(N, normalize(uMoonDir)), 0.0), 3.0) * 0.12;
    color = mix(color, uMoonTint, moonBias);

    // Distance haze — the far hills recede into the sky's own color rather
    // than staying crisp all the way to the horizon, same idea as the
    // atmospheric extinction already applied to stars.
    float haze = smoothstep(0.35, 1.0, vDepthT);
    color = mix(color, uHazeColor, haze * 0.75);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Terrain() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const geometry = useMemo(() => {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const nearDepth = camera.position.z - TERRAIN_NEAR_Z;
    const farDepth = camera.position.z - TERRAIN_FAR_Z;
    const halfWidthNear = nearDepth * Math.tan(vFov / 2) * camera.aspect;
    const halfWidthFar = farDepth * Math.tan(vFov / 2) * camera.aspect;
    return buildTerrainGeometry(halfWidthNear, halfWidthFar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  const uniforms = useMemo(
    () => ({
      // Deep green-teal, dark enough to sit comfortably under the sky's
      // own navy without competing with it.
      uGroundColor: { value: new THREE.Color("#0c1f1a") },
      uHazeColor: { value: new THREE.Color("#141b2c") },
      uMoonDir: { value: new THREE.Vector3(0.3, 0.55, 0.2).normalize() },
      uMoonTint: { value: new THREE.Color("#547f68") },
      uGroundY: { value: TERRAIN_GROUND_Y },
      uAmplitudeNear: { value: 1.35 },
    }),
    []
  );

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        // Hand-built winding isn't hand-verified — double-sided sidesteps
        // needing to work that out, same reasoning as River's strip.
        side={THREE.DoubleSide}
        transparent={false}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}
