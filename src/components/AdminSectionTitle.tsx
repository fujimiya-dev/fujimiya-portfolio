import SectionHeading from "@/components/SectionHeading";
import { RevealGlow } from "@/components/RevealSection";
import type { ComponentProps } from "react";

type HeadingKey = ComponentProps<typeof SectionHeading>["textKey"];

export default function AdminSectionTitle({ textKey, label }: { textKey: HeadingKey; label: string }) {
  return (
    <RevealGlow className="text-center">
      <SectionHeading textKey={textKey} label={label} className="mx-auto mb-14 h-10 w-auto" />
    </RevealGlow>
  );
}
