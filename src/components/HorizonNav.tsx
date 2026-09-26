"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import IntroTriggerLink from "@/components/IntroTriggerLink";

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
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));

  useEffect(() => {
    // Covers direct loads and browser back/forward (which fire a native
    // hashchange event). Client-side <Link> navigation to a hash updates
    // window.location.hash slightly after this component's own re-render,
    // so that case is instead handled optimistically by each link's own
    // onClick below, not by this effect.
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (
    <nav className="relative hidden items-center gap-6 whitespace-nowrap lg:flex">
      {links.map((link) => {
        const active = isActiveLink(pathname, hash, link.href);
        const hashIndex = link.href.indexOf("#");
        const linkHash = hashIndex !== -1 ? link.href.slice(hashIndex) : "";
        const LinkComponent = link.href === "/" ? IntroTriggerLink : Link;

        return (
          <div key={link.href} className="relative">
            <LinkComponent
              href={link.href}
              onClick={() => setHash(linkHash)}
              className={`relative text-[15px] transition-colors ${
                active ? "text-[#eaf6ff] [text-shadow:0_0_12px_rgba(127,183,255,0.65)]" : "text-[#93a3c2] hover:text-[#eaf6ff]"
              }`}
            >
              {link.label}
            </LinkComponent>
            {active && (
              <motion.div
                layoutId="nav-horizon-glow"
                className="pointer-events-none absolute -bottom-4 left-0 right-0 h-[4px] rounded-full"
                style={{ background: "#eaf6ff", boxShadow: "0 0 7px 1px #7FB7FF, 0 0 19px 4px #1E40FF" }}
                transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
