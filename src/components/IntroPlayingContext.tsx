"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";

const IntroPlayingContext = createContext(true);
const SetIntroPlayingContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

// Whether NightSky is allowed to mount NightSkyScene (and pay its one-time
// Three.js/shader construction cost) yet. On "/" this starts false and
// IntroOverlay flips it once the trace finishes — specifically during the
// HOLD_MS pause before the color sweep starts, since that's the one stretch
// of the intro timeline where nothing else is animating and there's no
// other work to compete with. Other pages have nothing gating Hero, so it
// starts (and stays) true there.
const HeroReadyContext = createContext(true);
const SetHeroReadyContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

// Whether NightSkyScene has actually rendered a real frame yet (shaders
// compiled, first draw call done) — distinct from HeroReady above, which
// only means "allowed to mount". Starts false and is flipped once, by
// NightSkyScene itself, the first time its render loop ticks after mount.
// Consulted only by IntroOverlay's skip() path (see there for why): once
// mounted/ready the scene stays mounted across the rest of the session
// (confirmed by the existing heroReady behavior below), so this reflects
// real readiness rather than going stale between an intro replay and a
// later skip.
const SceneReadyContext = createContext(false);
const SetSceneReadyContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

// Forces IntroOverlay to remount from scratch, replaying the trace even
// when the pathname doesn't change (e.g. clicking "Top" while already on
// "/", scrolled down at #about — a plain pathname-keyed effect wouldn't
// otherwise notice anything happened).
const IntroEpochContext = createContext(0);
const BumpIntroEpochContext = createContext<(() => void) | null>(null);

// Set by IntroTriggerLink's onClick (the "Fujimiya.dev" logo — the only
// thing that should ever replay the intro) right before navigating.
// IntroOverlay consumes it once, on its own mount, to
// decide whether to actually play. A plain module-level flag survives a
// client-side route change (same JS runtime, no reload) but not a full
// page load, which is exactly the scope we want it to have.
let forcePlayIntro = false;

export function triggerIntroReplay() {
  forcePlayIntro = true;
}

// Deliberately side-effect-free (just a read) — React 18 StrictMode calls
// useState lazy initializers twice on a component's first render, and a
// "peek and clear in the same call" version would lose the flag on the
// first of those two calls, leaving the second (the one that actually
// wins) to see it already gone. IntroOverlay clears the flag itself, once,
// from an effect after mount instead — see clearForcePlayIntro.
export function peekForcePlayIntro() {
  return forcePlayIntro;
}

export function clearForcePlayIntro() {
  forcePlayIntro = false;
}

// Whether the true, hard page load that started this JS session landed
// directly on bare "/" — evaluated exactly once, as a module-level
// constant, the moment this file is first evaluated. This module is
// imported unconditionally by the root layout, so that happens on every
// route, at real page-load time, before any client-side navigation can
// occur — window.location is therefore guaranteed to still reflect the
// actual requested URL (path *and* hash) rather than a hash that a
// same-tab SPA transition is in the middle of applying.
//
// This constant (not a fresh read) is deliberately what later checks
// consult: reading window.location.hash again during a subsequent
// client-side navigation (e.g. clicking "About me") is unreliable — Next
// updates the hash slightly *after* the new route's first render, so a
// check made at that moment can race and see the old ("") hash.
function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "/en";
}

const initialHardLoadWillAutoPlay =
  typeof window !== "undefined" && isHomePath(window.location.pathname) && window.location.hash === "";
let autoPlayAvailable = true;

// Side-effect-free peek, for the same StrictMode-double-invoke reason as
// peekForcePlayIntro above.
export function peekInitialAutoPlayIntro() {
  return autoPlayAvailable && initialHardLoadWillAutoPlay;
}

export function clearInitialAutoPlayIntro() {
  autoPlayAvailable = false;
}

// The intro should play when landing directly on "/" (first visit, or the
// "Fujimiya.dev" logo, which points at bare "/" and also sets the
// force-play flag above) but NOT when arriving via a hash link such as
// "About me" ("/#about"), and not via the "Top" nav link either — that
// should land straight on the section/top without replaying the intro.
function willIntroPlay(pathname: string) {
  if (!isHomePath(pathname)) return false;
  return peekForcePlayIntro() || peekInitialAutoPlayIntro();
}

export function IntroPlayingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [introPlaying, setIntroPlaying] = useState(() => willIntroPlay(pathname));
  const [heroReady, setHeroReady] = useState(() => !willIntroPlay(pathname));
  const [sceneReady, setSceneReady] = useState(() => !willIntroPlay(pathname));
  const [introEpoch, setIntroEpoch] = useState(0);

  useEffect(() => {
    // Leaving "/" (or arriving anywhere but "/") — reset to the safe
    // defaults so NightSkyScene's frameloop never stays paused off "/".
    // While pathname === "/", IntroOverlay's own mount effects are the
    // ones that decide and drive these two flags (see willIntroPlay /
    // peekForcePlayIntro in IntroOverlay.tsx) since only it knows whether
    // it actually started playing.
    if (!isHomePath(pathname)) {
      setIntroPlaying(false);
      setHeroReady(true);
      setSceneReady(true);
    }
  }, [pathname]);

  const bumpIntroEpoch = useCallback(() => setIntroEpoch((e) => e + 1), []);

  return (
    <SetIntroPlayingContext.Provider value={setIntroPlaying}>
      <IntroPlayingContext.Provider value={introPlaying}>
        <SetHeroReadyContext.Provider value={setHeroReady}>
          <HeroReadyContext.Provider value={heroReady}>
            <SetSceneReadyContext.Provider value={setSceneReady}>
              <SceneReadyContext.Provider value={sceneReady}>
                <BumpIntroEpochContext.Provider value={bumpIntroEpoch}>
                  <IntroEpochContext.Provider value={introEpoch}>{children}</IntroEpochContext.Provider>
                </BumpIntroEpochContext.Provider>
              </SceneReadyContext.Provider>
            </SetSceneReadyContext.Provider>
          </HeroReadyContext.Provider>
        </SetHeroReadyContext.Provider>
      </IntroPlayingContext.Provider>
    </SetIntroPlayingContext.Provider>
  );
}

export function useIntroPlaying() {
  return useContext(IntroPlayingContext);
}

export function useSetIntroPlaying() {
  return useContext(SetIntroPlayingContext);
}

export function useHeroReady() {
  return useContext(HeroReadyContext);
}

export function useSetHeroReady() {
  return useContext(SetHeroReadyContext);
}

export function useSceneReady() {
  return useContext(SceneReadyContext);
}

export function useSetSceneReady() {
  return useContext(SetSceneReadyContext);
}

export function useIntroEpoch() {
  return useContext(IntroEpochContext);
}

export function useBumpIntroEpoch() {
  return useContext(BumpIntroEpochContext);
}
