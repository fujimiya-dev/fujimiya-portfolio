export type Locale = "ja" | "en";

export const LOCALE_COOKIE = "locale";
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
  };
  footer: {
    privacyPolicy: string;
  };
};
