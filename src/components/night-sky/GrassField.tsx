"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { terrainHeightAt } from "./terrainHeight";

// Adapted from the procedural-grass skill (see procedural-grass-threejs/
// SKILL.md and blade-shaders.md): bezier-curved instanced blade geometry,
// multi-layer wind (global sway + gust + turbulence), half-Lambert lighting
// with a backlit subsurface-scattering glow.
//
// Reworked into three depth layers (near/mid/far) instead of one uniform
// scatter: real depth in a grass field comes from more than perspective
// alone — the front blades are the ones whose individual shape and sway
// actually read, while distant grass thins out, dims, and desaturates
// toward the sky the same way the star field's own atmospheric extinction
// does. Every layer still derives its colors from the same two measured
// base/tip colors (see BASE_COLOR/TIP_COLOR below) rather than each having
// its own palette, so the field reads as one continuous stand of grass
// fading into the distance rather than three unrelated patches.
//
// Each blade's root Y comes from terrainHeightAt(x, z) — the same function
// Terrain.tsx uses to build the ground mesh — so the grass always stands on
// the actual hill surface instead of a flat reference height.

const BASE_COLOR = "#151AB6"; // shaded/root — measured dark navy
const TIP_COLOR = "#1E40FF"; // lit/tip — measured vivid blue
const PETAL_COLOR = "#7FB7FF"; // paler alternate for a minority of blades
// (petal-like highlights), per the reference photo

function createBladeGeometry(segments: number, width: number, height: number, curvature: number) {
  const vertCount = (segments + 1) * 2 + 1;
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = 2 * (1 - t) * t * curvature;
    const y = t * height;
    const w = width * (1 - t * 0.8);

    const vi = i * 2;
    positions[vi * 3] = x - w * 0.5;
    positions[vi * 3 + 1] = y;
    positions[vi * 3 + 2] = 0;
    uvs[vi * 2] = 0;
    uvs[vi * 2 + 1] = t;

    positions[(vi + 1) * 3] = x + w * 0.5;
    positions[(vi + 1) * 3 + 1] = y;
    positions[(vi + 1) * 3 + 2] = 0;
    uvs[(vi + 1) * 2] = 1;
    uvs[(vi + 1) * 2 + 1] = t;
  }

  const tipIdx = (segments + 1) * 2;
  positions[tipIdx * 3] = curvature * 0.5;
  positions[tipIdx * 3 + 1] = height;
  positions[tipIdx * 3 + 2] = 0;
  uvs[tipIdx * 2] = 0.5;
  uvs[tipIdx * 2 + 1] = 1.0;

  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }
  const lastL = segments * 2, lastR = segments * 2 + 1;
  indices.push(lastL, lastR, tipIdx);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

type LayerConfig = {
  count: number;
  nearZ: number;
  farZ: number;
  widthRange: number;
  bladeWidth: number;
  bladeSegments: number;
  scaleXRange: [number, number];
  scaleYRange: [number, number];
  heroChance: number;
  heroScaleYRange: [number, number];
  tiltRange: number;
  brightnessMul: number; // overall dimming for depth — mid/far layers only
  hazeAmount: number; // how much this layer blends toward the sky/haze color
  petalThreshold: number; // colorVar above this gets the paler petal tip
  fadeStart: number;
  fadeEnd: number;
  // Stratified (jittered-grid) placement instead of pure uniform random —
  // pure randomness at a finite count always has some chance of leaving a
  // visibly bare patch, which is exactly the "gaps the stars show through"
  // problem this density pass is meant to fix. Splitting the area into
  // cells and placing one blade per cell (each still jittered within its
  // cell, so it doesn't look like a grid) guarantees no cell goes empty
  // while keeping the natural denser/sparser look the request asked to
  // preserve. Used for the near/mid layers, where gaps are the concern;
  // the far layer keeps plain random scatter, where sparseness is fine.
  stratified?: boolean;
  // X軸バイアス（左近・右遠の非対称構図）— 左端(x=-widthRange/2)ほど手前・
  // 大きく、右端(x=+widthRange/2)ほど奥・小さく（ほぼ消失まで）なるカーブ。
  // 全フィールドをoptionalにしているのは、xBiasEnabledを付けないレイヤー
  // （mid/far/フィラー等）を一切変更せずに済ませるため — 実際に使うのは
  // xBiasEnabled:true のレイヤーだけで、そこでは必ず併せて指定する想定。
  xBiasEnabled?: boolean;
  // e(t) = 1 - (1-t)^power の指数。大きいほど「左側で長くアップを維持して
  // から急降下する」形になる。
  xBiasCurvePower?: number;
  xBiasPush?: number; // 右端で追加的にZ方向へ押し出す量（ワールド単位）
  xBiasScaleRange?: [number, number]; // [左端でのスケール倍率, 右端でのスケール倍率]
  // 列(x位置)ごとに、その列が取りうる奥行き(z)のばらつき幅を狭める度合い。
  // 0〜1、1に近いほど右側でzをほぼ一点（手前側の境界）に揃える。
  xBiasDepthNarrowing?: number;
  // z を奥へ押し出すと、カメラ(Y=cameraY・正面視)から見て「同じ高さでも
  // 奥にあるほど画面上では中央寄り=上に見える」という透視図法の効果で、
  // 押し出した分だけ根元が浮いて見える。この上昇を打ち消すため、押し出し
  // 前後の深度(cameraZ - z)比で根元のYを補正する — その計算に必要。
  cameraY?: number;
  cameraZ?: number;
};

