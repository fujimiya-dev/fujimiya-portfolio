import Image from "next/image";
import Link from "next/link";
import { RevealGlow, RevealFade } from "@/components/RevealSection";
import IntroOverlayHost from "@/components/IntroOverlayHost";
import { getDictionary } from "@/i18n/server";
import { TbBrandPython, TbBrandTypescript, TbBrandCSharp, TbBrandCpp, TbBrandUnity } from "react-icons/tb";
import { FaJava } from "react-icons/fa";
import { SiUnrealengine } from "react-icons/si";

const techStack = [
  { label: "Python", Icon: TbBrandPython },
  { label: "TypeScript", Icon: TbBrandTypescript },
  { label: "Java", Icon: FaJava },
  { label: "C#", Icon: TbBrandCSharp },
  { label: "C++", Icon: TbBrandCpp },
  { label: "Unity", Icon: TbBrandUnity },
  { label: "UE", Icon: SiUnrealengine },
];

const interests = ["Webアプリ開発", "ゲーム開発", "空間演出", "XR"];

export const revalidate = 0;

export default async function HomePage() {
  const dict = await getDictionary();

  return (
    <>
      <IntroOverlayHost />

      <section className="flex min-h-screen flex-col items-center justify-end px-5 pb-20 text-center" />

      <section id="about" className="mx-auto max-w-4xl scroll-mt-24 px-6 pb-24 pt-16">
        <RevealGlow className="mb-16 border-b border-white/10 pb-16 text-center">
          <span className="mb-3 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
            私について
          </span>
          <h2 className="font-display text-4xl font-bold">{dict.nav.aboutMe}</h2>
        </RevealGlow>

        <div className="glass-panel rounded-sm px-6 py-10 sm:px-8 sm:py-12">
        <RevealFade className="grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr] md:items-start">
          <div className="glass-panel w-full p-2">
            <Image
              src="/profile.png"
              alt="藤田都"
              width={2160}
              height={2160}
              className="block h-auto w-full"
            />
          </div>
          <div>
            <table className="mb-6 w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">名前</td>
                  <td className="py-3">藤田 都</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">所属</td>
                  <td className="py-3">北陸先端科学技術大学院大学</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">専攻</td>
                  <td className="py-3">先端科学技術研究科 先端科学技術専攻</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">学年</td>
                  <td className="py-3">修士1年</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">出身大学</td>
                  <td className="py-3">昭和女子大学</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">学部・学科</td>
                  <td className="py-3">人間文化学部 歴史文化学科</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="w-24 py-3 font-label text-ink-faint">資格</td>
                  <td className="py-3">中学校・高校教諭一種免許状(社会)、温泉ソムリエ</td>
                </tr>
              </tbody>
            </table>

            <p className="mb-3 font-label text-xs tracking-widest text-ink-faint">勉強している技術</p>
            <div className="mb-6 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
              {techStack.map(({ label, Icon }) => (
                <div key={label} className="group flex flex-col items-center gap-2">
                  <Icon className="h-6 w-6 text-ink-soft transition-all group-hover:text-[#93c5ff] group-hover:drop-shadow-[0_0_6px_rgba(127,183,255,0.6)]" />
                  <span className="text-[11px] text-ink-faint">{label}</span>
                </div>
              ))}
            </div>

            <p className="mb-3 font-label text-xs tracking-widest text-ink-faint">興味分野</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((tag) => (
                <span key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </RevealFade>

        <div className="mx-auto mt-16 max-w-xl border-t border-white/10" />

        <RevealFade delay={0.1} className="mx-auto mt-16 max-w-xl text-center">
          <p className="text-sm leading-relaxed text-ink">
            学部では西洋美術史を専攻。
            <br />
            大学3年でのハッカソン初参加をきっかけに、「アイデアを形にする」楽しさに目覚める。
            <br />
            自分の世界をより広げたいと思い、情報系大学院へ分野転向。
            <br />
            フロントからバックまで幅広く手がけつつ、特にUIデザインへのこだわりがあります。
          </p>
        </RevealFade>

        <div className="mx-auto mb-4 mt-16 max-w-xl border-t border-white/10" />
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/works"
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
          >
            {dict.home.goToWorks}
          </Link>
        </div>
      </section>
    </>
  );
}
