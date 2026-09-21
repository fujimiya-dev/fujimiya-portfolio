"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three-stdlib";

// A perspective river, not a constant-width ribbon: wide and close at the
// bottom of the frame, narrowing — both from natural perspective AND from
// its own real world-space width actually shrinking — as it winds away
// toward the horizon. Built by hand as a triangle strip that follows a
// CatmullRom centerline, offsetting left/right at each sampled point by
// that point's own half-width.
//
// All of this is designed in a "local" 2D frame (x, depth) that mirrors the
// convention the old ribbon used: the mesh is rotated -90° around X (the
// same convention three.js's own Water examples rely on — Water's mirror-
// reflection math always treats local +Z, pre-rotation, as "up"), so local
// Y here becomes world -Z after rotation. With the mesh's own position.z
// left at 0, local Y *is* depth-from-camera directly (larger local Y = a
// point farther away), which is what makes the control points below read
// intuitively as "how far right, how far away" instead of needing a mental
// sign flip.
const RIVER_Y = -6.4; // matches GrassField's own ground height exactly, so
// the river reads as the same ground plane receding into the distance
// rather than a disconnected floating band.

// Depth (local Y / world -Z) of each control point, and how far right
// (positive) or left (negative) it sits — two direction changes, reading as
// a single easy S as it recedes, per the request for "1〜2回" of wiggle.
const CONTROL_DEPTHS = [2, 15, 29, 47];
const CONTROL_OFFSETS = [0, -0.38, 0.32, -0.14]; // as a fraction of the
// frustum's near half-width, scaled to actual world units once that's known
// — keeps the wiggle's scale responsive to aspect ratio instead of a fixed
// guess that would look oversized on a narrow mobile frustum.
const WIDTH_NEAR_FRACTION = 0.85; // of the full frustum width at the near
// control point's depth — "画面下端いっぱいに近い" without literally
// touching the edges.
const WIDTH_FAR = 0.16; // near-zero convergence at the horizon end, not
// exactly 0 (a truly zero-width tip is a degenerate triangle).
const WIDTH_EASE = 0.7; // < 1 so the taper is fast near the front and only
// gently finishes closing in toward the far end, matching how perspective
// foreshortening itself behaves rather than shrinking at a constant rate.
const PATH_SAMPLES = 72;

