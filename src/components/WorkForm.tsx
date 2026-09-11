type WorkFormValues = {
  slug?: string;
  numberLabel?: string;
  title?: string;
  dateLabel?: string;
  award?: string | null;
  summary?: string;
  description?: string;
  demoUrl?: string | null;
  imageUrl?: string | null;
  tags?: string[];
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
        <label className="mb-1 block text-xs text-ink-faint">デモ動画URL（任意）</label>
        <input name="demoUrl" defaultValue={defaultValues?.demoUrl ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">画像URL（Vercel Blobにアップロード後のURL）</label>
        <input name="imageUrl" defaultValue={defaultValues?.imageUrl ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">タグ（カンマ区切り。例：Python, Django, ハッカソン）</label>
        <input name="tags" defaultValue={defaultValues?.tags?.join(", ")} className={fieldClass} />
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
      <button
        type="submit"
        className="rounded-sm border border-accent-teal px-5 py-2 text-sm text-accent-teal hover:bg-accent-teal hover:text-sky-deep"
      >
        {submitLabel}
      </button>
    </form>
  );
}