function scatterInstances(cfg: LayerConfig) {
  const { count, widthRange } = cfg;
  const zStart = Math.min(cfg.nearZ, cfg.farZ);
  const zEnd = Math.max(cfg.nearZ, cfg.farZ);
  const depthRange = zEnd - zStart;
  const posRot = new Float32Array(count * 4);
  const scaleVar = new Float32Array(count * 4);

  // Grid cell dimensions chosen so cells are roughly square in world units,
  // given the area's actual width:depth aspect ratio.
  const gridZ = cfg.stratified ? Math.max(1, Math.round(Math.sqrt((count * depthRange) / widthRange))) : 1;
  const gridX = cfg.stratified ? Math.max(1, Math.ceil(count / gridZ)) : 1;
  const cellW = widthRange / gridX;

  for (let i = 0; i < count; i++) {
    // x first, and z only as a *fractional position* (0..1) within the
    // grid/random span for now — the actual z value is resolved after
    // xBias narrows that span for this particular column, below.
    let x: number;
    let zFrac: number;
    if (cfg.stratified) {
      const gx = i % gridX;
      const gz = Math.floor(i / gridX) % gridZ;
      x = -widthRange / 2 + (gx + Math.random()) * cellW;
      zFrac = (gz + Math.random()) / gridZ;
    } else {
      x = (Math.random() - 0.5) * widthRange;
      zFrac = Math.random();
    }

    // e: 0(左端)〜1(右端)。1-(1-t)^power 型で、左は緩やか、右へ行くほど
    // 加速して1へ収束する。
    let e = 0;
    if (cfg.xBiasEnabled) {
      const tForRange = THREE.MathUtils.clamp((x + widthRange / 2) / widthRange, 0, 1);
      e = 1 - Math.pow(1 - tForRange, cfg.xBiasCurvePower ?? 1);
    }

    // 奥行きの散らばりを、右へ行くほど手前の境界(zEnd)寄りに狭める。
    // 手前側の境界は常に固定し、奥側だけを狭める非対称圧縮。
    let effectiveDepthRange = depthRange;
    if (cfg.xBiasEnabled) {
      effectiveDepthRange = depthRange * (1 - (cfg.xBiasDepthNarrowing ?? 0) * e);
    }
    let z = zEnd - effectiveDepthRange * (1 - zFrac);

    const zBeforeBias = z;
    let xBiasScaleMul = 1;
    let depthRatio = 1;
    if (cfg.xBiasEnabled) {
      const xBiasPush = cfg.xBiasPush ?? 0;
      z -= xBiasPush * e; // 右にいくほどカメラから遠ざける（Zはカメラ方向がマイナス側）
      const [scaleNear, scaleFar] = cfg.xBiasScaleRange ?? [1, 1];
      xBiasScaleMul = THREE.MathUtils.lerp(scaleNear, scaleFar, e);
      if (xBiasPush !== 0) {
        const depthBefore = (cfg.cameraZ ?? 0) - zBeforeBias;
        const depthAfter = (cfg.cameraZ ?? 0) - z;
        depthRatio = depthAfter / depthBefore;
      }
    }

    // Plant the root on the hill surface at the (narrowed-depth, pre-push)
    // (x, z) — the same height function Terrain.tsx built its mesh from —
    // then correct for the perspective rise the Z push alone would
    // introduce, so the root's on-screen vertical anchor stays where it
    // would have been without xBias — scale (xBiasScaleMul) is what's left
    // to communicate "farther away", not an unwanted upward drift.
    const yBeforeBias = terrainHeightAt(x, zBeforeBias);
    const y = (cfg.cameraY ?? 0) + (yBeforeBias - (cfg.cameraY ?? 0)) * depthRatio;
    const rotation = Math.random() * Math.PI * 2;
    const scaleX = THREE.MathUtils.lerp(cfg.scaleXRange[0], cfg.scaleXRange[1], Math.random()) * xBiasScaleMul;
    // A minority of "hero" fronds sweep much taller, giving the field a
    // dramatic reaching silhouette rather than a uniform short lawn line —
    // dialed back as xBias strengthens, since a sparse, shrunk cluster of
    // mostly-short blades with the occasional full-height hero towering
    // over them reads as scattered outliers rather than a coherent distant
    // patch.
    const isHero = Math.random() < cfg.heroChance * (1 - e * 0.9);
    const scaleY = (isHero
      ? THREE.MathUtils.lerp(cfg.heroScaleYRange[0], cfg.heroScaleYRange[1], Math.random())
      : THREE.MathUtils.lerp(cfg.scaleYRange[0], cfg.scaleYRange[1], Math.random())) * xBiasScaleMul;
    const tilt = (Math.random() - 0.5) * cfg.tiltRange;
    const colorVar = Math.random();

    posRot[i * 4] = x;
    posRot[i * 4 + 1] = y;
    posRot[i * 4 + 2] = z;
    posRot[i * 4 + 3] = rotation;
    scaleVar[i * 4] = scaleX;
    scaleVar[i * 4 + 1] = scaleY;
    scaleVar[i * 4 + 2] = tilt;
    scaleVar[i * 4 + 3] = colorVar;
  }

  return { posRot, scaleVar };
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec4 aPositionRotation; // xyz = world pos, w = Y rotation
  attribute vec4 aScaleVariation;   // x = scaleX, y = scaleY, z = tilt, w = colorVar

  uniform float windTime;
  uniform vec2  windDir;
  uniform float windBase;
  uniform float windGust;
  uniform float windGustFreq;
  uniform vec3  cameraPos;
  uniform float fadeStart;
  uniform float fadeEnd;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying float vColorVar;
  varying float vFade;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise2D(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec3 computeWind(vec3 worldPos, float heightFactor) {
    float globalPhase = dot(worldPos.xz, windDir) * 0.5 + windTime * 0.35;
    vec2 globalSway = windDir * sin(globalPhase) * windBase;

    float gustPhase = dot(worldPos.xz, windDir) * windGustFreq + windTime * 0.7;
    float gustEnvelope = noise2D(worldPos.xz * 0.02 + windTime * 0.08);
    gustEnvelope = smoothstep(0.3, 0.7, gustEnvelope);
    vec2 gustSway = windDir * sin(gustPhase) * windGust * gustEnvelope;

    float bladeHash = hash(worldPos.xz * 10.0);
    float turbPhase = windTime * 0.8 + bladeHash * 6.28;
    vec2 turbulence = vec2(sin(turbPhase), cos(turbPhase * 0.7)) * 0.04;

    float h2 = heightFactor * heightFactor;
    vec2 sway = globalSway + gustSway + turbulence;
    return vec3(sway.x, 0.0, sway.y) * h2;
  }

  void main() {
    vUv = uv;
    vColorVar = aScaleVariation.w;

    vec3 pos = position;
    pos.x *= aScaleVariation.x;
    pos.y *= aScaleVariation.y;

    float tilt = aScaleVariation.z;
    float cosT = cos(tilt), sinT = sin(tilt);
    float tiltedY = pos.y * cosT - pos.z * sinT;
    float tiltedZ = pos.y * sinT + pos.z * cosT;
    pos.y = tiltedY;
    pos.z = tiltedZ;

    float rot = aPositionRotation.w;
    float cosR = cos(rot), sinR = sin(rot);
    vec3 rotated;
    rotated.x = pos.x * cosR - pos.z * sinR;
    rotated.y = pos.y;
    rotated.z = pos.x * sinR + pos.z * cosR;

    vec3 worldPos = rotated + aPositionRotation.xyz;

    float heightFactor = uv.y;
    vec3 windOffset = computeWind(worldPos, heightFactor);
    worldPos += windOffset;

    vNormal = normalize(normal);
    vNormal.xz += windOffset.xz * 0.3;
    vNormal = normalize(vNormal);

    float dist = distance(cameraPos, worldPos);
    vFade = 1.0 - smoothstep(fadeStart, fadeEnd, dist);

    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  baseColor;
  uniform vec3  tipColor;
  uniform vec3  petalColor;
  uniform vec3  hazeColor;
  uniform float petalThreshold;
  uniform float brightnessMul;
  uniform float hazeAmount;
  uniform float sssStrength;
  uniform float aoStrength;
  uniform vec3  sunDir;
  uniform vec3  sunColor;
  uniform vec3  ambientColor;
  uniform vec3  cameraPos;

  varying vec2  vUv;
  varying vec3  vNormal;
  varying float vColorVar;
  varying float vFade;

  void main() {
    if (vFade < 0.01) discard;

    float heightT = vUv.y;
    // A minority of blades get the paler petal-like tip instead of the
    // usual vivid blue, for variety within the same two-color basis.
    vec3 tip = mix(tipColor, petalColor, step(petalThreshold, vColorVar));
    vec3 color = mix(baseColor, tip, heightT);

    float varShift = (vColorVar - 0.5) * 0.15;
    color *= 1.0 + varShift;

    float ao = mix(1.0 - aoStrength, 1.0, smoothstep(0.0, 0.3, heightT));
    color *= ao;

    vec3 N = normalize(vNormal);
    vec3 L = normalize(sunDir);

    float NdotL = dot(N, L);
    float diffuse = max(NdotL * 0.5 + 0.5, 0.0);

    float sss = max(dot(-N, L), 0.0);
    sss = pow(sss, 3.0) * sssStrength * heightT;

    vec3 lit = color * (sunColor * diffuse + ambientColor * 0.5) + sunColor * sss;

    // Depth treatment for mid/far layers — dimmed and blended toward the
    // sky/haze color (never toward flat gray) so distant grass desaturates
    // into the background the same way stars fade near the horizon,
    // instead of just shrinking.
    lit *= brightnessMul;
    lit = mix(lit, hazeColor, hazeAmount);

    gl_FragColor = vec4(lit, vFade);
  }
`;

function GrassLayer({ cfg }: { cfg: LayerConfig }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const geo = createBladeGeometry(cfg.bladeSegments, cfg.bladeWidth, 1.0, 0.48);
    const { posRot, scaleVar } = scatterInstances(cfg);
    geo.setAttribute("aPositionRotation", new THREE.InstancedBufferAttribute(posRot, 4));
    geo.setAttribute("aScaleVariation", new THREE.InstancedBufferAttribute(scaleVar, 4));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  const uniforms = useMemo(
    () => ({
      baseColor: { value: new THREE.Color(BASE_COLOR) },
      tipColor: { value: new THREE.Color(TIP_COLOR) },
      petalColor: { value: new THREE.Color(PETAL_COLOR) },
      hazeColor: { value: new THREE.Color("#141b2c") },
      petalThreshold: { value: cfg.petalThreshold },
      brightnessMul: { value: cfg.brightnessMul },
      hazeAmount: { value: cfg.hazeAmount },
      sssStrength: { value: 0.4 },
      aoStrength: { value: 0.55 },
      sunDir: { value: new THREE.Vector3(0.35, 0.4, 1.0).normalize() },
      sunColor: { value: new THREE.Color("#d8e6f7") },
      ambientColor: { value: new THREE.Color("#33448f") },
      cameraPos: { value: new THREE.Vector3() },
      windTime: { value: 0 },
      windDir: { value: new THREE.Vector2(1, 0.3).normalize() },
      windBase: { value: 0.12 },
      windGust: { value: 0.22 },
      windGustFreq: { value: 0.3 },
      fadeStart: { value: cfg.fadeStart },
      fadeEnd: { value: cfg.fadeEnd },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.windTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.cameraPos.value.copy(camera.position);
  });

  return (
    <instancedMesh args={[geometry, undefined, cfg.count]} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
        depthWrite={true}
      />
    </instancedMesh>
  );
}

export default function GrassField({ count, lowTier = false }: { count: number; lowTier?: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const layers = useMemo<LayerConfig[]>(() => {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const widthAt = (z: number) => {
      const depth = camera.position.z - z;
      return 2 * depth * Math.tan(vFov / 2) * camera.aspect * 1.2;
    };

    // Near/mid density raised over the original 0.45/0.35 split to close up
    // the gaps stars were showing through at the bottom of the frame — near
    // the top of the requested 30-50% range. (A first fps check right after
    // a dev-server restart briefly read ~50fps on the high tier and looked
    // like a real regression; re-measuring against the same ratio, and
    // against a smaller one, both came back at 110-130fps, showing that
    // reading was restart/warmup noise, not a density-driven cost.) Low
    // tier still gets a smaller raise, as a plain margin of safety on
    // weaker devices rather than a measured need.
    const nearRatio = lowTier ? 0.55 : 0.62;
    const midRatio = lowTier ? 0.44 : 0.52;

    // Only the near layer reads these this round — mid/far are left
    // untouched, so this is scoped narrowly rather than hoisted for reuse.
    const cameraY = camera.position.y;
    const cameraZ = camera.position.z;

    return [
      // Near — large, thick, dense, the layer whose individual blade shape
      // and sway is meant to actually read. Now also carries the left-near/
      // right-far xBias asymmetry; mid/far stay full-width/uniform for now.
      {
        count: Math.round(count * nearRatio),
        nearZ: -1.7,
        farZ: -6,
        widthRange: widthAt(-6),
        bladeWidth: 0.065,
        bladeSegments: 6,
        scaleXRange: [0.8, 1.5],
        scaleYRange: [1.0, 1.9],
        heroChance: 0.16,
        heroScaleYRange: [4.0, 6.8],
        tiltRange: 0.32,
        brightnessMul: 1.0,
        hazeAmount: 0.0,
        petalThreshold: 0.78,
        fadeStart: 16,
        fadeEnd: 24,
        stratified: true,
        xBiasEnabled: true,
        xBiasCurvePower: 2.4,
        xBiasPush: 5.0,
        xBiasScaleRange: [1.3, 0.05],
        xBiasDepthNarrowing: 0.6,
        cameraY,
        cameraZ,
      },
      // Mid — noticeably smaller/sparser and a touch dimmer/less saturated
      // than the near layer, but still clearly grass-shaped up close.
      {
        count: Math.round(count * midRatio),
        nearZ: -6,
        farZ: -14,
        widthRange: widthAt(-14),
        bladeWidth: 0.045,
        bladeSegments: 5,
        scaleXRange: [0.55, 1.0],
        scaleYRange: [0.6, 1.15],
        heroChance: 0.1,
        heroScaleYRange: [2.2, 3.8],
        tiltRange: 0.32,
        brightnessMul: 0.8,
        hazeAmount: 0.2,
        petalThreshold: 0.82,
        fadeStart: 26,
        fadeEnd: 36,
        stratified: true,
        xBiasEnabled: true,
        xBiasCurvePower: 2.0,
        xBiasPush: 2.8,
        xBiasScaleRange: [1.05, 0.05],
        xBiasDepthNarrowing: 0.5,
        cameraY,
        cameraZ,
      },
      // Far — small, sparse, sunk deep into the same navy the sky/terrain
      // haze uses, per the atmospheric-extinction reasoning applied
      // everywhere else in this scene. Left exactly as it was.
      {
        count: Math.round(count * 0.2),
        nearZ: -14,
        farZ: -30,
        widthRange: widthAt(-30),
        bladeWidth: 0.03,
        bladeSegments: 3,
        scaleXRange: [0.35, 0.6],
        scaleYRange: [0.35, 0.6],
        heroChance: 0.06,
        heroScaleYRange: [1.2, 2.0],
        tiltRange: 0.26,
        brightnessMul: 0.6,
        hazeAmount: 0.48,
        petalThreshold: 0.9,
        fadeStart: 38,
        fadeEnd: 50,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, lowTier, camera, size.width, size.height]);

  return (
    <>
      {layers.map((cfg, i) => (
        <GrassLayer key={i} cfg={cfg} />
      ))}
    </>
  );
}
