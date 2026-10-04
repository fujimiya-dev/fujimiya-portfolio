type WorkFormValues = {
  slug?: string;
  numberLabel?: string;
  title?: string;
  dateLabel?: string;
  award?: string | null;
  summary?: string;
  description?: string;
  comment?: string;
  teamSize?: number;
  role?: string;
  youtubeId?: string | null;
  imageUrl?: string | null;
  category?: string[];
  techStack?: string[];
  order?: number;
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
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs text-ink-faint">スラッグ (URL用の英数字)</label>
        <input name="slug" defaultValue={defaultValues?.slug} required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">番号ラベル（例：制作物 一）</label>
        <input name="numberLabel" defaultValue={defaultValues?.numberLabel} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">タイトル</label>
        <input name="title" defaultValue={defaultValues?.title} required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">期間（例：2024.12.20 – 2025.1.17）</label>
        <input name="dateLabel" defaultValue={defaultValues?.dateLabel} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">受賞など（任意）</label>
        <input name="award" defaultValue={defaultValues?.award ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">概要（一覧用の短い説明）</label>
        <input name="summary" defaultValue={defaultValues?.summary} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">詳細説明</label>
        <textarea
          name="description"
          defaultValue={defaultValues?.description}
          rows={5}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">製作者コメント</label>
        <textarea
          name="comment"
          defaultValue={defaultValues?.comment ?? "準備中"}
          rows={3}
          className={fieldClass}
        />
      </div>
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
        <label className="mb-1 block text-xs text-ink-faint">担当部分</label>
        <textarea
          name="role"
          defaultValue={defaultValues?.role ?? "準備中"}
          rows={3}
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
        <label className="mb-1 block text-xs text-ink-faint">
          画像URL（任意、YouTube動画が無い場合のサムネイルとして使用）
        </label>
        <input name="imageUrl" defaultValue={defaultValues?.imageUrl ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">カテゴリ（カンマ区切り。例：チーム開発, ハッカソン）</label>
        <input name="category" defaultValue={defaultValues?.category?.join(", ")} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">使用技術（カンマ区切り。例：Python, Django）</label>
        <input name="techStack" defaultValue={defaultValues?.techStack?.join(", ")} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">並び順（数字が小さいほど先に表示）</label>
        <input
          name="order"
          type="number"
          defaultValue={defaultValues?.order ?? 0}
          className={fieldClass}
        />
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
