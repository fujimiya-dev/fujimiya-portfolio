import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RevealGlow, RevealFade } from "@/components/RevealSection";

export const revalidate = 0;

export default async function HomePage() {
  const [others, hobbies] = await Promise.all([
    prisma.otherActivity.findMany({ orderBy: { order: "asc" } }),
    prisma.hobby.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <section className="flex min-h-screen flex-col items-center justify-end px-5 pb-20 text-center">
        <span className="absolute bottom-7 left-7 font-serif text-sm text-ink-faint">
          portfolio
        </span>
        <div className="flex flex-col items-center gap-3 text-[11px] tracking-[0.3em] text-ink-faint">
          <span>SCROLL</span>
          <span className="h-14 w-px bg-gradient-to-b from-ink-faint to-transparent" />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-4xl px-6 pb-24 pt-16">
        <RevealGlow className="mb-16 border-b border-white/10 pb-16 text-center">
          <span className="mb-3 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
            <span className="font-serif text-base text-accent-moon">01</span>
            About
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

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link href="/works" className="text-accent-blue hover:text-accent-teal">
            Works を見る ↗
          </Link>
          <Link href="/experience" className="text-accent-blue hover:text-accent-teal">
            Experience を見る ↗
          </Link>
          <Link href="/research" className="text-accent-blue hover:text-accent-teal">
            Research を見る ↗
          </Link>
        </div>
      </section>

      <section id="other" className="mx-auto max-w-4xl px-6 pb-24">
        <RevealGlow>
          <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal">
            <span className="font-serif text-base text-accent-moon">05</span>
            Other Experience
          </span>
        </RevealGlow>
        <h2 className="mb-10 font-serif text-4xl font-bold">その他の活動</h2>
        {others.map((item) => (
          <RevealFade key={item.id} className="glass-panel mb-4 grid grid-cols-[140px_1fr] gap-6 rounded-sm p-6">
            <div className="font-serif text-sm text-ink-faint">{item.dateLabel}</div>
            <div>
              <h3 className="mb-1 font-serif text-base">{item.title}</h3>
              <p className="text-sm text-ink-soft">{item.summary}</p>
            </div>
          </RevealFade>
        ))}
      </section>

      <section id="hobby" className="mx-auto max-w-4xl px-6 pb-32">
        <RevealGlow>
          <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal">
            <span className="font-serif text-base text-accent-moon">06</span>
            Hobby
          </span>
        </RevealGlow>
        <h2 className="mb-10 font-serif text-4xl font-bold">趣味</h2>
        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-2">
          {hobbies.map((hobby) => (
            <div key={hobby.id} className="glass-panel p-7">
              <h3 className="mb-2 font-serif text-base">{hobby.title}</h3>
              <p className="text-sm text-ink-soft">{hobby.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
