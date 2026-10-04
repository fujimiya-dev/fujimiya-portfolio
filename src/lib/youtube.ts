// YouTube video IDs are always exactly 11 characters from this charset —
// https://stackoverflow.com/questions/2068344 and YouTube's own source both
// confirm this hasn't changed since the switch away from sequential IDs.
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Accepts a pasted YouTube URL (watch/share/embed/shorts) or a bare 11-char
 * video ID and returns just the ID, or null if nothing recognizable was
 * found. Never throws — bad input (empty string, a non-YouTube URL, random
 * text) just yields null so callers can treat "no video" uniformly.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && YOUTUBE_ID_RE.test(id) ? id : null;
    }
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
  }

  return null;
}

export function youtubeThumbnailUrl(videoId: string, quality: "maxresdefault" | "hqdefault" = "maxresdefault") {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}
