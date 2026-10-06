import { RevealGlow, RevealFade } from "@/components/RevealSection";
import SectionHeading from "@/components/SectionHeading";
import { getDictionary } from "@/i18n/server";
import ContactForm from "@/components/ContactForm";

export const revalidate = 0;

export default async function ContactPage() {
  const dict = await getDictionary();

  return (
    <section className="mx-auto max-w-xl px-6 pb-24 pt-32">
      <RevealGlow className="mb-14 text-center">
        <span className="mb-6 flex items-center justify-center gap-2 text-xs tracking-widest text-accent-teal">
          {dict.contact.eyebrow}
        </span>
        <SectionHeading textKey="contact" label={dict.nav.contact} />
      </RevealGlow>
      <RevealFade>
        <ContactForm dict={dict.contact} />
      </RevealFade>
    </section>
  );
}
