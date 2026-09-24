"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { triggerIntroReplay, useBumpIntroEpoch } from "./IntroPlayingContext";

// Used only by the "Fujimiya.dev" logo and the "Top" nav link — the two
// things that should replay the opening animation. Everything else (About
// me, Works, ...) is a plain next/link.
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
