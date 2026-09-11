import Image from "next/image";
import Link from "next/link";
import { RevealGlow, RevealFade } from "@/components/RevealSection";
import { getDictionary } from "@/i18n/server";
import ContactForm from "@/components/ContactForm";

export const revalidate = 0;

export default async function HomePage() {
  const dict = await getDictionary();

  return (
    <>
      <section className="flex min-h-screen flex-col items-center justify-end px-5 pb-20 text-center">
        <div className="flex flex-col items-center gap-3 text-[11px] tracking-[0.3em] text-ink-faint">
          <span>{dict.home.scrollCue}</span>
          <span className="h-14 w-px bg-gradient-to-b from-ink-faint to-transparent" />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-4xl scroll-mt-24 px-6 pb-24 pt-16">
        <RevealGlow className="mb-16 border-b border-white/10 pb-16 text-center">
          <span className="mb-3 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
            {dict.nav.aboutMe}
          </span>
          <h1 className="mb-3 font-serif text-6xl font-bold">藤田 都</h1>
          <p className="text-sm text-ink-soft">北陸先端科学技術大学院大学　修士1年</p>
        </RevealGlow>

        <RevealFade className="grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr]">
          <div className="glass-panel p-2">
            <Image
              src="/profile.jpg"
              alt="藤田都"
              width={460}
              height={614}
              className="h-auto w-full"
            />
          </div>
          <div>
            <table className="mb-6 w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-serif text-ink-faint">名前</td>
                  <td className="py-3">藤田 都</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-serif text-ink-faint">所属</td>
                  <td className="py-3">北陸先端科学技術大学院大学</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-serif text-ink-faint">学年</td>
                  <td className="py-3">修士1年</td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-wrap gap-2">
              {["Python", "C#", "Unity", "UE", "プロジェクションマッピング", "絵画鑑賞支援", "史学", "教育"].map(
                (tag) => (
                  <span key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft">
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </RevealFade>

        <div className="mt-12 flex justify-center">
          <Link
            href="/works"
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-colors hover:bg-accent-teal hover:text-sky-deep"
          >
            {dict.home.goToWorks}
          </Link>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-xl scroll-mt-24 px-6 pb-32">
        <RevealGlow className="mb-10 text-center">
          <span className="mb-3 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
            {dict.home.contactHeading}
          </span>
          <h2 className="font-serif text-3xl font-bold">{dict.home.contactHeading}</h2>
        </RevealGlow>
        <RevealFade>
          <ContactForm />
        </RevealFade>
      </section>
    </>
  );
}
