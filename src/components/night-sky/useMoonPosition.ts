"use client";

import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

// The moon sits near the top-right corner of the visible frustum (at its
// fixed depth), pulled in slightly from the exact corner so more than a
// bare quarter of its bottom-left portion reads on-screen — most of the
// disc is still clipped off by the viewport edge. Computed from the live
// camera fov/aspect (not a hardcoded world position) so it lands correctly
// across every viewport size, including the very different aspect ratio on
// mobile.
const MOON_Z = -14;
const CORNER_INSET = 1.3;

export function useMoonPosition(): [number, number, number] {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  return useMemo(() => {
    const distance = camera.position.z - MOON_Z;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const halfHeight = distance * Math.tan(vFov / 2);
    const halfWidth = halfHeight * camera.aspect;
    return [halfWidth - CORNER_INSET, halfHeight - CORNER_INSET, MOON_Z];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, camera.aspect, camera.fov, size.width, size.height]);
}