function smoothstepEase(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function buildRiverGeometry(nearHalfWidth: number) {
  const controlPoints = CONTROL_DEPTHS.map(
    (depth, i) => new THREE.Vector3(CONTROL_OFFSETS[i] * nearHalfWidth * 2, depth, 0)
  );
  const curve = new THREE.CatmullRomCurve3(controlPoints, false, "centripetal");
  const centerline = curve.getSpacedPoints(PATH_SAMPLES);

  const widthNear = nearHalfWidth * 2 * WIDTH_NEAR_FRACTION;
  const positions: number[] = [];
  const indices: number[] = [];
  const localUp = new THREE.Vector3(0, 0, 1); // the plane's own pre-rotation
  // normal — crossed with the tangent to get the in-plane perpendicular
  // (left/right) direction at each sample, since every control point (and
  // so the whole curve) lies flat at local z=0.

  // The curve's own tangent right at the first control point is pulled
  // toward the second point's lateral offset, which reads as a diagonal-cut
  // edge instead of one flush with the screen's bottom edge — especially
  // visible on a wide desktop frustum. Blending the first few cross-
  // sections' perpendicular toward pure "straight away from camera" (local
  // +Y) fixes that without an abrupt kink in the riverbank line.
  const STRAIGHTEN_SAMPLES = 8;

  for (let i = 0; i <= PATH_SAMPLES; i++) {
    const t = i / PATH_SAMPLES;
    const p = centerline[i];
    const pPrev = centerline[Math.max(0, i - 1)];
    const pNext = centerline[Math.min(PATH_SAMPLES, i + 1)];
    const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
    if (i < STRAIGHTEN_SAMPLES) {
      const blend = 1 - smoothstepEase(i / STRAIGHTEN_SAMPLES);
      tangent.lerp(new THREE.Vector3(0, 1, 0), blend).normalize();
    }
    const perp = new THREE.Vector3().crossVectors(localUp, tangent).normalize();

    const halfWidth = THREE.MathUtils.lerp(widthNear, WIDTH_FAR, Math.pow(t, WIDTH_EASE)) / 2;
    const left = p.clone().addScaledVector(perp, halfWidth);
    const right = p.clone().addScaledVector(perp, -halfWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }

  for (let i = 0; i < PATH_SAMPLES; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

// Night-water values from the reference NIGHT_OCEAN preset, applied as
// given except where checked against this river's own scale (see comments).
const REFLECTION_STRENGTH = 0.6;
const RF0 = 0.045;
const AMBIENT_BOOST = 0.005;
const DIFFUSE = 0.15;
// Minimum fraction of the non-reflective (water-color/scatter) term kept
// even at the most grazing viewing angles, where the reflectance formula
// below would otherwise approach 1.0 and wash out the water's own color
// entirely — not in the library's own formula at all, added as a clamp on
// reflectance's own max value.
const SCATTER_FLOOR = 0.2;

// Checked with reflection actually turned on (distortion only affects the
// reflective branch, so it was invisible during the wave-only round):
// distortionScale 2.0 smeared the mirror sample into a near-unrecognizable
// blur at this narrow width — confirmed by briefly dropping it to ~0.1,
// which made reflected stars and the "SCROLL" UI hint sharply legible.
// 1.2 keeps a soft, believable ripple-distortion without erasing the
// reflection, per the requested 1.0–1.5 starting range.
const DISTORTION_SCALE = 1.2;
const TIME_SPEED = 0.22;
const WAVE_SIZE = 5;
const ANISOTROPY = 8;
// The reference's flatten=300 is a distance-from-camera threshold tuned for
// an ocean whose horizon sits thousands of units out — literally unusable
// here since this scene's camera.far is only 100 and the river's farthest
// point is a mere ~59 units from the camera, so flattening would just never
// trigger. Rather than one blind scale-down (300 × riverExtent/20000 ≈ 0.7,
// which would flatten almost the instant the water enters the frustum),
// this is picked from the river's own actual near/far camera distances
// (~14 at the near edge, ~59 at the far tip): flattening starts around the
// river's own midpoint and finishes just short of its converging tip, so
// it's the thin, fast-shrinking far end — the part most prone to sub-pixel
// normal-map aliasing/flicker — that settles flat, not the whole river.
const FLATTEN_START = 30;
const FLATTEN_RANGE = 25;

// three-stdlib's Water hardcodes its reflectance term (rf0 = 0.3) and its
// non-reflective "ambient" floor (vec3(0.1)) directly in the fragment shader
// source rather than exposing them as uniforms, and has no distance-based
// flattening at all. Patched in place (same material object Water's own
// onBeforeRender/mirror-camera closures already wired up, so the reflection
// render-target plumbing is untouched) rather than reimplementing the
// mirror-reflection technique from scratch.
function patchWaterMaterial(material: THREE.ShaderMaterial) {
  material.uniforms.rf0 = { value: RF0 };
  material.uniforms.ambientBoost = { value: AMBIENT_BOOST };
  material.uniforms.reflectionStrength = { value: REFLECTION_STRENGTH };
  material.uniforms.flattenStart = { value: FLATTEN_START };
  material.uniforms.flattenRange = { value: FLATTEN_RANGE };
  material.uniforms.scatterFloor = { value: SCATTER_FLOOR };
  // Water's own constructor never reads options.size, leaving the noise
  // lookup at worldPosition.xz/103 — a fixed period in world units,
  // independent of scene scale. waveSize divides into that period (period
  // = 103/waveSize), so this is the one knob that's directly comparable
  // between the reference's ocean and our river regardless of either
  // geometry's overall size.
  material.uniforms.size.value = WAVE_SIZE;
  material.fragmentShader = material.fragmentShader
    .replace(
      "uniform vec3 waterColor;",
      "uniform vec3 waterColor;\n\t\t\t\tuniform float rf0;\n\t\t\t\tuniform float ambientBoost;\n\t\t\t\tuniform float reflectionStrength;\n\t\t\t\tuniform float flattenStart;\n\t\t\t\tuniform float flattenRange;\n\t\t\t\tuniform float scatterFloor;"
    )
    .replace("float rf0 = 0.3;", "")
    .replace(
      "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );",
      "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );\n\t\t\t\t\t// Distant wave flattening — sub-pixel-scale normal variation at long\n\t\t\t\t\t// range aliases into shimmer/flicker rather than reading as texture,\n\t\t\t\t\t// so it's eased toward flat (straight up, no perturbation) well before\n\t\t\t\t\t// that point instead of staying at full strength to the horizon.\n\t\t\t\t\tfloat waveDist = length( eye - worldPosition.xyz );\n\t\t\t\t\tfloat flattenT = smoothstep( flattenStart, flattenStart + flattenRange, waveDist );\n\t\t\t\t\tsurfaceNormal = normalize( mix( surfaceNormal, vec3( 0.0, 0.0, 1.0 ), flattenT ) );"
    )
    .replace(
      "float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );",
      "float reflectance = ( rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 ) ) * reflectionStrength;\n\t\t\t\t\treflectance = min( reflectance, 1.0 - scatterFloor );"
    )
    .replace("vec3( 0.1 )", "vec3( ambientBoost )")
    .replace(
      "sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );",
      `sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, ${DIFFUSE.toFixed(2)}, diffuseLight, specularLight );`
    );
  material.needsUpdate = true;
}

export default function River({ reflectionSize }: { reflectionSize: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const geometry = useMemo(() => {
    // Sized to the actual visible frustum half-width at the NEAR control
    // point's depth (same approach as GroundFog/Starfield used for their own
    // sizing) rather than a guessed constant, so both the near edge's width
    // and the S-curve's lateral swing stay proportional to what's actually
    // on screen at any aspect ratio, instead of looking oversized on a
    // narrow mobile frustum or too timid on a wide desktop one.
    // Local Y here is depth-from-camera directly (see the comment above
    // CONTROL_DEPTHS), so the near control point's actual distance from the
    // camera is simply camera.position.z + CONTROL_DEPTHS[0].
    const nearDistance = camera.position.z + CONTROL_DEPTHS[0];
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const halfHeight = nearDistance * Math.tan(vFov / 2);
    const nearHalfWidth = halfHeight * camera.aspect;
    return buildRiverGeometry(nearHalfWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  const normalMap = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/textures/water-normals.png");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.NoColorSpace;
    // Anisotropic filtering — this plane is viewed at a shallow, near-
    // grazing angle (a ground-level surface receding into the distance, not
    // a top-down lake), where ordinary mipmapping alone softens the ripple
    // detail unevenly across the surface.
    tex.anisotropy = Math.min(ANISOTROPY, gl.capabilities.getMaxAnisotropy());
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const water = useMemo(() => {
    const w = new Water(geometry, {
      textureWidth: reflectionSize,
      textureHeight: reflectionSize,
      waterNormals: normalMap,
      sunDirection: new THREE.Vector3(0.3, 0.55, 0.2).normalize(),
      // sunColor stands in for moonlight here, pulled toward the same
      // mint-white as the moon itself so reflected highlights read as
      // moonlight rather than a generic white sun.
      sunColor: new THREE.Color("#cdeedd"),
      waterColor: new THREE.Color("#030b17"),
      distortionScale: DISTORTION_SCALE,
      alpha: 1,
      fog: false,
      // The hand-built strip's winding isn't guaranteed to face the camera
      // after the -90° X rotation — double-sided sidesteps needing to work
      // out the correct winding order by hand.
      side: THREE.DoubleSide,
    });
    patchWaterMaterial(w.material as THREE.ShaderMaterial);
    return w;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, normalMap, reflectionSize]);

  useEffect(() => {
    return () => {
      water.geometry.dispose();
      (water.material as THREE.Material).dispose();
    };
  }, [water]);

  useFrame((_, delta) => {
    const mat = water.material as THREE.ShaderMaterial;
    mat.uniforms.time.value += delta * TIME_SPEED;
  });

  return (
    <primitive
      object={water}
      position={[0, RIVER_Y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}
