"use client";

import { useState } from "react";
import NoImage from "@/components/NoImage";
import { youtubeThumbnailUrl } from "@/lib/youtube";

// YouTube never 404s img.youtube.com/vi/<id>/hqdefault.jpg for a
// syntactically valid ID, even when the video doesn't exist (not yet
// uploaded, deleted, private, ...) — it serves a generic 120x90 grey "no
// thumbnail" placeholder with a 200 status instead, so a plain onError
// handler can't detect that case. Checking the loaded image's natural
// dimensions against that fixed 120x90 signature can. maxresdefault.jpg
// *does* 404 on its own whenever that specific resolution wasn't
// generated (common for lower-quality source video) even though the video
// itself is real, so that failure mode is handled separately via onError,
// falling back to hqdefault before giving up.
const PLACEHOLDER_WIDTH = 120;
const PLACEHOLDER_HEIGHT = 90;

type Stage = "maxres" | "hq" | "failed";

export default function YouTubeThumbnail({ videoId, alt }: { videoId: string; alt: string }) {
  const [stage, setStage] = useState<Stage>("maxres");

  if (stage === "failed") return <NoImage />;

  const src = youtubeThumbnailUrl(videoId, stage === "maxres" ? "maxresdefault" : "hqdefault");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- needs the raw
    // <img> element's onLoad to read naturalWidth/Height for the
    // placeholder-detection above; next/image's own loader/callback
    // wouldn't reliably expose the untouched source dimensions.
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-contain"
      onError={() => setStage((s) => (s === "maxres" ? "hq" : "failed"))}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth === PLACEHOLDER_WIDTH && img.naturalHeight === PLACEHOLDER_HEIGHT) {
          setStage((s) => (s === "maxres" ? "hq" : "failed"));
        }
      }}
    />
  );
}
