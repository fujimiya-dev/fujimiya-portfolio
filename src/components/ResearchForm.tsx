import ImageUrlField from "@/components/ImageUrlField";

type ResearchFormValues = {
  slug?: string;
  stage?: string;
  title?: string;
  summary?: string;
  cardSummary?: string | null;
  imageUrl?: string | null;
  caption?: string | null;
  tags?: string[];
  techStack?: string[];
  references?: string[];
  achievements?: string[];
  paperUrl?: string | null;
};

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal";

export default function ResearchForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ResearchFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs text-ink-faint">スラッグ (URL用の英数字)</label>
        <input name="slug" defaultValue={defaultValues?.slug} required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">区分</label>
        <select name="stage" defaultValue={defaultValues?.stage ?? "学部での研究"} className={fieldClass}>
          <option value="学部での研究">学部での研究</option>
          <option value="大学院での研究">大学院での研究</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">タイトル</label>
        <input name="title" defaultValue={defaultValues?.title} required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">
          概要（一覧カード用・短め、任意。未入力の場合は詳細ページ用の概要が代わりに表示されます）
        </label>
        <textarea
          name="cardSummary"
          defaultValue={defaultValues?.cardSummary ?? ""}
          rows={2}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">概要（詳細ページ用）</label>
        <textarea
          name="summary"
          defaultValue={defaultValues?.summary}
          rows={5}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">画像（任意）</label>
        <ImageUrlField name="imageUrl" defaultValue={defaultValues?.imageUrl} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">画像キャプション（任意）</label>
        <input name="caption" defaultValue={defaultValues?.caption ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">タグ（カンマ区切り。例：史学, 美術）</label>
        <input name="tags" defaultValue={defaultValues?.tags?.join(", ")} className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">使用技術（カンマ区切り。例：Unity）</label>
        <input
          name="techStack"
          defaultValue={defaultValues?.techStack?.join(", ")}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">
          主な参考文献（1行に1件。文中にカンマを含んでよい）
        </label>
        <textarea
          name="references"
          defaultValue={defaultValues?.references?.join("\n")}
          rows={5}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">実績（1行に1件）</label>
        <textarea
          name="achievements"
          defaultValue={defaultValues?.achievements?.join("\n")}
          rows={3}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">論文URL（任意）</label>
        <input name="paperUrl" defaultValue={defaultValues?.paperUrl ?? ""} className={fieldClass} />
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
