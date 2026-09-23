import { prisma } from "@/lib/prisma";
import OtherSection from "@/components/OtherSection";
import { RevealGlow } from "@/components/RevealSection";
import { getDictionary } from "@/i18n/server";

export const revalidate = 0;

export default async function OtherPage() {
  const [hobbies, dict, pianoHistory, pianoVideos, artFavorites, gameFavorites] =
    await Promise.all([
      prisma.hobby.findMany({ orderBy: { order: "asc" } }),
      getDictionary(),
      prisma.pianoHistory.findMany({ orderBy: { order: "asc" } }),
      prisma.pianoVideo.findMany({ orderBy: { order: "asc" } }),
      prisma.artFavorite.findMany({ orderBy: { order: "asc" } }),
      prisma.gameFavorite.findMany({ orderBy: { order: "asc" } }),
    ]);
  const teaCeremony = hobbies.find((h) => h.title === "茶道");

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <RevealGlow>
        <span className="mb-4 flex items-center gap-2 text-xs tracking-widest text-accent-teal">
          その他趣味など
        </span>
      </RevealGlow>
      <h2 className="mb-10 font-serif text-4xl font-bold">{dict.nav.other}</h2>
      <OtherSection
        pianoHistory={pianoHistory}
        pianoVideos={pianoVideos}
        artFavorites={artFavorites}
        gameFavorites={gameFavorites}
        teaCeremony={teaCeremony}
      />
    </section>
  );
}
