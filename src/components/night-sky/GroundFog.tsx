"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// A midground depth cue: previously the scene only had a sharp foreground
// (grass) and a distant background (stars/Milky Way/moon), with nothing in
// between to read as "space" — a single low, wide plane of drifting haze,
// positioned behind the grass but well in front of the star field, gives a
// third depth layer. It uses the same atmospheric-extinction idea already
// applied to stars and the sky (things fade/desaturate with distance): the
// fog is thickest near the ground and fades both upward and toward its own
// edges, so it reads as haze rather than a solid wall. Normal (not
// additive) blending on purpose — fog's job is to obscure/wash out what's
// behind it, not add extra light, unlike the scene's glowing elements.
const FOG_DEPTH_Z = -18;
// Raised from -5 (the grass blades' own base height) to sit closer to the
// grass tips instead — at -5 the band's screen-space footprint fell almost
// entirely behind the dense, opaque near-camera grass silhouettes and was
// never actually visible. Nearer the tip line, it shows through the gaps
// between blades and in the open band between grass and stars instead.
const GROUND_Y = -3.4;
const FRUSTUM_MARGIN = 1.25;

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    // True world position (not local) — the mesh itself is translated to
    // GROUND_Y/FOG_DEPTH_Z, so using raw local \`position\` here would
    // compare uGroundY against the wrong space and shift the fog band off
    // the plane's actual center.
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGroundY;
  uniform float uThickness;
  uniform float uOpacity;
  uniform vec3 uFogColor;
  uniform int uOctaves;
  uniform float uHalfWidth;
  varying vec3 vWorldPos;

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
    float sum = 0.0, amp = 0.5, maxA = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      sum += noise(p) * amp; maxA += amp;
      amp *= 0.5; p *= 2.05;
    }
    return sum / maxA;
  }

  void main() {
    // Denser right at ground height, fading out above and below — a soft
    // vertical band rather than a hard-edged strip.
    float distFromGround = vWorldPos.y - uGroundY;
    float vertical = exp(-(distFromGround * distFromGround) / (uThickness * uThickness));

    // Slow horizontal drift; low frequency so it reads as broad wisps, not
    // fine grain.
    vec2 p = vec2(vWorldPos.x * 0.045 + uTime * 0.012, vWorldPos.z * 0.06 - uTime * 0.006);
    float density = fbm(p, uOctaves);
    // Pulled toward mid-range values so it clumps into patches rather than
    // filling evenly.
    density = smoothstep(0.32, 0.78, density);

    // Fades toward the plane's own horizontal edges too, so its bounds
    // never show as a hard cutoff if the parallax rig's subtle rotation
    // shifts the view. Relative to the plane's actual computed half-width
    // (not a fixed guess), so it still fades correctly at every aspect
    // ratio.
    float edgeFade = 1.0 - smoothstep(0.72, 1.0, abs(vWorldPos.x) / uHalfWidth);

    float alpha = vertical * density * edgeFade * uOpacity;
    gl_FragColor = vec4(uFogColor, alpha);
  }
`;

export default function GroundFog({ octaves }: { octaves: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const { geometry, halfWidth } = useMemo(() => {
    const depth = camera.position.z - FOG_DEPTH_Z;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const halfHeight = depth * Math.tan(vFov / 2) * FRUSTUM_MARGIN;
    const halfWidth = halfHeight * camera.aspect;
    return { geometry: new THREE.PlaneGeometry(halfWidth * 2, halfHeight * 2, 1, 1), halfWidth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGroundY: { value: GROUND_Y },
      uThickness: { value: 7 },
      uOpacity: { value: 0.5 },
      uFogColor: { value: new THREE.Color("#48597a") },
      uOctaves: { value: octaves },
      uHalfWidth: { value: halfWidth },
    }),
    [octaves, halfWidth]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh geometry={geometry} position={[0, GROUND_Y, FOG_DEPTH_Z]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
