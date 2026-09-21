// Shared GLSL snippets spliced into multiple shader source strings via
// template-literal interpolation. Not a build-time #include — just a single
// TypeScript source of truth so two otherwise-independent shaders (the
// starfield and the Milky Way band) apply literally the same atmospheric
// extinction function rather than two hand-tuned approximations of it.

// Dims things near the horizon (elevation close to 0) and leaves the zenith/
// nadir (elevation close to ±1) untouched — a stand-in for looking through
// more atmosphere near the horizon. `elevation` is a view/world direction's
// y component, roughly -1..1.
export const EXTINCTION_GLSL = /* glsl */ `
  float atmosphericExtinction(float elevation) {
    float horizonCloseness = 1.0 - abs(clamp(elevation, -1.0, 1.0));
    return 1.0 - horizonCloseness * horizonCloseness * 0.55;
  }
`;
