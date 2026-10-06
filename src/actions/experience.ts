"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normText } from "@/lib/formNormalize";

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

// order is deliberately not form-driven: it's set by reorderExperience
// (drag-and-drop on the admin list) and left untouched by this edit form.
function buildExperienceData(formData: FormData) {
  return {
    org: String(formData.get("org")),
    dateLabel: String(formData.get("dateLabel")),
    summary: String(formData.get("summary")),
    tags: parseTags(String(formData.get("tags") ?? "")),
  };
}

function buildExperienceTranslationData(formData: FormData) {
  return {
    org: normText(formData.get("orgEn")),
    dateLabel: normText(formData.get("dateLabelEn")),
    summary: normText(formData.get("summaryEn")),
  };
}

async function upsertExperienceTranslation(experienceId: string, formData: FormData) {
  await prisma.experienceTranslation.upsert({
    where: { experienceId_locale: { experienceId, locale: "en" } },
    create: { experienceId, locale: "en", ...buildExperienceTranslationData(formData) },
    update: buildExperienceTranslationData(formData),
  });
}

export async function createExperience(formData: FormData) {
  await requireAdmin();

  const { _max } = await prisma.experience.aggregate({ _max: { order: true } });
  const nextOrder = (_max.order ?? -1) + 1;

  const experience = await prisma.experience.create({ data: { ...buildExperienceData(formData), order: nextOrder } });
  await upsertExperienceTranslation(experience.id, formData);

  revalidatePath("/experience");
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function updateExperience(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.experience.update({
    where: { id },
    data: buildExperienceData(formData),
  });
  await upsertExperienceTranslation(id, formData);

  revalidatePath("/experience");
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  await prisma.experience.delete({ where: { id } });
  revalidatePath("/experience");
  revalidatePath("/admin/experience");
}

// Drag-and-drop reorder on the admin list — orderedIds is the full list of
// experience IDs in the desired display order; each gets its array index as
// its new `order` value. A transaction keeps the reassignment atomic.
export async function reorderExperience(orderedIds: string[]) {
  await requireAdmin();

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.experience.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/experience");
  revalidatePath("/admin/experience");
}
