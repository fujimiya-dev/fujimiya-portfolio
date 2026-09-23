"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";

// Replaces the flat single-color Canvas background with a large opaque
// sphere (behind everything, including the Milky Way band) so the base sky
// itself can carry things a flat color can't: a zenith/horizon/nadir blend
// with the horizon brightened like real atmospheric scattering (instead of
// a flat top-to-bottom fade), and a very gentle greenish bias on the side of
// the sky where the moon sits — blurring the line between "background" and
// "area lit by the moon" instead of leaving the glow as a hard-edged patch
// over a uniform backdrop. Every color here is a dark navy/purple, never
// literal black — a star plotted over true black reads as "a dot on a void"
// rather than part of a sky.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uColorTop;
  uniform vec3 uColorMid;
  uniform vec3 uColorBottom;
  uniform vec3 uMoonDir;
  uniform vec3 uMoonTint;
  varying vec3 vDir;

  void main() {
    // Brightest at the horizon (elevation ~0), darkening toward the zenith
    // above and — separately, toward a slightly different color — the
    // nadir below. Top and bottom are asymmetric on purpose (not just a
    // mirrored zenith), matching the reference palette exactly.
    float elevation = clamp(vDir.y, -1.0, 1.0);
    float upT = pow(clamp(elevation, 0.0, 1.0), 1.5);
    float downT = pow(clamp(-elevation, 0.0, 1.0), 1.5);
    // upT and downT are mutually exclusive (elevation can't be both
    // positive and negative), so applying them as two sequential mixes
    // from the same uColorMid base is safe — exactly one of them is ever
    // non-zero at a given fragment.
    vec3 base = mix(uColorMid, uColorTop, upT);
    base = mix(base, uColorBottom, downT);

    float moonAlign = max(dot(vDir, uMoonDir), 0.0);
    float moonBias = pow(moonAlign, 4.0) * 0.22;
    vec3 color = mix(base, uMoonTint, moonBias);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function SkyBackdrop() {
  const moonPos = useMoonPosition();

  const uniforms = useMemo(
    () => ({
      // Reference values, used as linear-space output as-is (no sRGB
      // conversion) in the source design; our renderer applies R3F's
      // default tone mapping/color management, so the on-screen result may
      // read a touch lighter than the reference — checked visually and
      // nudged if needed rather than pre-converting the hex values.
      // uColorMid darkened from the reference #373f61 — the camera's FOV
      // rarely frames true zenith/nadir, so this color (not top/bottom)
      // dominates what's actually visible, and used as-is it read lighter
      // than the reference's dark intent (our renderer's tone mapping/color
      // management pipeline differs from the reference's raw-linear output,
      // as flagged going in). Top/bottom are barely on-screen in practice,
      // so they're kept close to the reference values.
      // Recolored toward a reference image's teal/emerald night sky
      // (sampled directly from it: dominant mid-sky background
      // ~#07293a-#0b3247, brightening toward ~#246a73-#276d73 on the
      // moon's side) — same zenith/mid/nadir + moon-tint structure as
      // before, just a color swap.
      uColorTop: { value: new THREE.Color("#020d16") },
      uColorMid: { value: new THREE.Color("#0a2e3f") },
      uColorBottom: { value: new THREE.Color("#041018") },
      uMoonDir: { value: new THREE.Vector3(0, 0, -1) },
      uMoonTint: { value: new THREE.Color("#2b7a80") },
    }),
    []
  );

  useMemo(() => {
    uniforms.uMoonDir.value.set(moonPos[0], moonPos[1], moonPos[2]).normalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moonPos[0], moonPos[1], moonPos[2]]);

  return (
    <mesh renderOrder={-3}>
      <sphereGeometry args={[65, 32, 24]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
