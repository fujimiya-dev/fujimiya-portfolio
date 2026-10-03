"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTrackedHash, suppressScrollSpyHash } from "@/components/useTrackedHash";

// How long a Top/About-me click suppresses scroll-spy-driven updates for,
// so its own scroll-into-view doesn't fight the click's optimistic value
// mid-transit. Generous relative to a typical smooth-scroll duration.
const SCROLL_SPY_SUPPRESS_MS = 1000;

type NavLink = { href: string; label: string };

// href is either a plain route ("/works") or a same-page hash link on the
// home route ("/#about"). usePathname() never includes the hash, so "Top"
// and "About me" both resolve to pathname "/" — the hash has to be tracked
// separately to tell them apart.
export function isActiveLink(pathname: string, hash: string, href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const hrefPath = href.slice(0, hashIndex) || "/";
    const hrefHash = href.slice(hashIndex);
    return pathname === hrefPath && hash === hrefHash;
  }
  if (href === "/") {
    return pathname === "/" && hash === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HorizonNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [hash, setHash] = useTrackedHash();

  const activeHref = links.find((l) => isActiveLink(pathname, hash, l.href))?.href ?? null;

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
  // This decision is made once, exactly when the active link changes, and
  // held until it changes again — not recomputed every render, since this
  // same pathname can re-render several times in a row during a transition.
  const prevActiveRef = useRef<{ href: string | null; pathname: string }>({ href: activeHref, pathname });
  const skipFlipRef = useRef(false);
  if (prevActiveRef.current.href !== activeHref) {
    skipFlipRef.current = prevActiveRef.current.pathname !== pathname;
    prevActiveRef.current = { href: activeHref, pathname };
  }

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
                const staysOnHomeRoute = link.href === "/" || linkHash === "#about";
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
                layoutId={skipFlipRef.current ? undefined : "nav-horizon-glow"}
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
