"use client";

import { useEffect, useState } from "react";

export default function WorkGallery({ images, alt }: { images: string[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

  if (images.length === 0) return null;

  return (
    <div className="glass-panel mb-8 rounded-sm p-6">
      <h2 className="neon-label mb-3 font-label text-sm tracking-wide text-accent-teal">スクリーンショット</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-sm border border-white/10 bg-white/[0.02] transition-all hover:border-accent-teal/50 hover:shadow-[0_0_16px_rgba(30,64,255,0.25)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
                external URLs, not limited to the configured image domain */}
            <img
              src={src}
              alt={`${alt} スクリーンショット ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-sky-deep/95 p-6 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            className="neon-link absolute right-6 top-6 text-2xl text-ink-faint hover:text-accent-teal"
            aria-label="閉じる"
          >
            ✕
          </button>

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

          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            src={images[openIndex]}
            alt={`${alt} スクリーンショット ${openIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-sm object-contain shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 text-xs text-ink-faint">
              {openIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
