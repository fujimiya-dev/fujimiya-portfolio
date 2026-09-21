"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { milkyWayBandMask } from "./milkyWayBand";

// How strongly star placement is pulled toward the Milky Way band: 0 would
// be a uniform sky, larger values concentrate more stars into the band.
// Implemented as rejection sampling — draw a candidate position, accept it
// with probability proportional to (1 + BAND_BIAS * bandMask), else redraw
// — rather than a different overall distribution, so the total star count
// is untouched and only *where* they land shifts.
const BAND_BIAS = 2.2;
const BAND_ACCEPT_CEILING = 1 + BAND_BIAS;
const BAND_SAMPLE_ATTEMPTS = 8;

// The camera never moves or rotates beyond ParallaxRig's small tilt, so
// there is no reason to scatter stars over a full sphere shell (measured:
// only ~62% of a full-shell placement ever actually lands in the visible
// frustum, the rest silently discarded — wasted generation, and it also
// forces a huge total count just to get a comfortable *visible* density,
// which read as "static/snow" rather than a starfield). Sampling directly
// within the frustum's angular cone at each depth means every star drawn
// is one that can actually be seen. MARGIN pads the cone slightly so
// ParallaxRig's subtle rotation never reveals an empty edge.
const DEPTH_NEAR = 21;
const DEPTH_FAR = 55;
const FRUSTUM_MARGIN = 1.18;

function sampleStarPosition(
  tanV: number,
  tanH: number,
  cameraZ: number
): [number, number, number] {
  let candidate: [number, number, number] = [0, 0, 0];
  for (let attempt = 0; attempt < BAND_SAMPLE_ATTEMPTS; attempt++) {
    const depth = DEPTH_NEAR + Math.random() * (DEPTH_FAR - DEPTH_NEAR);
    const halfH = depth * tanV * FRUSTUM_MARGIN;
    const halfW = depth * tanH * FRUSTUM_MARGIN;

    const x = (Math.random() * 2 - 1) * halfW;
    const y = (Math.random() * 2 - 1) * halfH;
    const z = cameraZ - depth;
    candidate = [x, y, z];

    const mask = milkyWayBandMask(x, y, z);
    if (Math.random() * BAND_ACCEPT_CEILING <= 1 + BAND_BIAS * mask) {
      return candidate;
    }
  }
  // Ran out of attempts — place it anyway rather than dropping a star, so
  // the total count stays exactly `count` regardless of bias.
  return candidate;
}

// Mirrors shaderChunks.ts's EXTINCTION_GLSL exactly — needed on the JS side
// too because brightness/size are precomputed once at generation time
// (a star's direction never changes), not recomputed per frame.
function atmosphericExtinctionJS(elevationY: number): number {
  const horizonCloseness = 1 - Math.min(1, Math.abs(elevationY));
  return 1 - horizonCloseness * horizonCloseness * 0.55;
}

