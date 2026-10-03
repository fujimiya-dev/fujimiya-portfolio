import SectionHeading from "@/components/SectionHeading";
import { RevealGlow } from "@/components/RevealSection";
import type { ComponentProps } from "react";

type HeadingKey = ComponentProps<typeof SectionHeading>["textKey"];

export default function AdminSectionTitle({ textKey, label }: { textKey: HeadingKey; label: string }) {
  return (
    <RevealGlow className="mb-16 text-center">
      <SectionHeading textKey={textKey} label={label} className="mx-auto h-10 w-auto" />
    </RevealGlow>
  );
}
