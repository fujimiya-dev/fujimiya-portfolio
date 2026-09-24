"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
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

export function IntroPlayingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // IntroOverlay only exists on "/", so the shared flag defaults to
  // whether we're currently there — pages without an IntroOverlay never
  // get stuck with introPlaying permanently true (which would otherwise
  // freeze NightSkyScene's frameloop forever on every other page).
  const [introPlaying, setIntroPlaying] = useState(() => pathname === "/");
  const [heroReady, setHeroReady] = useState(() => pathname !== "/");

  useEffect(() => {
    setIntroPlaying(pathname === "/");
    setHeroReady(pathname !== "/");
  }, [pathname]);

  return (
    <SetIntroPlayingContext.Provider value={setIntroPlaying}>
      <IntroPlayingContext.Provider value={introPlaying}>
        <SetHeroReadyContext.Provider value={setHeroReady}>
          <HeroReadyContext.Provider value={heroReady}>{children}</HeroReadyContext.Provider>
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
