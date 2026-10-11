export type Locale = "ja" | "en";

export const DEFAULT_LOCALE: Locale = "ja";

/**
 * すべての翻訳キーの型定義。
 * ここにキーを追加すると、ja.ts / en.ts の両方で埋めるまで型エラーになります。
 * 「日本語だけ書いて英語を書き忘れる」を構造的に防ぐための仕組みです。
 */
export type Dictionary = {
  nav: {
    top: string;
    aboutMe: string;
    works: string;
    experience: string;
    research: string;
    contact: string;
    langToggleLabel: string;
  };
  home: {
    goToWorks: string;
    eyebrow: string;
    photoAlt: string;
    nameLabel: string;
    affiliationLabel: string;
    majorLabel: string;
    yearLabel: string;
    qualificationLabel: string;
    name: string;
    affiliation: string;
    major: string;
    year: string;
    qualification: string;
    studyingLabel: string;
    interestsLabel: string;
    interests: string[];
    bio: string;
  };
  footer: {
    privacyPolicy: string;
  };
  works: {
    eyebrow: string;
    ctaNext: string;
    searchPlaceholder: string;
    filterByCategory: string;
    empty: string;
  };
  experience: {
    eyebrow: string;
    ctaNext: string;
    searchPlaceholder: string;
    filterByCategory: string;
    empty: string;
  };
  research: {
    eyebrow: string;
    ctaNext: string;
  };
  workDetail: {
    backToList: string;
    period: string;
    demoUrl: string;
    githubUrl: string;
    award: string;
    details: string;
    comment: string;
    showMore: string;
    showLess: string;
    teamSize: string;
    teamSizeSuffix: string;
    role: string;
    category: string;
    techStack: string;
    credits: string;
    gallery: string;
    viewMore: string;
  };
  researchDetail: {
    backToList: string;
    summary: string;
    tags: string;
    techStack: string;
    achievements: string;
    references: string;
    viewPaper: string;
    viewMore: string;
  };
  contact: {
    eyebrow: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    widgetLoadFail: string;
  };
  contactErrors: {
    missingFields: string;
    rateLimited: string;
    recaptchaFailed: string;
    serviceUnavailable: string;
    sendFailed: string;
  };
};
