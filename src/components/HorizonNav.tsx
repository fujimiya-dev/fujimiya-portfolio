"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTrackedHash, suppressScrollSpyHash } from "@/components/useTrackedHash";

// How long a Top/About-me click suppresses scroll-spy-driven updates for,
// so its own scroll-into-view doesn't fight the click's optimistic value
// mid-transit. Generous relative to a typical smooth-scroll duration.
const SCROLL_SPY_SUPPRESS_MS = 1000;

type NavLink = { href: string; label: string };

// Both locales' home routes — "/" (ja) and "/en" (en) — need the same
// hash === "" requirement that "Top" vs "About me" relies on (see below),
// so both need to be recognized as "the home route", not just "/".
export const HOME_PATHS = ["/", "/en"];

// href is either a plain route ("/works", "/en/works") or a same-page hash
// link on the home route ("/#about", "/en#about"). usePathname() never
// includes the hash, so "Top" and "About me" resolve to the same pathname —
// the hash has to be tracked separately to tell them apart.
export function isActiveLink(pathname: string, hash: string, href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const hrefPath = href.slice(0, hashIndex) || "/";
    const hrefHash = href.slice(hashIndex);
    return pathname === hrefPath && hash === hrefHash;
  }
  if (HOME_PATHS.includes(href)) {
    return pathname === href && hash === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HorizonNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [hash, setHash] = useTrackedHash();

  // Whether the glow dot's move to the *currently* active link should play
  // framer-motion's layoutId FLIP slide, or just hard-cut into place with no
  // shared-layout animation at all. A real route change corrupts the FLIP's
  // position measurement for one frame: the dot briefly reports a position
  // consistent with having lost `position: fixed` entirely (document-flow
  // offset + whatever the page's scrollY happened to be, instead of a
  // viewport-relative value), which reads as it flying in vertically from
  // wherever the page was scrolled to before self-correcting a moment
  // later — confirmed by the error matching `scrollY + nav's normal
  // document-flow offset` almost exactly, on two independent repros. It only
  // happens across an actual Next.js route transition; toggling Top<->About
  // me (same pathname, hash-only change) never triggers it and keeps the
  // slide, which is the point of the polished feel there.
  //
  // Gated on pathname changing alone — NOT on activeHref also changing.
  // This used to require both together, which missed Works -> a work's own
  // detail page ("/works/[slug]"): activeHref stays "/works" either way (see
  // isActiveLink's startsWith check), so the dot never unmounts, but a real
  // route transition still happens and can still corrupt its measurement —
  // same bug as LanguageToggle's JA/EN dot had for exactly this "active
  // target doesn't change but the route still did" shape of transition.
  //
  // settledPathname (state, only ever updated from an effect) rather than a
  // ref updated synchronously during render: React can commit more than one
  // render for the same navigation before the browser actually paints, and
  // a ref recomputed on every render would flip skipFlip back off on the
  // very next of those renders — still before a paint — re-arming layoutId
  // while the corrupted-measurement window (one real painted frame) hasn't
  // passed yet. An effect only runs after the browser has painted the
  // commit it was scheduled from, so skipFlip now stays true across every
  // render caused by the same navigation, however many there are, until at
  // least one frame has actually been painted with the new pathname.
  const [settledPathname, setSettledPathname] = useState(pathname);
  const skipFlip = pathname !== settledPathname;
  useEffect(() => {
    if (pathname !== settledPathname) setSettledPathname(pathname);
  }, [pathname, settledPathname]);

  return (
    <nav className="relative hidden items-center gap-6 whitespace-nowrap lg:flex">
      {links.map((link) => {
        const active = isActiveLink(pathname, hash, link.href);
        const hashIndex = link.href.indexOf("#");
        const linkHash = hashIndex !== -1 ? link.href.slice(hashIndex) : "";

        return (
          <div key={link.href} className="relative">
            <Link
              href={link.href}
              onClick={() => {
                const staysOnHomeRoute = HOME_PATHS.includes(link.href) || linkHash === "#about";
                if (staysOnHomeRoute) {
                  // Only set hash eagerly for a click that keeps pathname
                  // at "/" (Top/About me) — pathname itself doesn't change
                  // for these, so hash is the only thing isActiveLink has
                  // to go on, and it needs to be right immediately.
                  //
                  // For a click to a different route, pathname updates
                  // asynchronously via Next's router — it lags this click
                  // by a render or two. Resetting hash to "" here too would
                  // momentarily leave pathname="/" (stale) paired with the
                  // new hash="" — exactly the combination isActiveLink
                  // reads as "Top" — so e.g. clicking "Works" from "About
                  // me" flashed the glow back to Top for a frame before
                  // pathname caught up and corrected it to Works. Leaving
                  // hash untouched here means that combination simply can't
                  // occur: hash stays at its last real value until the
                  // pathname-effect resyncs it once pathname has already
                  // moved to the new route, by which point isActiveLink is
                  // keying off pathname alone for route links anyway.
                  suppressScrollSpyHash(SCROLL_SPY_SUPPRESS_MS);
                  setHash(linkHash);
                }
              }}
              className={`relative text-[15px] transition-colors ${
                active ? "text-[#eaf6ff] [text-shadow:0_0_12px_rgba(127,183,255,0.65)]" : "text-[#93a3c2] hover:text-[#eaf6ff]"
              }`}
            >
              {link.label}
            </Link>
            {active && (
              <motion.div
                layoutId={skipFlip ? undefined : "nav-horizon-glow"}
                initial={false}
                className="pointer-events-none absolute -bottom-4 left-0 right-0 h-[4px] rounded-full"
                style={{ background: "#eaf6ff", boxShadow: "0 0 7px 1px #7FB7FF, 0 0 19px 4px #1E40FF" }}
                transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
