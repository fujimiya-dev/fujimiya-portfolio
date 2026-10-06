"use client";

import { useThree } from "@react-three/fiber";
import { useRef } from "react";
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

// Below this many px of difference, a reported size.width change is
// treated as noise rather than a real resize — same threshold/reasoning as
// GrassField.tsx's WIDTH_CHANGE_THRESHOLD_PX.
const WIDTH_CHANGE_THRESHOLD_PX = 20;

export function useMoonPosition(): [number, number, number] {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  // Manual ref-cache instead of useMemo(..., [..., size.width, size.height])
  // — identical fix to GrassField.tsx's and Starfield.tsx's. halfWidth here
  // is directly proportional to camera.aspect (width/height), so a mobile
  // browser's address bar collapsing on scroll (a height-only viewport
  // change, which changes aspect without changing width) was recomputing a
  // genuinely different corner position every time, not just redundantly
  // recomputing the same one — the moon visibly hopped on scroll.
  // Deliberately NOT keyed on camera.aspect itself (that's the value being
  // stabilized against) — only on size.width past the noise threshold, and
  // on fov in case that's ever made dynamic (it's a fixed 50 today).
  const cacheRef = useRef<{ width: number; fov: number; position: [number, number, number] } | null>(null);
  const cache = cacheRef.current;
  const needsRecompute =
    !cache || cache.fov !== camera.fov || Math.abs(cache.width - size.width) > WIDTH_CHANGE_THRESHOLD_PX;

  if (needsRecompute) {
    const distance = camera.position.z - MOON_Z;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const halfHeight = distance * Math.tan(vFov / 2);
    const halfWidth = halfHeight * camera.aspect;
    cacheRef.current = {
      width: size.width,
      fov: camera.fov,
      position: [halfWidth - CORNER_INSET, halfHeight - CORNER_INSET, MOON_Z],
    };
  }

  return cacheRef.current!.position;
}
