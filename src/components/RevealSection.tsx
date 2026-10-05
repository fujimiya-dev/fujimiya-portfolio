"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function RevealGlow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-16 -z-10 rounded-full"
        style={{
          // Same blue-neon recipe as the header (core #eaf6ff, halo
          // #7FB7FF/#1E40FF) — this used to be a green+blue two-tone
          // bloom, which read as a different palette from the nav.
          background:
            "radial-gradient(circle at 25% 40%, rgba(30,64,255,.35), transparent 60%), radial-gradient(circle at 75% 60%, rgba(127,183,255,.45), transparent 60%)",
          filter: "blur(46px)",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: "some" }}
        transition={{ duration: 1.3, ease: [0.19, 1, 0.22, 1] }}
      />
      {children}
    </motion.div>
  );
}

export function RevealFade({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      // "some" (any part intersecting) rather than a fixed fraction —
      // RevealFade sometimes wraps very tall content (e.g. a long Works
      // description), where no scroll position ever gets a fixed % of the
      // whole element on screen at once, so whileInView never fired and
      // the content stayed at its initial opacity:0 forever. Reproduced
      // against a real long-content work page before this fix, confirmed
      // gone after.
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
