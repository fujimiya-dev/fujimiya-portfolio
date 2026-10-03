"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { triggerIntroReplay, useBumpIntroEpoch } from "./IntroPlayingContext";

// Used only by the "Fujimiya.dev" logo — the one thing that should replay
// the opening animation. The "Top" nav link deliberately skips it (plain
// next/link) and goes straight to "/", same as About me, Works, ....
export default function IntroTriggerLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const bumpIntroEpoch = useBumpIntroEpoch();

  return (
    <Link
      {...props}
      onClick={(e) => {
        triggerIntroReplay();
        bumpIntroEpoch?.();
        onClick?.(e);
      }}
    />
  );
}
