"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Adapted from the procedural-grass skill (see procedural-grass-threejs/
// SKILL.md and blade-shaders.md): bezier-curved instanced blade geometry,
// multi-layer wind (global sway + gust + turbulence), half-Lambert lighting
// with a backlit subsurface-scattering glow. Recolored from green to a
// blue gradient, wind speeds slowed for a dreamy rather than gusty feel,
// and density kept sparse (no terrain/heightmap — placement is a simple
// scatter across a ground band near the bottom of the frame).

function createBladeGeometry(segments = 4, width = 0.05, height = 1.0, curvature = 0.26) {
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

function scatterInstances(count: number, widthRange: number, nearZ: number, farZ: number, groundY: number) {
  const posRot = new Float32Array(count * 4);
  const scaleVar = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * widthRange;
    const z = nearZ + Math.random() * (farZ - nearZ);
    const y = groundY;
    const rotation = Math.random() * Math.PI * 2;
    const scaleX = 0.7 + Math.random() * 0.6;
    // A minority of "hero" fronds sweep much taller, giving the field a
    // dramatic reaching silhouette rather than a uniform short lawn line.
    const isHero = Math.random() < 0.14;
    const scaleY = isHero ? 3.6 + Math.random() * 2.6 : 0.8 + Math.random() * 1.1;
    const tilt = (Math.random() - 0.5) * 0.3;
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
    vec3 color = mix(baseColor, tipColor, heightT);

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

    gl_FragColor = vec4(lit, vFade);
  }
`;

export default function GrassField({ count }: { count: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const geo = createBladeGeometry(5, 0.05, 1.0, 0.48);
    const { posRot, scaleVar } = scatterInstances(count, 36, -1.5, -11, -6.4);
    geo.setAttribute("aPositionRotation", new THREE.InstancedBufferAttribute(posRot, 4));
    geo.setAttribute("aScaleVariation", new THREE.InstancedBufferAttribute(scaleVar, 4));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      baseColor: { value: new THREE.Color("#333f92") },
      tipColor: { value: new THREE.Color("#7fb2ee") },
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
      fadeStart: { value: 12 },
      fadeEnd: { value: 20 },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.windTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.cameraPos.value.copy(camera.position);
  });

  return (
    <instancedMesh args={[geometry, undefined, count]} frustumCulled={false}>
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
