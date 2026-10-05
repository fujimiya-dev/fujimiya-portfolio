import { getDictionary, getLocale } from "@/i18n/server";
import LanguageToggle from "@/components/LanguageToggle";
import MobileMenu from "@/components/MobileMenu";
import IntroTriggerLink from "@/components/IntroTriggerLink";
import DesktopNavBar from "@/components/DesktopNavBar";

export default async function TopNav() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  const links = [
    { href: "/", label: dict.nav.top },
    { href: "/#about", label: dict.nav.aboutMe },
    { href: "/works", label: dict.nav.works },
    { href: "/experience", label: dict.nav.experience },
    { href: "/research", label: dict.nav.research },
    { href: "/contact", label: dict.nav.contact },
  ];

  const logo = (
    <IntroTriggerLink
      href="/"
      className="font-intro text-[27px] text-[#eaf6ff] [text-shadow:0_0_4px_#eaf6ff,0_0_11px_#7FB7FF,0_0_22px_#1E40FF]"
    >
      Fujimiya.dev
    </IntroTriggerLink>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 py-4">
      {/* Mobile/narrow-desktop: plain left-logo / right-controls row.
          HorizonNav hides itself below `lg` (1024px) — below this there's
          no "centered group" to speak of here; this matches the layout
          from before the horizon nav redesign.
          Note: at ~1024-1180px the cluster (now that JA/EN lives inside
          it too) can run into Hero's moon — reverted to `lg` per explicit
          request rather than the `xl` workaround, so that range is
          accepted as-is for now. */}
      <div className="flex items-center justify-between lg:hidden">
        {logo}
        <div className="flex items-center gap-4">
          <LanguageToggle current={locale} />
          <MobileMenu links={links} />
        </div>
      </div>

      {/* Desktop (lg+): nav + JA/EN form the centered "bar" (see
          DesktopNavBar for how it's kept centered on the true viewport —
          same `minmax(0,1fr)` spacer logic as before). The logo is no
          longer part of that centering: it's a separately, live-measured
          fixed-position element sitting at the midpoint between the
          screen edge and the bar's actual left edge, without shifting the
          bar/JA-EN position at all (a static CSS offset can't express
          "midpoint to wherever the bar happens to render," and reasoning
          about the bar's own centering from outside the component that
          owns it was what caused the bar to visibly drift the last time
          this was attempted here — moving both concerns into one client
          component keeps that measurement local to what it depends on). */}
      <DesktopNavBar links={links} locale={locale} />
    </header>
  );
}
