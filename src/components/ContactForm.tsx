"use client";

import { useRef, useState, useTransition } from "react";
import { sendContactMessage } from "@/actions/contact";

type Status = { type: "idle" } | { type: "success" } | { type: "error"; message: string };

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none placeholder:text-ink-faint focus:border-accent-teal";

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await sendContactMessage(formData);
      if (result.ok) {
        setStatus({ type: "success" });
        formRef.current?.reset();
      } else {
        setStatus({ type: "error", message: result.error });
      }
    });
  }

  if (status.type === "success") {
    return (
      <div className="glass-panel rounded-sm p-8 text-center">
        <p className="text-sm text-accent-teal">送信しました。ご連絡ありがとうございます。</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="glass-panel space-y-5 rounded-sm p-8">
      <div>
        <label className="mb-1 block text-xs text-ink-faint">お名前</label>
        <input name="name" required className={fieldClass} placeholder="山田 太郎" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">メールアドレス</label>
        <input name="email" type="email" required className={fieldClass} placeholder="you@example.com" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-faint">メッセージ</label>
        <textarea name="message" required rows={5} className={fieldClass} placeholder="お問い合わせ内容をご記入ください" />
      </div>

      {status.type === "error" && <p className="text-xs text-red-400">{status.message}</p>}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm border border-accent-teal px-6 py-2 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep disabled:opacity-50"
        >
          {isPending ? "送信中…" : "送信する"}
        </button>
      </div>
    </form>
  );
}
