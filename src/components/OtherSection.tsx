import Image from "next/image";

type PianoHistory = { id: string; period: string; description: string };
type PianoVideo = {
  id: string;
  dateLabel: string;
  venue: string;
  piece: string;
  note: string | null;
  videoUrl: string | null;
};
type ArtFavorite = { id: string; kind: string; name: string; url: string | null; imageUrl: string | null };
type GameFavorite = {
  id: string;
  group: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
};
type Hobby = { id: string; title: string; body: string };

function LinkCard({
  title,
  url,
  imageUrl,
}: {
  title: string;
  url: string | null;
  imageUrl: string | null;
}) {
  const content = (
    <div className="group flex h-full flex-col overflow-hidden border border-white/15 bg-white/[0.02] transition-colors hover:border-accent-teal/50">
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-white/[0.03]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={480}
            height={300}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-ink-faint">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-[10px] tracking-wide">No Image</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs leading-snug text-ink-soft transition-colors group-hover:text-accent-teal">
          {title}
          {url && " ↗"}
        </p>
      </div>
    </div>
  );

  if (!url) return content;
  return (
    <a href={url} target="_blank" rel="noopener">
      {content}
    </a>
  );
}

export default function OtherSection({
  pianoHistory,
  pianoVideos,
  artFavorites,
  gameFavorites,
  teaCeremony,
}: {
  pianoHistory: PianoHistory[];
  pianoVideos: PianoVideo[];
  artFavorites: ArtFavorite[];
  gameFavorites: GameFavorite[];
  teaCeremony: Hobby | undefined;
}) {
  const paintings = artFavorites.filter((a) => a.kind === "painting");
  const museums = artFavorites.filter((a) => a.kind === "museum");

  const gameGroups = gameFavorites.reduce<Record<string, GameFavorite[]>>((acc, g) => {
    (acc[g.group] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-14">
      {/* ピアノ */}
      <div className="glass-panel rounded-sm p-7">
        <h3 className="mb-5 font-label text-lg">
          ピアノ
        </h3>

        <ul className="mb-6 space-y-3 text-sm text-ink-soft">
          {pianoHistory.map((h) => (
            <li key={h.id} className="flex gap-4">
              <span className="w-28 shrink-0 font-serif text-ink-faint">{h.period}</span>
              <span className="whitespace-pre-line">{h.description}</span>
            </li>
          ))}
        </ul>

        <p className="mb-3 text-xs tracking-wide text-ink-faint">演奏動画</p>
        <div className="space-y-3">
          {pianoVideos.map((v) => (
            <div key={v.id} className="border-t border-white/10 pt-3 text-sm">
              <p className="text-ink-faint">
                {v.dateLabel}　{v.venue}
              </p>
              <p className="text-ink-soft">
                {v.piece}
                {v.note ? `（${v.note}）` : ""}
              </p>
              {v.videoUrl ? (
                <a
                  href={v.videoUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-accent-blue hover:text-accent-teal"
                >
                  動画を見る ↗
                </a>
              ) : (
                <p className="text-xs text-ink-faint">動画は準備中です</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 茶道 */}
      {teaCeremony && (
        <div className="glass-panel rounded-sm p-7">
          <h3 className="mb-2 font-label text-lg">
            {teaCeremony.title}
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{teaCeremony.body}</p>
        </div>
      )}

      {/* 美術館巡り */}
      <div className="glass-panel rounded-sm p-7">
        <h3 className="mb-5 font-label text-lg">
          美術館巡り
        </h3>

        <p className="mb-3 text-xs tracking-wide text-ink-faint">好きな絵画</p>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {paintings.map((p) => (
            <LinkCard key={p.id} title={p.name} url={p.url} imageUrl={p.imageUrl} />
          ))}
        </div>

        <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {"多様な時代の展示に足を運んでいますが、特にロココ期の華やかな装飾性と、印象派における光と色彩の探求に関心があります。\nまた、学部時代は現代アートを研究対象としていました。"}
        </p>

        <p className="mb-3 text-xs tracking-wide text-ink-faint">好きな美術館</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {museums.map((m) => (
            <LinkCard key={m.id} title={m.name} url={m.url} imageUrl={m.imageUrl} />
          ))}
        </div>
      </div>

      {/* ゲーム */}
      <div className="glass-panel rounded-sm p-7">
        <h3 className="mb-5 font-label text-lg">
          お気に入りゲーム
        </h3>
        <div className="space-y-6">
          {Object.entries(gameGroups).map(([group, games]) => (
            <div key={group}>
              <p className="mb-3 text-xs tracking-wide text-ink-faint">{group}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {games.map((g) => (
                  <LinkCard key={g.id} title={g.title} url={g.url} imageUrl={g.imageUrl} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-ink-soft">
            その他、マーダーミステリー等のTRPGやボードゲームも好きです。
          </p>
        </div>
      </div>
    </div>
  );
}
