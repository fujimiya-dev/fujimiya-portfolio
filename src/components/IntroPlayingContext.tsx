"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

const IntroPlayingContext = createContext(true);
const SetIntroPlayingContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export function IntroPlayingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // IntroOverlay only exists on "/", so the shared flag defaults to
  // whether we're currently there — pages without an IntroOverlay never
  // get stuck with introPlaying permanently true (which would otherwise
  // freeze NightSkyScene's frameloop forever on every other page).
  const [introPlaying, setIntroPlaying] = useState(() => pathname === "/");

  useEffect(() => {
    setIntroPlaying(pathname === "/");
  }, [pathname]);

  return (
    <SetIntroPlayingContext.Provider value={setIntroPlaying}>
      <IntroPlayingContext.Provider value={introPlaying}>{children}</IntroPlayingContext.Provider>
    </SetIntroPlayingContext.Provider>
  );
}

export function useIntroPlaying() {
  return useContext(IntroPlayingContext);
}

export function useSetIntroPlaying() {
  return useContext(SetIntroPlayingContext);
}
