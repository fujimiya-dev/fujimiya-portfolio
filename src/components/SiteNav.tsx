"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { href: "/#about", label: "About", n: "01" },
  { href: "/works", label: "Works", n: "02" },
  { href: "/experience", label: "Experience", n: "03" },
  { href: "/research", label: "Research", n: "04" },
  { href: "/#other", label: "Other", n: "05" },
  { href: "/#hobby", label: "Hobby", n: "06" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed right-7 top-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md transition-colors hover:border-accent-teal"
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
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[55] flex items-center justify-center bg-sky-deep/90 backdrop-blur-xl"
          >
            <ul className="flex flex-col items-center gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 px-5 py-2 font-serif text-3xl text-ink-soft transition-colors hover:text-accent-teal"
                  >
                    <span className="font-sans text-xs tracking-widest text-ink-faint">
                      {link.n}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
