"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normText, normLines } from "@/lib/formNormalize";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// references/achievements は文献の引用などカンマを含む1文になりうるため、
// Worksのカテゴリ/技術タグとは異なり改行区切りで配列化する。
function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

// order is deliberately not form-driven: it's set by reorderResearchItem
// (drag-and-drop on the admin list) and left untouched by this edit form.
function buildResearchData(formData: FormData) {
  return {
    slug: String(formData.get("slug")),
    stage: String(formData.get("stage")),
    title: String(formData.get("title")),
    summary: String(formData.get("summary")),
    cardSummary: (formData.get("cardSummary") as string) || null,
    imageUrl: (formData.get("imageUrl") as string) || null,
    caption: (formData.get("caption") as string) || null,
    tags: parseTags(String(formData.get("tags") ?? "")),
    techStack: parseTags(String(formData.get("techStack") ?? "")),
    references: parseLines(String(formData.get("references") ?? "")),
    achievements: parseLines(String(formData.get("achievements") ?? "")),
    paperUrl: (formData.get("paperUrl") as string) || null,
  };
}

function buildResearchTranslationData(formData: FormData) {
  return {
    title: normText(formData.get("titleEn")),
    summary: normText(formData.get("summaryEn")),
    cardSummary: normText(formData.get("cardSummaryEn")),
    caption: normText(formData.get("captionEn")),
    achievements: normLines(formData.get("achievementsEn")),
  };
}

async function upsertResearchTranslation(researchItemId: string, formData: FormData) {
  await prisma.researchItemTranslation.upsert({
    where: { researchItemId_locale: { researchItemId, locale: "en" } },
    create: { researchItemId, locale: "en", ...buildResearchTranslationData(formData) },
    update: buildResearchTranslationData(formData),
  });
}

export async function createResearchItem(formData: FormData) {
  await requireAdmin();

  const { _max } = await prisma.researchItem.aggregate({ _max: { order: true } });
  const nextOrder = (_max.order ?? -1) + 1;

  const item = await prisma.researchItem.create({ data: { ...buildResearchData(formData), order: nextOrder } });
  await upsertResearchTranslation(item.id, formData);

  revalidatePath("/research");
  revalidatePath("/admin/research");
  redirect("/admin/research");
}

export async function updateResearchItem(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.researchItem.update({
    where: { id },
    data: buildResearchData(formData),
  });
  await upsertResearchTranslation(id, formData);

  revalidatePath("/research");
  revalidatePath("/admin/research");
  redirect("/admin/research");
}

export async function deleteResearchItem(id: string) {
  await requireAdmin();
  await prisma.researchItem.delete({ where: { id } });
  revalidatePath("/research");
  revalidatePath("/admin/research");
}

// Drag-and-drop reorder on the admin list — orderedIds is the full list of
// research item IDs in the desired display order; each gets its array index
// as its new `order` value. A transaction keeps the reassignment atomic.
export async function reorderResearchItem(orderedIds: string[]) {
  await requireAdmin();

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.researchItem.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/research");
  revalidatePath("/admin/research");
}
