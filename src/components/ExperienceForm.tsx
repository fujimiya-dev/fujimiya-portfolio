import LocaleTabs from "@/components/LocaleTabs";

type ExperienceFormValues = {
  org?: string;
  dateLabel?: string;
  summary?: string;
  tags?: string[];
  orgEn?: string | null;
  dateLabelEn?: string | null;
  summaryEn?: string | null;
};

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent-teal";

export default function ExperienceForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ExperienceFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <LocaleTabs
        ja={
          <>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">団体・組織名</label>
              <input name="org" defaultValue={defaultValues?.org} required className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">期間（例：2024.5 – 2025.1）</label>
              <input name="dateLabel" defaultValue={defaultValues?.dateLabel} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">概要</label>
              <textarea name="summary" defaultValue={defaultValues?.summary} rows={4} className={fieldClass} />
            </div>
          </>
        }
        en={
          <>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">Organization（空欄可。未入力時は日本語版を表示）</label>
              <input name="orgEn" defaultValue={defaultValues?.orgEn ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">Date（空欄可。未入力時は日本語版を表示）</label>
              <input name="dateLabelEn" defaultValue={defaultValues?.dateLabelEn ?? ""} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-faint">Summary（空欄可。未入力時は日本語版を表示）</label>
              <textarea name="summaryEn" defaultValue={defaultValues?.summaryEn ?? ""} rows={4} className={fieldClass} />
            </div>
          </>
        }
      />

      <div>
        <label className="mb-1 block text-xs text-ink-faint">タグ（カンマ区切り。例：チーム開発, ハッカソン）</label>
        <input name="tags" defaultValue={defaultValues?.tags?.join(", ")} className={fieldClass} />
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
