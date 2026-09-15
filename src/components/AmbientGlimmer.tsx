"use client";

import { useEffect, useRef } from "react";

type Particle = {
  baseX: number;
  baseY: number;
  radius: number;
  driftSpeed: number;
  driftPhase: number;
  twinkleSpeed: number;
  twinklePhase: number;
  hue: number;
};

function createParticles(width: number, height: number): Particle[] {
  const count = width < 640 ? 32 : 60;
  return Array.from({ length: count }, () => ({
    baseX: Math.random() * width,
    baseY: Math.random() * height,
    radius: Math.random() * 1.6 + 0.6,
    driftSpeed: Math.random() * 0.35 + 0.12,
    driftPhase: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.7 + 0.25,
    twinklePhase: Math.random() * Math.PI * 2,
    hue: 145 + Math.random() * 25,
  }));
}

export default function AmbientGlimmer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = createParticles(width, height);
    let raf = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height);
      if (reduceMotion) drawStatic();
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.fillStyle = `hsla(${p.hue}, 65%, 82%, 0.5)`;
        ctx!.arc(p.baseX, p.baseY, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawFrame(elapsedSeconds: number) {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        const drift = elapsedSeconds * p.driftSpeed;
        const dx = Math.sin(drift + p.driftPhase) * 14;
        const dy = Math.cos(drift * 0.8 + p.driftPhase) * 10;
        const twinkle = 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(elapsedSeconds * p.twinkleSpeed + p.twinklePhase));
        ctx!.beginPath();
        ctx!.fillStyle = `hsla(${p.hue}, 65%, 82%, ${twinkle})`;
        ctx!.arc(p.baseX + dx, p.baseY + dy, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      drawStatic();
    } else {
      const start = performance.now();
      const loop = (now: number) => {
        drawFrame((now - start) / 1000);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
