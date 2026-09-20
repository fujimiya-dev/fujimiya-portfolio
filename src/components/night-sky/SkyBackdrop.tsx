"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useMoonPosition } from "./useMoonPosition";

// Replaces the flat single-color Canvas background with a large opaque
// sphere (behind everything, including the Milky Way band) so the base sky
// itself can carry two things a flat color can't: the site's existing
// dark-navy vertical blend, and a very gentle greenish bias on the side of
// the sky where the moon sits — blurring the line between "background" and
// "area lit by the moon" instead of leaving the glow as a hard-edged patch
// over a uniform backdrop.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uColorDark;
  uniform vec3 uColorMid;
  uniform vec3 uColorLight;
  uniform vec3 uMoonDir;
  uniform vec3 uMoonTint;
  varying vec3 vDir;

  void main() {
    float vertical = clamp(vDir.y * 0.5 + 0.55, 0.0, 1.0);
    vec3 base = mix(uColorDark, mix(uColorMid, uColorLight, vertical), vertical);

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
      uColorDark: { value: new THREE.Color("#030e2e") },
      uColorMid: { value: new THREE.Color("#10223e") },
      uColorLight: { value: new THREE.Color("#3e536f") },
      uMoonDir: { value: new THREE.Vector3(0, 0, -1) },
      uMoonTint: { value: new THREE.Color("#547f68") },
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
