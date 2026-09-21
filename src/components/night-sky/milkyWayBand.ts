// The Milky Way band's orientation, shared between MilkyWay.tsx (which
// renders it) and Starfield.tsx (which biases star placement toward it via
// rejection sampling). Keeping one JS-side source of truth means the two
// can't silently drift apart the way two independently hand-tuned copies
// of the same tilt/roll/curve numbers eventually would.
export const MILKY_WAY_BAND_TILT = -0.35;
export const MILKY_WAY_BAND_ROLL = 0.6;
export const MILKY_WAY_BAND_WIDTH = 0.095;
export const MILKY_WAY_BAND_CURVE = 0.13;

// Mirrors the shader's galLat/band computation in MilkyWay.tsx exactly —
// 0 far from the band's centerline, rising to 1 right on it.
export function milkyWayBandMask(x: number, y: number, z: number): number {
  const len = Math.hypot(x, y, z) || 1;
  const dx = x / len;
  const dy = y / len;
  const dz = z / len;

  const cr = Math.cos(MILKY_WAY_BAND_ROLL);
  const sr = Math.sin(MILKY_WAY_BAND_ROLL);
  // Only the rotated y component feeds galLat, but the roll still mixes x
  // and y together first — dropping the x half of that rotation would
  // silently stop matching the shader's transform.
  const rx = dx * cr - dy * sr;
  const ry = dx * sr + dy * cr;

  const galLat = ry * Math.cos(MILKY_WAY_BAND_TILT) - dz * Math.sin(MILKY_WAY_BAND_TILT);
  const galLon = Math.atan2(rx, dz * Math.cos(MILKY_WAY_BAND_TILT) + ry * Math.sin(MILKY_WAY_BAND_TILT));
  // Gentle bow along the band's length, matching the shader's curve term —
  // without it the star bias would concentrate along a perfectly straight
  // line while the rendered band gently arcs away from it. The multiplier
  // on galLon must be a whole number — atan2's output wraps from +pi to
  // -pi, and sin(N*theta) is only continuous across that wrap when N is an
  // integer (a fractional N, as this briefly was, jumps discontinuously
  // right at the seam).
  const curvedLat = galLat + MILKY_WAY_BAND_CURVE * Math.sin(galLon * 2.0);

  return Math.exp(-(curvedLat * curvedLat) / (MILKY_WAY_BAND_WIDTH * MILKY_WAY_BAND_WIDTH));
}
