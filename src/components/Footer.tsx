import Link from "next/link";
import { getDictionary } from "@/i18n/server";

const START_YEAR = 2026;

function copyrightLine() {
  const currentYear = new Date().getFullYear();
  const years = currentYear > START_YEAR ? `${START_YEAR}–${currentYear}` : `${START_YEAR}`;
  return `© ${years} Fujimiya. All rights reserved.`;
}

export default async function Footer() {
  const dict = await getDictionary();

  return (
    <footer className="relative z-[2] py-6 text-center text-xs text-ink-faint [text-shadow:0_0_10px_rgba(127,183,255,0.25)]">
      <nav className="mb-2">
        <Link href="/privacy" className="neon-link hover:text-[#eaf6ff]">
          {dict.footer.privacyPolicy}
        </Link>
      </nav>
      <p>{copyrightLine()}</p>
    </footer>
  );
}
