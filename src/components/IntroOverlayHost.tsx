"use client";

import IntroOverlay from "./IntroOverlay";
import { useIntroEpoch } from "./IntroPlayingContext";

// Keying IntroOverlay on the shared epoch forces a full remount (and thus
// a fresh run of its own mount-time shouldPlayOnMount() check) whenever
// IntroTriggerLink bumps it — the one case a route-change-based remount
// can't cover, since clicking "Top" while already on "/" doesn't change
// the pathname.
export default function IntroOverlayHost() {
  const epoch = useIntroEpoch();
  return <IntroOverlay key={epoch} />;
}
