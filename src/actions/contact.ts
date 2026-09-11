"use server";

import { Resend } from "resend";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(formData: FormData): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "すべての項目を入力してください。" };
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
      // Resendのドメイン未認証の間はこのアドレスからのみ送信できます。
      // 自分のドメインを認証したら、ここを独自ドメインのアドレスに変更してください。
      from: "Portfolio Contact <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `【ポートフォリオ】${name}様からお問い合わせ`,
      text: `名前: ${name}\nメール: ${email}\n\n${message}`,
    });
    return { ok: true };
  } catch (err) {
    console.error("contact form send failed:", err);
    return { ok: false, error: "送信に失敗しました。時間をおいて再度お試しください。" };
  }
}
