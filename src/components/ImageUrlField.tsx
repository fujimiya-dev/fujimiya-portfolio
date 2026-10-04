"use client";

import { useRef, useState } from "react";
import { uploadScreenshot } from "@/actions/upload";
import RetryImage from "@/components/RetryImage";

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal";

// Single-image counterpart to ScreenshotsField — same Vercel Blob upload
// action, but one value (bound directly to the visible URL input) instead
// of an array of hidden inputs, since there's no ordering/multiple-value
// concern here.
export default function ImageUrlField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadScreenshot(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        setUrl(result.url);
      }
    } catch {
      // Framework-level rejection (e.g. request body too large) throws
      // instead of resolving to { error } — see ScreenshotsField for the
      // same case.
      setError("アップロードに失敗しました(ファイルサイズが大きすぎる可能性があります)");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      {url && (
        <div className="mb-2 flex items-center gap-2 rounded-sm border border-white/10 p-2">
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-white/[0.03]">
            <RetryImage src={url} alt="" className="h-full w-full object-cover" compact />
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{url}</span>
          <button
            type="button"
            onClick={() => setUrl("")}
            className="neon-link rounded-sm border border-white/15 px-2 py-1 text-xs text-red-400 hover:border-accent-teal hover:text-red-300"
            aria-label="削除"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label
          className={`shrink-0 rounded-sm border border-accent-teal px-4 py-2 text-xs text-accent-teal hover:bg-accent-teal hover:text-sky-deep ${
            uploading ? "pointer-events-none opacity-50" : "cursor-pointer"
          }`}
        >
          {uploading ? "アップロード中…" : "+ 画像をアップロード"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </label>
        <span className="text-[11px] text-ink-faint">または画像URLを直接入力:</span>
      </div>

      <input
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className={fieldClass}
      />

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
