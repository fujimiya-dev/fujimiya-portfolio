"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

function buildResearchData(formData: FormData) {
  return {
    slug: String(formData.get("slug")),
    stage: String(formData.get("stage")),
    title: String(formData.get("title")),
    summary: String(formData.get("summary")),
    imageUrl: (formData.get("imageUrl") as string) || null,
    caption: (formData.get("caption") as string) || null,
    tags: parseTags(String(formData.get("tags") ?? "")),
    techStack: parseTags(String(formData.get("techStack") ?? "")),
    references: parseLines(String(formData.get("references") ?? "")),
    achievements: parseLines(String(formData.get("achievements") ?? "")),
    paperUrl: (formData.get("paperUrl") as string) || null,
    order: Number(formData.get("order") ?? 0),
  };
}

export async function createResearchItem(formData: FormData) {
  await requireAdmin();

  await prisma.researchItem.create({ data: buildResearchData(formData) });

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
