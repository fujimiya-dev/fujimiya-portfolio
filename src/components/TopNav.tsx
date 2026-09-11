import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import LanguageToggle from "@/components/LanguageToggle";
import MobileMenu from "@/components/MobileMenu";

export default async function TopNav() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  const links = [
    { href: "/", label: dict.nav.top },
    { href: "/#about", label: dict.nav.aboutMe },
    { href: "/works", label: dict.nav.works },
    { href: "/experience", label: dict.nav.experience },
    { href: "/research", label: dict.nav.research },
    { href: "/other", label: dict.nav.other },
    { href: "/contact", label: dict.nav.contact },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-sky-deep/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="font-serif text-sm text-ink-soft">
          portfolio
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-accent-teal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageToggle current={locale} />
          <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}
