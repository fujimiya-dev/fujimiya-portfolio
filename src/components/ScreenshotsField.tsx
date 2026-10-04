"use client";

import { useRef, useState } from "react";
import { uploadScreenshot } from "@/actions/upload";
import RetryImage from "@/components/RetryImage";

const inputClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal";

const iconButtonClass =
  "neon-link rounded-sm border border-white/15 px-2 py-1 text-xs text-ink-soft hover:border-accent-teal hover:text-accent-teal disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-ink-soft";

// Order in this list = display order in the gallery — each hidden input
// below renders in array order, and the server action collects them via
// formData.getAll(name), which preserves DOM order. No separate "order"
// field needed; reordering the array *is* reordering the gallery.
export default function ScreenshotsField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string[];
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addUrl() {
    const v = draft.trim();
    if (!v) return;
    setUrls((prev) => [...prev, v]);
    setDraft("");
  }

  function remove(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    setUrls((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      // Sequential, not Promise.all — keeps upload order == drop order in
      // the resulting list instead of racing, and avoids hammering the
      // Blob API with a burst of parallel requests for a multi-file select.
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadScreenshot(fd);
        if ("error" in result) {
          setError(`${file.name}: ${result.error}`);
          continue;
        }
        setUrls((prev) => [...prev, result.url]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      {urls.map((url, i) => (
        <input key={i} type="hidden" name={name} value={url} />
      ))}

      {urls.length > 0 && (
        <div className="mb-3 space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 rounded-sm border border-white/10 p-2">
              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-white/[0.03]">
                <RetryImage src={url} alt="" className="h-full w-full object-cover" compact />
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{url}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={iconButtonClass} aria-label="上へ">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === urls.length - 1}
                className={iconButtonClass}
                aria-label="下へ"
              >
                ↓
              </button>
              <button type="button" onClick={() => remove(i)} className={`${iconButtonClass} text-red-400 hover:text-red-300`} aria-label="削除">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
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
            multiple
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
        <span className="text-[11px] text-ink-faint">または画像URLを直接追加:</span>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="https://..."
          className={inputClass}
        />
        <button
          type="button"
          onClick={addUrl}
          className="shrink-0 rounded-sm border border-white/20 px-4 py-2 text-xs text-ink-soft hover:border-accent-teal hover:text-accent-teal"
        >
          追加
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
