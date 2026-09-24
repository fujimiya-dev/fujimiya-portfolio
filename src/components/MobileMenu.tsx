"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import IntroTriggerLink from "@/components/IntroTriggerLink";

export default function MobileMenu({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

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
                return (
                  <li key={link.href}>
                    <LinkComponent
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 font-serif text-3xl text-ink-soft transition-colors hover:text-accent-teal"
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
