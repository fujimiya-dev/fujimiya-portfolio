"use server";

import { Resend } from "resend";
import { headers } from "next/headers";

export type ContactResult = { ok: true } | { ok: false; error: string };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;

// Per-warm-instance, in-memory, best-effort limiter — no external store, so
// it doesn't coordinate across concurrent serverless instances and resets
// on a cold start. Combined with the honeypot below, that's enough to blunt
// a basic bot/script hammering this endpoint without an external
// dependency; a distributed limiter (Vercel KV/Upstash) would be the next
// step if abuse ever outgrows this.
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  recentSubmissions.set(ip, timestamps);

  // Opportunistic sweep of IPs with no recent activity, piggybacked on
  // normal request traffic instead of a background job, so the map doesn't
  // grow unbounded over the process's lifetime.
  if (recentSubmissions.size > 1000) {
    for (const [key, times] of recentSubmissions) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(key);
    }
  }

  return false;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

const RECAPTCHA_FAIL_MESSAGE =
  "reCAPTCHA認証に失敗しました。チェックを入れ直してから再度送信してください。何度も失敗する場合は直接X(@fujimiya_dev)までご連絡ください。";

async function verifyRecaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY が設定されていません");
    return false;
  }

  try {
    const params = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data: { success?: boolean } = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("recaptcha verify failed:", err);
    return false;
  }
}

export async function sendContactMessage(formData: FormData): Promise<ContactResult> {
  // Honeypot — see ContactForm.tsx's hidden "company" field. A real user
  // never sees or fills it; a naive bot that fills every input it finds
  // trips this. Fake success instead of an error so it doesn't learn the
  // submission was caught.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: true };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "すべての項目を入力してください。" };
  }

  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { ok: false, error: "短時間に多くのお問い合わせを受け付けました。しばらく時間をおいて再度お試しください。" };
  }

  const recaptchaToken = String(formData.get("recaptchaToken") ?? "").trim();
  if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken, ip))) {
    return { ok: false, error: RECAPTCHA_FAIL_MESSAGE };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("RESEND_API_KEY / CONTACT_TO_EMAIL が設定されていません");
    return { ok: false, error: "現在お問い合わせを受け付けられません。しばらくしてから再度お試しください。" };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Fujimiya.dev <noreply@fujimiya.dev>",
      to,
      replyTo: email,
      subject: `【ポートフォリオ】${name}様からお問い合わせ`,
      text: `名前: ${name}\nメール: ${email}\n\n${message}`,
    });

    // 送信者本人への控えメール — あくまでベストエフォート。失敗しても
    // (SMTP一時エラー等)上の管理者宛通知は既に成功しているため、
    // フォーム送信自体の成功扱いは変えない。
    try {
      await resend.emails.send({
        from: "Fujimiya.dev <noreply@fujimiya.dev>",
        to: email,
        subject: "【Fujimiya.dev】お問い合わせを受け付けました",
        text: `${name} 様\n\n以下の内容でお問い合わせを受け付けました。内容をご確認ください。\n\n----------\n${message}\n----------\n\n※このメールは送信確認のための自動返信です。このメールに直接返信いただいても対応できませんので、あらかじめご了承ください。\n\n--\nFujimiya.dev`,
      });
    } catch (err) {
      console.error("contact confirmation email send failed:", err);
    }

    return { ok: true };
  } catch (err) {
    console.error("contact form send failed:", err);
    return { ok: false, error: "送信に失敗しました。時間をおいて再度お試しください。" };
  }
}
