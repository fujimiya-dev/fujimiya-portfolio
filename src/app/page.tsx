import Image from "next/image";
import Link from "next/link";
import { RevealGlow, RevealFade } from "@/components/RevealSection";
import { STAR_WHITE, STAR_NEUTRAL } from "@/components/night-sky/palette";
import heroTitlePathData from "@/components/heroTitlePathData.json";
import IntroOverlayHost from "@/components/IntroOverlayHost";
import AboutScrollSpy from "@/components/AboutScrollSpy";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary, getLocale } from "@/i18n/server";
import { withLocale } from "@/i18n/path";
import { TbBrandPython, TbBrandTypescript, TbBrandJavascript, TbBrandCSharp, TbBrandCpp, TbBrandUnity } from "react-icons/tb";
import { FaJava } from "react-icons/fa";
import { SiUnrealengine } from "react-icons/si";

const techStack = [
  { label: "Python", Icon: TbBrandPython },
  { label: "TypeScript", Icon: TbBrandTypescript },
  { label: "JavaScript", Icon: TbBrandJavascript },
  { label: "Java", Icon: FaJava },
  { label: "C#", Icon: TbBrandCSharp },
  { label: "C++", Icon: TbBrandCpp },
  { label: "Unity", Icon: TbBrandUnity },
  { label: "UE", Icon: SiUnrealengine },
];

export const revalidate = 0;

export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <>
      <IntroOverlayHost />
      <AboutScrollSpy targetId="about" />

      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <svg
          role="img"
          aria-label="A Moonlit Dream"
          viewBox={heroTitlePathData.viewBox}
          className="h-auto w-[min(60vw,190px)] opacity-[0.88] sm:w-[233px] md:w-[309px]"
          style={{
            filter: `drop-shadow(0 0 15px ${STAR_WHITE}) drop-shadow(0 0 38px ${STAR_NEUTRAL}) drop-shadow(0 0 69px rgba(79, 216, 150, 0.6))`,
          }}
        >
          <path d={heroTitlePathData.path} fill="#eaf6ff" />
        </svg>
      </section>

      <section id="about" className="mx-auto max-w-4xl scroll-mt-24 px-6 pb-24 pt-20">
        <RevealGlow className="mb-16 text-center">
          <span className="mb-6 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
            {dict.home.eyebrow}
          </span>
          <SectionHeading textKey="aboutMe" label={dict.nav.aboutMe} />
        </RevealGlow>

        <div className="glass-panel rounded-sm px-6 py-10 sm:px-8 sm:py-12">
        <RevealFade className="grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr] md:items-start">
          <div className="glass-panel profile-photo-frame w-full overflow-hidden rounded-sm">
            <Image
              src="/profile.png"
              alt={dict.home.photoAlt}
              width={2160}
              height={2160}
              className="block h-auto w-full"
            />
          </div>
          <div>
            <table className="mb-6 w-full text-sm">
              <tbody>
                <tr className="neon-divider">
                  <td className="w-24 py-3 font-label text-ink-faint">{dict.home.nameLabel}</td>
                  <td className="py-3">{dict.home.name}</td>
                </tr>
                <tr className="neon-divider">
                  <td className="w-24 py-3 font-label text-ink-faint">{dict.home.affiliationLabel}</td>
                  <td className="py-3">{dict.home.affiliation}</td>
                </tr>
                <tr className="neon-divider">
                  <td className="w-24 py-3 font-label text-ink-faint">{dict.home.majorLabel}</td>
                  <td className="py-3">{dict.home.major}</td>
                </tr>
                <tr className="neon-divider">
                  <td className="w-24 py-3 font-label text-ink-faint">{dict.home.yearLabel}</td>
                  <td className="py-3">{dict.home.year}</td>
                </tr>
                <tr className="neon-divider">
                  <td className="w-24 py-3 font-label text-ink-faint">{dict.home.qualificationLabel}</td>
                  <td className="py-3">{dict.home.qualification}</td>
                </tr>
              </tbody>
            </table>

            <p className="mb-3 font-label text-xs tracking-widest text-ink-faint">{dict.home.studyingLabel}</p>
            <div className="mb-6 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
              {techStack.map(({ label, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon className="h-6 w-6 text-[#93c5ff] drop-shadow-[0_0_6px_rgba(127,183,255,0.6)]" />
                  <span className="text-[11px] text-ink-faint">{label}</span>
                </div>
              ))}
            </div>

            <p className="mb-3 font-label text-xs tracking-widest text-ink-faint">{dict.home.interestsLabel}</p>
            <div className="flex flex-wrap gap-2">
              {dict.home.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-ink-soft [text-shadow:0_0_6px_rgba(127,183,255,0.45)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </RevealFade>

        <div className="mx-auto mt-16 max-w-xl border-t border-white/10" />

        <RevealFade delay={0.1} className="mx-auto mt-16 max-w-xl text-center">
          <p className="text-sm leading-relaxed text-ink">
            {dict.home.bio.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        </RevealFade>

        <div className="mx-auto mb-4 mt-16 max-w-xl border-t border-white/10" />
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={withLocale("/works", locale)}
            className="rounded-sm border border-accent-teal px-8 py-3 text-sm text-accent-teal transition-all hover:bg-accent-teal hover:text-sky-deep hover:shadow-[0_0_20px_rgba(30,64,255,0.4)]"
          >
            {dict.home.goToWorks}
          </Link>
        </div>
      </section>
    </>
  );
}
