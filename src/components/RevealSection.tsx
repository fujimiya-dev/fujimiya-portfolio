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
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-16 -z-10 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 25% 40%, rgba(72,224,176,.55), transparent 60%), radial-gradient(circle at 75% 60%, rgba(94,160,255,.45), transparent 60%)",
          filter: "blur(46px)",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
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
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
