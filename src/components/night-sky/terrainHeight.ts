// Shared ground-height function — both Terrain.tsx (the mesh itself) and
// GrassField.tsx (per-blade placement) call this same function, so the
// grass's root Y and the terrain surface it's supposed to stand on can
// never drift out of sync the way two independently-tuned height values
// could.
//
// Non-trig hash (fract/dot-mix), consistent with the pattern used
// throughout this scene's shaders (see Starfield.tsx, MilkyWay.tsx,
// GroundFog.tsx) — sin()-based hashes lose precision and show patterned
// artifacts once coordinates get large; this stays well-behaved much
// further out.
function hash2(x: number, y: number): number {
  const frac = (v: number) => v - Math.floor(v);
  let p3x = frac(x * 0.1031);
  let p3y = frac(y * 0.103);
  let p3z = frac(x * 0.0973);
  const d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  p3x += d;
  p3y += d;
  p3z += d;
  return frac((p3x + p3y) * p3z);
}

function smootherstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise2D(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const sx = smootherstep(xf);
  const sy = smootherstep(yf);
  const n00 = hash2(x0, y0);
  const n10 = hash2(x0 + 1, y0);
  const n01 = hash2(x0, y0 + 1);
  const n11 = hash2(x0 + 1, y0 + 1);
  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;
  return ix0 + (ix1 - ix0) * sy; // 0..1
}

function fbm2D(x: number, y: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let maxAmp = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, y * freq) * amp;
    maxAmp += amp;
    amp *= 0.5;
    freq *= 2.03; // slightly off 2.0 so octaves don't share a lattice alignment
  }
  return sum / maxAmp; // 0..1
}

export const TERRAIN_GROUND_Y = -6.4; // matches the flat ground height the
// rest of the scene (old GrassField, the former River) was already built
// around, so this reads as the same ground continuing, not a new one.
export const TERRAIN_NEAR_Z = -1.7; // reaches the screen's bottom edge —
// matches the depth worked out earlier (GroundFog's frustum math) for
// where the y=GROUND_Y plane actually meets the bottom of frame.
export const TERRAIN_FAR_Z = -40;

const HEIGHT_FREQ = 0.05;
const AMPLITUDE_NEAR = 1.35; // gentle hills, not dramatic peaks — a
// distinctly rolling ground without ever reading as "mountains"
const AMPLITUDE_FAR = 0.1; // nearly flat far away — undulation itself
// recedes into the haze, not just visually fading

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

// How far into the near→far span a given world Z is, 0 at the near edge,
// 1 at the far edge — the single shared "depth" notion for both the
// amplitude falloff and (in Terrain.tsx) the haze blend.
export function terrainDepthT(z: number): number {
  return clamp01((TERRAIN_NEAR_Z - z) / (TERRAIN_NEAR_Z - TERRAIN_FAR_Z));
}

export function terrainHeightAt(x: number, z: number): number {
  const depthT = terrainDepthT(z);
  const amplitude = AMPLITUDE_NEAR + (AMPLITUDE_FAR - AMPLITUDE_NEAR) * smootherstep(depthT);
  const n = fbm2D(x * HEIGHT_FREQ, z * HEIGHT_FREQ, 3) * 2 - 1; // -1..1
  return TERRAIN_GROUND_Y + n * amplitude;
}
