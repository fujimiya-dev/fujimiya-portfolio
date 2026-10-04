"use client";

import { useEffect, useRef, useState } from "react";

const MAX_RETRIES = 3;

// Plain <img> has no built-in recovery from a failed load — a single
// transient network hiccup (mobile network blip, a request aborted by fast
// navigation, a momentary CDN cold-start) leaves a permanently broken image
// until the user hard-reloads. This retries a few times with backoff and a
// cache-busting query param (in case the failed response itself got cached),
// then falls back to a manual retry affordance instead of a broken icon.
export default function RetryImage({
  src,
  alt,
  className,
  fallbackClassName,
  compact,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  compact?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const resolvedSrc = attempt === 0 ? src : `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;

  function handleError() {
    if (attempt < MAX_RETRIES) {
      const next = attempt + 1;
      window.setTimeout(() => setAttempt(next), 500 * next);
    } else {
      setFailed(true);
    }
  }

  // The <img> is server-rendered, so the browser can start — and finish
  // failing — the request while parsing HTML, before React hydrates and
  // attaches onError below. A failed load from that race never fires our
  // handler, since the native 'error' event already happened. Catch it here
  // once on mount: a loaded-but-zero-size image is the signature of that
  // missed failure.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      handleError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setFailed(false);
          setAttempt(0);
        }}
        className={`flex flex-col items-center justify-center gap-1 bg-white/[0.03] text-ink-faint hover:text-accent-teal ${compact ? "text-[9px]" : "text-[11px]"} ${fallbackClassName ?? className ?? ""}`}
      >
        {compact ? (
          <span className="text-accent-teal underline">再読込</span>
        ) : (
          <>
            <span>画像を読み込めませんでした</span>
            <span className="text-accent-teal underline">再読み込み</span>
          </>
        )}
      </button>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- arbitrary external
  // URLs (Vercel Blob), not limited to the configured image domain
  return <img ref={imgRef} src={resolvedSrc} alt={alt} className={className} onError={handleError} />;
}
