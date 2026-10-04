"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import RetryImage from "@/components/RetryImage";

const VISIBLE_COUNT = 3;

export default function WorkGallery({ images, alt }: { images: string[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const maxStart = Math.max(0, images.length - VISIBLE_COUNT);
  const canSlide = images.length > VISIBLE_COUNT;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, images.length]);

  // Scroll lock while the lightbox is open — restores whatever was there
  // before (not forced back to "") only via cleanup, so this never fights
  // with anything else that might set body overflow.
  useEffect(() => {
    if (openIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIndex]);

  if (images.length === 0) return null;

  return (
    <div className="glass-panel mb-8 rounded-sm p-6">
      <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">ギャラリー</h2>
      <div className="flex items-center gap-2">
        {canSlide && (
          <button
            type="button"
            onClick={() => setStartIndex((i) => Math.max(0, i - 1))}
            disabled={startIndex === 0}
            className="neon-link shrink-0 px-1 text-2xl text-ink-faint hover:text-accent-teal disabled:pointer-events-none disabled:opacity-20"
            aria-label="前の画像を表示"
          >
            ‹
          </button>
        )}

        {/* Sliding window: the track holds all thumbnails at a fixed width of
            1/3 the viewport each (however many images there are), and shifts
            by one item-width per step — so exactly 3 are visible at a time
            regardless of total count. */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{
              width: `${(images.length / VISIBLE_COUNT) * 100}%`,
              transform: `translateX(-${(startIndex * 100) / images.length}%)`,
            }}
          >
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenIndex(i)}
                style={{ width: `${100 / images.length}%` }}
                className="group relative aspect-video shrink-0 overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] transition-all hover:border-accent-teal/50 hover:shadow-[0_0_16px_rgba(30,64,255,0.25)]"
              >
                <RetryImage
                  src={src}
                  alt={`${alt} ギャラリー画像 ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>

        {canSlide && (
          <button
            type="button"
            onClick={() => setStartIndex((i) => Math.min(maxStart, i + 1))}
            disabled={startIndex >= maxStart}
            className="neon-link shrink-0 px-1 text-2xl text-ink-faint hover:text-accent-teal disabled:pointer-events-none disabled:opacity-20"
            aria-label="次の画像を表示"
          >
            ›
          </button>
        )}
      </div>

      {/* Portaled to <body> — this card sits inside the detail page's
          RevealFade (a framer-motion element, which applies a CSS
          transform), and position:fixed descendants of a transformed
          ancestor are positioned/stacked relative to *that* ancestor
          instead of the viewport. Without the portal the lightbox rendered
          behind later-painted siblings like the "作品詳細" card, despite
          its own z-index, for exactly that reason — same category of fix
          as IntroOverlay's own portal. */}
      {mounted &&
        openIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-sky-deep/95 p-6 backdrop-blur-sm"
            onClick={() => setOpenIndex(null)}
          >
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                  }}
                  className="neon-link absolute left-2 top-1/2 -translate-y-1/2 px-3 py-6 text-3xl text-ink-faint hover:text-accent-teal sm:left-6"
                  aria-label="前の画像"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((i) => (i === null ? i : (i + 1) % images.length));
                  }}
                  className="neon-link absolute right-2 top-1/2 -translate-y-1/2 px-3 py-6 text-3xl text-ink-faint hover:text-accent-teal sm:right-6"
                  aria-label="次の画像"
                >
                  ›
                </button>
              </>
            )}

            {/* Shrink-wrapped to the rendered image size so the close
                button (positioned relative to this wrapper) sits at the
                image's own top-right corner rather than the screen's. */}
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <RetryImage
                src={images[openIndex]}
                alt={`${alt} ギャラリー画像 ${openIndex + 1}`}
                className="block max-h-[85vh] max-w-[90vw] rounded-sm object-contain shadow-[0_0_40px_rgba(0,0,0,0.6)]"
                fallbackClassName="h-[220px] w-[320px] max-w-[90vw] rounded-sm"
              />
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="neon-link absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-sky-deep text-sm text-ink-faint hover:border-accent-teal hover:text-accent-teal"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 text-xs text-ink-faint">
                {openIndex + 1} / {images.length}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