function smoothstepJS(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const DIMMEST = 0.09;
const FALLOFF = 26;
const SATURATION = 0.55;
// Halved from the original 1.6 — that produced ~7-14px stars (before even
// accounting for the pixel-ratio bug below), reading as solid discs rather
// than faint points.
const BASE_SIZE = 0.8;
const TWINKLE_SPEED = 3.8;
const TWINKLE = 0.45;
const TWINKLE_SHARE = 0.25;
const TWINKLE_CALM = 0.35;

const COOL = new THREE.Color("#bcd0ff");
const WHITE = new THREE.Color("#fff6ec");
const WARM = new THREE.Color("#ffc79a");
const NEUTRAL = new THREE.Color("#f3f2f6");

function starHueFor(t: number): THREE.Color {
  if (t < 0.62) {
    return COOL.clone().lerp(WHITE, t / 0.62);
  }
  return WHITE.clone().lerp(WARM, Math.pow((t - 0.62) / 0.38, 1.6));
}

// Rebuilt around an explicit, fully-specified pipeline: 4 named base hues
// blended by a skewed random draw, brightness as a steep power-law with a
// non-zero floor, size compressed by sqrt(lum) so it doesn't swing as
// wildly as brightness does, and twinkle as two golden-ratio-related sine
// waves whose amplitude is itself randomized per star (a minority flicker
// hard, the rest stay calm) and boosted near the horizon. Glow is entirely
// a core+halo shape in the fragment shader with custom (Src:One, Dst:One)
// additive blending — never the scene's postprocess Bloom pass.
const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aRateMul;
  attribute float aTwinkleAmt;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;

  void main() {
    float rate = ${TWINKLE_SPEED.toFixed(3)} * aRateMul;
    // Two sine waves related by the golden ratio (both in frequency and
    // phase) so the flicker never settles into a repeating beat.
    float wave = 0.62 * sin(uTime * rate + aPhase) + 0.38 * sin(uTime * rate * 1.618 + aPhase * 2.7);
    float flicker = 1.0 + aTwinkleAmt * wave;

    vColor = aColor * flicker;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mvPosition.z, 1.0);
    // sqrt(flicker) halves the size swing relative to the brightness swing
    // — without it, twinkling reads as "blinking discs" instead of stars
    // glinting.
    float screenSize = aSize * sqrt(max(flicker, 0.0)) * uPixelRatio * (95.0 / dist);
    gl_PointSize = clamp(screenSize, 0.5, 20.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;

  void main() {
    // Normalized to the point sprite's inscribed circle (0 at center, 1 at
    // the circle's edge) with a hard discard beyond it. Without this, the
    // square corners of the point sprite (still non-zero under the old
    // unnormalized falloff, and CustomBlending(Src:One, Dst:One) doesn't
    // attenuate by alpha at all) show up as a visible square — this is
    // what actually caused the rough/sandy look, especially at the ~1px
    // sizes most stars render at, since there just aren't enough fragment
    // samples for a soft gradient to read as round at that size; a clean
    // discard at least guarantees the corners are truly empty.
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float core = exp(-d * d * 8.0);
    float halo = exp(-d * d * 1.6) * 0.42;
    float glow = core + halo;

    vec3 finalColor = vColor * glow;
    // Kept under the scene's shared Bloom luminance threshold (0.7) even
    // though gain can push vColor above 1.0 for the brightest stars — the
    // blown-out core with a colored halo around it must come entirely from
    // this shader's own core/halo shape, never from Bloom rehashing a
    // tiny bright point into a blocky mip-blur artifact.
    finalColor = min(finalColor, vec3(0.62));

    gl_FragColor = vec4(finalColor, clamp(glow, 0.0, 1.0));
  }
`;

export default function Starfield({ count }: { count: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const { positions, colors, sizes, phases, rateMuls, twinkleAmts } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const rateMuls = new Float32Array(count);
    const twinkleAmts = new Float32Array(count);

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const tanV = Math.tan(vFov / 2);
    const tanH = tanV * camera.aspect;
    const cameraZ = camera.position.z;

    for (let i = 0; i < count; i++) {
      const [x, y, z] = sampleStarPosition(tanV, tanH, cameraZ);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const dirLen = Math.hypot(x, y, z) || 1;
      const dirY = y / dirLen;

      let lum = DIMMEST + (1 - DIMMEST) * Math.pow(Math.random(), FALLOFF);
      lum *= atmosphericExtinctionJS(dirY);
      lum = Math.min(1, Math.max(0, lum));

      const hue = starHueFor(Math.random());
      const neutralMix = 1 - SATURATION * (0.3 + 0.7 * lum);
      const shaded = hue.clone().lerp(NEUTRAL, neutralMix);
      const gain = lum * (1 + 0.18 * lum * lum);
      shaded.multiplyScalar(gain);

      colors[i * 3] = shaded.r;
      colors[i * 3 + 1] = shaded.g;
      colors[i * 3 + 2] = shaded.b;

      sizes[i] = BASE_SIZE * (0.62 + 1.5 * Math.sqrt(lum));

      phases[i] = Math.random() * Math.PI * 2;
      rateMuls[i] = 0.6 + Math.random() * 0.9;

      // Stars near the horizon twinkle more (more atmosphere to shimmer
      // through); a random minority flicker hard while the rest stay calm,
      // so the whole sky doesn't shimmer in unison like static. Brighter
      // (larger-drawn) stars are damped toward 0.6x so their twinkle isn't
      // disproportionately eye-catching just because they cover more
      // pixels — without this, the sky's biggest stars flickered the
      // hardest, which read as noisy.
      const low = 1 - smoothstepJS(0.05, 0.55, dirY);
      const isStrong = Math.random() < TWINKLE_SHARE;
      twinkleAmts[i] =
        TWINKLE * (0.6 + 0.4 * (1 - lum)) * (0.35 + 0.65 * low) * (isStrong ? 1 : TWINKLE_CALM);
    }

    return { positions, colors, sizes, phases, rateMuls, twinkleAmts };
    // Regenerates on resize too — the frustum's shape (and so the volume
    // stars are sampled within) changes with aspect ratio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, camera, size.width, size.height]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // Seeded from the renderer's actual current ratio rather than the raw
      // display's window.devicePixelRatio — kept in sync every frame below,
      // since it changes with the quality tier's dpr ceiling and with
      // PerformanceMonitor's live dprBoost toggling, not just the display.
      uPixelRatio: { value: 1 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // gl.getPixelRatio() is what the renderer is actually using right
      // now (clamped by the Canvas's dpr prop) — the one value that's
      // guaranteed to match what gl_PointSize is measured against,
      // regardless of the display's own raw devicePixelRatio.
      materialRef.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aRateMul" args={[rateMuls, 1]} />
        <bufferAttribute attach="attributes-aTwinkleAmt" args={[twinkleAmts, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
      />
    </points>
  );
}
