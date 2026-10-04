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

// order and numberLabel are deliberately not form-driven anymore: order is
// set by reorderWorks (drag-and-drop on the admin list) and left untouched
// by this edit form, and numberLabel has no admin UI at all now.
function buildWorkData(formData: FormData) {
  return {
    slug: String(formData.get("slug")),
    title: String(formData.get("title")),
    dateLabel: String(formData.get("dateLabel")),
    award: (formData.get("award") as string) || null,
    demoUrl: (formData.get("demoUrl") as string) || null,
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
    credits: (formData.get("credits") as string) || null,
  };
}

export async function createWork(formData: FormData) {
  await requireAdmin();

  const { _max } = await prisma.work.aggregate({ _max: { order: true } });
  const nextOrder = (_max.order ?? -1) + 1;

  await prisma.work.create({ data: { ...buildWorkData(formData), order: nextOrder } });

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

// Drag-and-drop reorder on the admin list — orderedIds is the full list of
// work IDs in the desired display order; each gets its array index as its
// new `order` value. A transaction keeps the reassignment atomic so a
// partial failure can't leave two works sharing an order value.
export async function reorderWorks(orderedIds: string[]) {
  await requireAdmin();

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.work.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/works");
  revalidatePath("/admin/works");
}
