import type { Metadata } from "next";
import { RevealFade, RevealGlow } from "@/components/RevealSection";
import { getLocale } from "@/i18n/server";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Privacy Policy" : "プライバシーポリシー" };
}

function Article({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/10 pb-8 pt-8 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="mb-3 font-label text-lg font-bold text-ink">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

const linkClass = "neon-link text-accent-blue underline underline-offset-2 hover:text-accent-teal";

function PrivacyJa() {
  return (
    <>
      <RevealGlow className="mb-10 text-center">
        <h1 className="font-label text-4xl font-bold">プライバシーポリシー</h1>
      </RevealGlow>

      <RevealFade>
        <div className="glass-panel rounded-sm p-6 sm:p-8">
          <p className="mb-8 text-sm leading-relaxed text-ink-soft">
            Fujimiya.dev(以下「当サイト」)における個人情報の取り扱いについて定めます。
          </p>

          <Article heading="第1条(個人情報)">
            <p>
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレスその他の記述等により特定の個人を識別できる情報を指します。
            </p>
          </Article>

          <Article heading="第2条(お問い合わせフォームにおける情報の取得および利用目的)">
            <p>
              当サイトでは、お問い合わせの際に、氏名、メールアドレス、お問い合わせ内容をご入力いただいております。取得した情報は、以下の目的のために利用します。
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>お問い合わせに対する回答、必要な情報を電子メールにて送信するため</li>
              <li>上記利用目的に付随する目的のため</li>
            </ul>
            <p>なお、お問い合わせいただいた内容の控えを、送信者ご本人のメールアドレス宛に自動送信する場合があります。</p>
          </Article>

          <Article heading="第3条(アクセス解析ツールについて)">
            <p>
              当サイトでは、サイトの利用状況を把握するため、Googleが提供するアクセス解析ツール「Googleアナリティクス」を利用する場合があります。Googleアナリティクスは、Cookieを利用して利用者の情報を収集しますが、氏名、メールアドレスなど個人を特定する情報は含まれません。この機能はCookieを無効にすることで収集を拒否することが可能ですので、お使いのブラウザの設定をご確認ください。この規約に関して、詳しくは
              {" "}
              <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Googleアナリティクス利用規約
              </a>
              および
              <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Googleのポリシーと規約
              </a>
              をご覧ください。
            </p>
          </Article>

          <Article heading="第4条(外部サービスの埋め込みについて)">
            <p>
              当サイトでは、一部のコンテンツにおいてYouTube動画を埋め込んで表示しています。埋め込まれたYouTube動画の再生等にあたっては、Google
              LLCが提供するサービスの利用規約およびプライバシーポリシーが適用されます。詳しくは
              {" "}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
                YouTube利用規約
              </a>
              および
              <a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Googleプライバシーポリシー
              </a>
              をご覧ください。
            </p>
          </Article>

          <Article heading="第5条(個人情報の第三者提供)">
            <p>
              当サイトは、次に挙げる場合を除いて、あらかじめご本人の同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            </ul>
          </Article>

          <Article heading="第6条(個人情報の開示・訂正・削除)">
            <p>
              当サイトは、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。個人情報の内容が事実でない場合、訂正または削除をご希望の場合は、お問い合わせフォームよりご連絡ください。合理的な期間内に対応いたします。
            </p>
          </Article>

          <Article heading="第7条(プライバシーポリシーの変更)">
            <p>
              本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ご利用者様に通知することなく、変更することができるものとします。変更後のプライバシーポリシーは、当サイトに掘載したときから効力を生じるものとします。
            </p>
          </Article>

          <Article heading="第8条(お問い合わせ窓口)">
            <p>本ポリシーに関するお問い合わせは、サイト内のお問い合わせフォームよりお願いいたします。</p>
          </Article>

          <p className="mt-8 text-xs text-ink-faint">制定日:2026年10月2日</p>
        </div>
      </RevealFade>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <RevealGlow className="mb-10 text-center">
        <h1 className="font-label text-4xl font-bold">Privacy Policy</h1>
      </RevealGlow>

      <RevealFade>
        <div className="glass-panel rounded-sm p-6 sm:p-8">
          <p className="mb-8 text-sm leading-relaxed text-ink-soft">
            This Privacy Policy sets out how Fujimiya.dev (&quot;this site&quot;) handles personal information.
          </p>

          <Article heading="Article 1 (Personal Information)">
            <p>
              &quot;Personal information&quot; means &quot;personal information&quot; as defined in the Act on the
              Protection of Personal Information, referring to information about a living individual that can
              identify a specific person by name, email address, or other descriptions contained in that information.
            </p>
          </Article>

          <Article heading="Article 2 (Collection and Purpose of Use of Information via the Contact Form)">
            <p>
              When you use the contact form on this site, we ask you to provide your name, email address, and the
              content of your inquiry. The information collected is used for the following purposes:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>To reply to inquiries and send any necessary information by email</li>
              <li>For purposes incidental to the above</li>
            </ul>
            <p>Please note that a copy of the content of your inquiry may be automatically sent to the email address of the sender.</p>
          </Article>

          <Article heading="Article 3 (Access Analysis Tools)">
            <p>
              This site may use &quot;Google Analytics,&quot; an access analysis tool provided by Google, to understand
              how the site is used. Google Analytics collects information about users through cookies, but does not
              include information that identifies individuals, such as names or email addresses. You can refuse to
              have this information collected by disabling cookies; please check your browser settings. For more
              information on these terms, please see the
              {" "}
              <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Google Analytics Terms of Service
              </a>
              {" "}and{" "}
              <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Google&apos;s Policies and Terms
              </a>
              .
            </p>
          </Article>

          <Article heading="Article 4 (Embedding of External Services)">
            <p>
              This site embeds YouTube videos in some of its content. Playback of embedded YouTube videos is subject
              to the terms of service and privacy policy of the services provided by Google LLC. For more
              information, please see the
              {" "}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
                YouTube Terms of Service
              </a>
              {" "}and the{" "}
              <a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer" className={linkClass}>
                Google Privacy Policy
              </a>
              .
            </p>
          </Article>

          <Article heading="Article 5 (Provision of Personal Information to Third Parties)">
            <p>
              Except in the cases listed below, this site will not provide personal information to third parties
              without first obtaining the consent of the individual concerned, unless permitted under the Act on the
              Protection of Personal Information or other laws and regulations:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Where required by law</li>
              <li>Where necessary to protect a person&apos;s life, body, or property, and it is difficult to obtain the individual&apos;s consent</li>
            </ul>
          </Article>

          <Article heading="Article 6 (Disclosure, Correction, and Deletion of Personal Information)">
            <p>
              If an individual requests disclosure of their personal information, this site will disclose it without
              delay. If the content of the personal information is incorrect and you wish to request correction or
              deletion, please contact us via the contact form on this site. We will respond within a reasonable
              period of time.
            </p>
          </Article>

          <Article heading="Article 7 (Changes to this Privacy Policy)">
            <p>
              The content of this policy may be changed without notice to users, except for matters otherwise
              provided for by law or elsewhere in this policy. The revised Privacy Policy shall take effect from the
              time it is posted on this site.
            </p>
          </Article>

          <Article heading="Article 8 (Contact)">
            <p>For inquiries regarding this policy, please use the contact form on this site.</p>
          </Article>

          <p className="mt-8 text-xs text-ink-faint">
            In the event of any discrepancy between the Japanese and English versions of this policy, the Japanese
            version shall prevail.
          </p>
          <p className="mt-2 text-xs text-ink-faint">Effective date: October 2, 2026</p>
        </div>
      </RevealFade>
    </>
  );
}

export default async function PrivacyPage() {
  const locale = await getLocale();

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      {locale === "en" ? <PrivacyEn /> : <PrivacyJa />}
    </section>
  );
}
