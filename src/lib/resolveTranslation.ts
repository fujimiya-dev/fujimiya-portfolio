import type { Locale } from "@/i18n/types";
import type { Work, WorkTranslation, Experience, ExperienceTranslation, ResearchItem, ResearchItemTranslation } from "@prisma/client";

// Merges an "en" translation row onto its base (Japanese) record for
// display. Every translation field is optional/nullable — an empty or
// missing field always falls back to the Japanese value, never to a blank
// string, so a half-filled-in translation never blanks out part of a page.
// category/tags/stage are deliberately NOT touched here: those stay the
// Japanese value from the base record always (see src/lib/tagLabels.ts for
// their separate, display-only translation).

export function resolveWork(work: Work & { translations: WorkTranslation[] }, locale: Locale) {
  if (locale === "ja") return work;
  const t = work.translations.find((x) => x.locale === "en");
  return {
    ...work,
    title: t?.title || work.title,
    dateLabel: t?.dateLabel || work.dateLabel,
    award: t?.award || work.award,
    summary: t?.summary || work.summary,
    description: t?.description || work.description,
    comment: t?.comment || work.comment,
    role: t?.role || work.role,
    credits: t?.credits || work.credits,
  };
}

export function resolveExperience(experience: Experience & { translations: ExperienceTranslation[] }, locale: Locale) {
  if (locale === "ja") return experience;
  const t = experience.translations.find((x) => x.locale === "en");
  return {
    ...experience,
    org: t?.org || experience.org,
    dateLabel: t?.dateLabel || experience.dateLabel,
    summary: t?.summary || experience.summary,
  };
}

export function resolveResearchItem(item: ResearchItem & { translations: ResearchItemTranslation[] }, locale: Locale) {
  if (locale === "ja") return item;
  const t = item.translations.find((x) => x.locale === "en");
  return {
    ...item,
    title: t?.title || item.title,
    summary: t?.summary || item.summary,
    cardSummary: t?.cardSummary || item.cardSummary,
    caption: t?.caption || item.caption,
    achievements: t && t.achievements.length > 0 ? t.achievements : item.achievements,
  };
}
