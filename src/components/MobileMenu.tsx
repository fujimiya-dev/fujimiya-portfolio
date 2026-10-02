"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import IntroTriggerLink from "@/components/IntroTriggerLink";
import { isActiveLink } from "@/components/HorizonNav";
import { useTrackedHash, suppressScrollSpyHash } from "@/components/useTrackedHash";

// Mirrors HorizonNav's own suppression window — see useTrackedHash.ts.
const SCROLL_SPY_SUPPRESS_MS = 1000;

export default function MobileMenu({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Mirrors HorizonNav's own (race-free) hash tracking — the desktop
  // nav's glowing dot has never had a mobile equivalent, so there was
  // previously no way to tell which page you're on from this menu at all.
  const [hash, setHash] = useTrackedHash();

  return (
    <div className="lg:hidden">
      <button
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center"
      >
        <span className="relative block h-px w-4 bg-ink">
          <span
            className={`absolute left-0 block h-px w-4 bg-ink transition-transform ${
              open ? "translate-y-0 rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute left-0 block h-px w-4 bg-ink transition-transform ${
              open ? "translate-y-0 -rotate-45" : "translate-y-1.5"
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-sky-deep/90 backdrop-blur-xl"
          >
            <ul className="flex flex-col items-center gap-2">
              {links.map((link) => {
                const LinkComponent = link.href === "/" ? IntroTriggerLink : Link;
                const active = isActiveLink(pathname, hash, link.href);
                const hashIndex = link.href.indexOf("#");
                const linkHash = hashIndex !== -1 ? link.href.slice(hashIndex) : "";
                return (
                  <li key={link.href}>
                    <LinkComponent
                      href={link.href}
                      onClick={() => {
                        // See HorizonNav.tsx's onClick for why this is gated —
                        // setting hash eagerly for a cross-route click lets a
                        // stale pathname="/" + reset hash="" combination
                        // transiently (and wrongly) read as "Top" active.
                        const staysOnHomeRoute = link.href === "/" || linkHash === "#about";
                        if (staysOnHomeRoute) {
                          suppressScrollSpyHash(SCROLL_SPY_SUPPRESS_MS);
                          setHash(linkHash);
                        }
                        setOpen(false);
                      }}
                      className={`px-5 py-2 font-serif text-3xl transition-colors ${
                        active
                          ? "text-[#eaf6ff] [text-shadow:0_0_16px_rgba(127,183,255,0.7)]"
                          : "text-ink-soft hover:text-accent-teal"
                      }`}
                    >
                      {link.label}
                    </LinkComponent>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
