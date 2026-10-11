import SectionHeading from "@/components/SectionHeading";
import { RevealGlow } from "@/components/RevealSection";
import type { ComponentProps } from "react";

type HeadingKey = ComponentProps<typeof SectionHeading>["textKey"];

export default function AdminSectionTitle({
  textKey,
  label,
  eyebrow,
}: {
  textKey: HeadingKey;
  label: string;
  eyebrow: string;
}) {
  return (
    <RevealGlow className="text-center">
      <span className="mb-7 flex items-center justify-center gap-2 heading-eyebrow tracking-widest text-accent-teal">
        {eyebrow}
      </span>
      <SectionHeading textKey={textKey} label={label} className="heading-xl mx-auto mb-14 w-auto" />
    </RevealGlow>
  );
}
