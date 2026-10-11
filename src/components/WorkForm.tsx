"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ScreenshotsField from "@/components/ScreenshotsField";
import ImageUrlField from "@/components/ImageUrlField";

type Locale = "ja" | "en";

type WorkFormValues = {
  slug?: string;
  title?: string;
  dateLabel?: string;
  award?: string | null;
  demoUrl?: string | null;
  githubUrl?: string | null;
  summary?: string;
  description?: string;
  comment?: string;
  teamSize?: number;
  role?: string;
  youtubeId?: string | null;
  imageUrl?: string | null;
  screenshots?: string[];
  category?: string[];
  techStack?: string[];
  credits?: string | null;
  titleEn?: string | null;
  dateLabelEn?: string | null;
  awardEn?: string | null;
  summaryEn?: string | null;
  descriptionEn?: string | null;
  commentEn?: string | null;
  roleEn?: string | null;
  creditsEn?: string | null;
};

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal";

export default function WorkForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: WorkFormValues;
  submitLabel: string;
}) {
  const [locale, setLocale] = useState<Locale>("ja");
  // document.body doesn't exist during SSR — portal only once mounted
  // client-side, same guard IntroOverlay.tsx already uses for its own
  // document.body portal.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Both locales' inputs for a translatable field stay mounted at all
  // times — only the inactive one is hidden via CSS (`hidden`, not
  // removed) — so switching the toggle above never loses a value or drops
  // a field's `name` out of the single surrounding <form>'s submission.
  // Same "hide, don't unmount" approach LocaleTabs already uses elsewhere
  // in admin, just inlined per-field here instead of grouping every JA
  // field together and every EN field together, since that grouping is
  // exactly what made this form's order diverge from the public detail
  // page's order in the first place.
  const jaVisible = locale === "ja" ? "" : "hidden";
  const enVisible = locale === "en" ? "" : "hidden";

  // Single JA/EN toggle for the whole form, replacing the old
  // LocaleTabs-per-section split — needs to stay reachable while scrolling
  // a form this long, via `position: fixed`. Portaled straight onto
  // document.body (same escape hatch IntroOverlay.tsx already uses)
  // because `fixed` isn't actually fixed-to-viewport if rendered inside
  // the admin page's .glass-panel wrapper: that panel has
  // `backdrop-filter`, and filter/backdrop-filter establish a new
  // containing block for fixed-position descendants just like `transform`
  // does — confirmed by it scrolling away pinned to the panel instead of
  // the viewport. (`position: sticky` was tried first and has its own,
  // different problem: this site's <body> ends up with a computed
  // overflow-y: auto as a side effect of its own overflow-x: hidden rule
  // elsewhere, which makes <body> a scroll container and breaks sticky's
  // viewport-relative positioning too.) top-24/right-6 sits comfortably
  // below the site's own fixed header.
  const localeToggle = (
    <div className="fixed right-6 top-24 z-30 flex gap-1 rounded-sm border border-white/15 bg-sky-deep/95 p-1 shadow-lg backdrop-blur-md">
      {(["ja", "en"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setLocale(t)}
          aria-pressed={locale === t}
          className={`rounded-sm px-4 py-2 text-sm transition-colors ${
            locale === t ? "bg-accent-teal/15 text-accent-teal" : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {t === "ja" ? "日本語" : "English"}
        </button>
      ))}
    </div>
  );

  return (
    <form action={action} className="space-y-5">
      {mounted && createPortal(localeToggle, document.body)}

      <div>
        <label className="mb-1 block text-xs text-ink-faint">スラッグ (URL用の英数字)</label>
        <input name="slug" defaultValue={defaultValues?.slug} required className={fieldClass} />
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">タイトル</label>
        <input name="title" defaultValue={defaultValues?.title} required className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Title（空欄可。未入力時は日本語版を表示）</label>
        <input name="titleEn" defaultValue={defaultValues?.titleEn ?? ""} className={fieldClass} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-ink-faint">
          ギャラリー（任意、複数枚登録可・並び替え可）
        </label>
        <ScreenshotsField name="screenshots" defaultValue={defaultValues?.screenshots} />
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">概要（一覧用の短い説明、複数行可）</label>
        <textarea name="summary" defaultValue={defaultValues?.summary} rows={3} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Summary（空欄可。未入力時は日本語版を表示）</label>
        <textarea name="summaryEn" defaultValue={defaultValues?.summaryEn ?? ""} rows={3} className={fieldClass} />
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">詳細説明</label>
        <textarea name="description" defaultValue={defaultValues?.description} rows={5} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Description（空欄可。未入力時は日本語版を表示）</label>
        <textarea
          name="descriptionEn"
          defaultValue={defaultValues?.descriptionEn ?? ""}
          rows={5}
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-ink-faint">カテゴリ（カンマ区切り。例：チーム開発, ハッカソン）</label>
        <input name="category" defaultValue={defaultValues?.category?.join(", ")} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">使用技術（カンマ区切り。例：Python, Django）</label>
        <input name="techStack" defaultValue={defaultValues?.techStack?.join(", ")} className={fieldClass} />
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">期間（例：2024.12.20 – 2025.1.17）</label>
        <input name="dateLabel" defaultValue={defaultValues?.dateLabel} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Date（空欄可。未入力時は日本語版を表示）</label>
        <input name="dateLabelEn" defaultValue={defaultValues?.dateLabelEn ?? ""} className={fieldClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">担当人数</label>
          <input
            name="teamSize"
            type="number"
            min={1}
            defaultValue={defaultValues?.teamSize ?? 1}
            className={fieldClass}
          />
        </div>
        <div>
          <div className={jaVisible}>
            <label className="mb-1 block text-xs text-ink-faint">担当部分</label>
            <textarea name="role" defaultValue={defaultValues?.role ?? "準備中"} rows={3} className={fieldClass} />
          </div>
          <div className={enVisible}>
            <label className="mb-1 block text-xs text-ink-faint">My Role（空欄可。未入力時は日本語版を表示）</label>
            <textarea name="roleEn" defaultValue={defaultValues?.roleEn ?? ""} rows={3} className={fieldClass} />
          </div>
        </div>
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">開催・受賞（任意、複数行可。例：○○ハッカソン／優勝）</label>
        <textarea name="award" defaultValue={defaultValues?.award ?? ""} rows={3} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Event / Award（任意、複数行可。空欄可）</label>
        <textarea name="awardEn" defaultValue={defaultValues?.awardEn ?? ""} rows={3} className={fieldClass} />
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">製作者コメント</label>
        <textarea name="comment" defaultValue={defaultValues?.comment ?? "準備中"} rows={3} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Creator's Comment（空欄可。未入力時は日本語版を表示）</label>
        <textarea
          name="commentEn"
          defaultValue={defaultValues?.commentEn ?? ""}
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-ink-faint">デモURL（任意）</label>
        <input
          name="demoUrl"
          type="url"
          defaultValue={defaultValues?.demoUrl ?? ""}
          placeholder="https://..."
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">GitHub URL（任意）</label>
        <input
          name="githubUrl"
          type="url"
          defaultValue={defaultValues?.githubUrl ?? ""}
          placeholder="https://github.com/..."
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">
          YouTube動画のURL（またはID）（任意）
        </label>
        <input
          name="youtubeUrl"
          defaultValue={defaultValues?.youtubeId ?? ""}
          placeholder="https://www.youtube.com/watch?v=..."
          className={fieldClass}
        />
        <p className="mt-1 text-[11px] text-ink-faint">
          入力すると一覧・詳細ページでサムネイル表示と埋め込み再生に使われます。サムネイル画像の別途アップロードは不要です。
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">サムネイル（任意）</label>
        <ImageUrlField name="imageUrl" defaultValue={defaultValues?.imageUrl} />
        <p className="mt-1 text-[11px] text-ink-faint">
          一覧ページではサムネイル画像が優先、作品詳細ページではYouTube動画が優先して表示されます。
        </p>
      </div>

      <div className={jaVisible}>
        <label className="mb-1 block text-xs text-ink-faint">
          クレジット（任意、複数行可。例：楽曲:曲名 / アーティスト名 https://...）
        </label>
        <textarea name="credits" defaultValue={defaultValues?.credits ?? ""} rows={5} className={fieldClass} />
      </div>
      <div className={enVisible}>
        <label className="mb-1 block text-xs text-ink-faint">Credits（任意、複数行可。空欄可）</label>
        <textarea name="creditsEn" defaultValue={defaultValues?.creditsEn ?? ""} rows={5} className={fieldClass} />
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          className="rounded-sm border border-accent-teal px-5 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
