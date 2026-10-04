"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractYouTubeId } from "@/lib/youtube";

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

function buildWorkData(formData: FormData) {
  return {
    slug: String(formData.get("slug")),
    numberLabel: String(formData.get("numberLabel")),
    title: String(formData.get("title")),
    dateLabel: String(formData.get("dateLabel")),
    award: (formData.get("award") as string) || null,
    summary: String(formData.get("summary")),
    description: String(formData.get("description")),
    comment: String(formData.get("comment") || "準備中"),
    teamSize: Number(formData.get("teamSize") ?? 1),
    role: String(formData.get("role") || "準備中"),
    youtubeId: extractYouTubeId(String(formData.get("youtubeUrl") ?? "")),
    imageUrl: (formData.get("imageUrl") as string) || null,
    screenshots: formData
      .getAll("screenshots")
      .map((v) => String(v).trim())
      .filter(Boolean),
    category: parseTags(String(formData.get("category") ?? "")),
    techStack: parseTags(String(formData.get("techStack") ?? "")),
    order: Number(formData.get("order") ?? 0),
  };
}

export async function createWork(formData: FormData) {
  await requireAdmin();

  await prisma.work.create({ data: buildWorkData(formData) });

  revalidatePath("/works");
  revalidatePath("/admin/works");
  redirect("/admin/works");
}

export async function updateWork(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.work.update({
    where: { id },
    data: buildWorkData(formData),
  });

  revalidatePath("/works");
  revalidatePath("/admin/works");
  redirect("/admin/works");
}

export async function deleteWork(id: string) {
  await requireAdmin();
  await prisma.work.delete({ where: { id } });
  revalidatePath("/works");
  revalidatePath("/admin/works");
}
