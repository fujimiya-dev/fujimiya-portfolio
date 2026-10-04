"use client";

import { useRef, useState, useTransition } from "react";
import Script from "next/script";
import { sendContactMessage } from "@/actions/contact";

type Status = { type: "idle" } | { type: "success" } | { type: "error"; message: string };

type GrecaptchaRenderOptions = {
  sitekey: string;
  theme?: "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: GrecaptchaRenderOptions) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const fieldClass =
  "w-full border-b border-white/20 bg-transparent py-2 text-sm outline-none placeholder:text-ink-faint transition-shadow focus:border-accent-teal focus:shadow-[0_4px_10px_-4px_rgba(30,64,255,0.5)]";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function renderCaptcha() {
    if (!window.grecaptcha || !captchaContainerRef.current) return;
    if (!RECAPTCHA_SITE_KEY) {
      console.error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY が設定されていません");
      return;
    }
    // The script tag finishing its network load (onReady) doesn't mean
    // grecaptcha.render is callable yet — Google's API does further async
    // setup internally and only guarantees render() exists inside the
    // ready() callback.
    window.grecaptcha.ready(() => {
      if (!window.grecaptcha || !captchaContainerRef.current) return;
      // Fast Refresh / StrictMode can re-run this; grecaptcha throws if the
      // same container is rendered into twice.
      if (captchaWidgetId.current !== null) return;
      captchaWidgetId.current = window.grecaptcha.render(captchaContainerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "dark",
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => setCaptchaToken(null),
      });
    });
  }

  function onSubmit(formData: FormData) {
    formData.set("recaptchaToken", captchaToken ?? "");
    startTransition(async () => {
      const result = await sendContactMessage(formData);
      if (result.ok) {
        setStatus({ type: "success" });
        formRef.current?.reset();
      } else {
        setStatus({ type: "error", message: result.error });
        // The token is single-use and may also be why verification failed
        // (expired/already consumed) — reset so the next attempt starts
        // from an unchecked box rather than silently resubmitting it.
        setCaptchaToken(null);
        if (window.grecaptcha && captchaWidgetId.current !== null) {
          window.grecaptcha.reset(captchaWidgetId.current);
        }
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
      {/* onReady (not onLoad) — it fires on every mount of this component,
          including a client-side revisit to /contact after the script tag
          is already cached from an earlier visit, whereas onLoad only ever
          fires once for the script's own load event. Without it, navigating
          away from /contact and back would leave the checkbox unrendered. */}
      <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" onReady={renderCaptcha} />

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

      {/* Honeypot — invisible to sighted users (off-screen, not display:none
          or visibility:hidden, since some bots skip filling those) and to
          screen readers (aria-hidden + tabIndex=-1 + unreachable), but still
          present in the DOM and form submission for a naive bot that fills
          every input it finds. A non-empty value here means the submission
          didn't come from the real form UI; the server action treats it as
          spam and silently no-ops instead of sending mail. The name avoids
          "honeypot"/"bot" so it doesn't advertise itself to anything smarter
          than a naive autofill bot. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="contact-hp-field">Company</label>
        <input id="contact-hp-field" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex justify-center">
        <div ref={captchaContainerRef} />
      </div>

      {status.type === "error" && <p className="text-xs text-[#ff8a8a]">{status.message}</p>}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isPending || !captchaToken}
          className="rounded-sm border border-accent-teal px-6 py-2 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)] disabled:opacity-50"
        >
          {isPending ? "送信中…" : "送信する"}
        </button>
      </div>
    </form>
  );
}
