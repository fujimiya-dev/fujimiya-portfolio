import type { Locale } from "@/i18n/types";

// Single place mapping fixed Japanese category/tag/stage values to their
// English display label. Display-only — filtering/matching logic always
// keys off the original Japanese value stored in the DB. Any value not
// listed here (e.g. a future tag, or 地域活動 which was removed from the
// Experience filter UI but may still exist on older rows) falls back to
// being shown in Japanese on the English site rather than erroring.
const TAG_LABELS: Record<string, string> = {
  個人開発: "Solo Project",
  チーム開発: "Team Project",
  公開作品: "Released",
  ハッカソン: "Hackathon",
  インターン: "Internship",
  ビジネス: "Business",
  セミナー: "Seminar",
  教育: "Education",
  史学: "History",
  美術: "Art",
  現代アート: "Contemporary Art",
  情報工学: "Information Engineering",
  視線誘導: "Gaze Guidance",
  視線計測: "Eye Tracking",
  学部での研究: "Undergraduate Research",
  大学院での研究: "Graduate Research",
};

export function translateTag(value: string, locale: Locale): string {
  if (locale === "ja") return value;
  return TAG_LABELS[value] ?? value;
}
