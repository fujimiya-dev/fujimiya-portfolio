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

export async function createWork(formData: FormData) {
  await requireAdmin();

  await prisma.work.create({
    data: {
      slug: String(formData.get("slug")),
      numberLabel: String(formData.get("numberLabel")),
      title: String(formData.get("title")),
      dateLabel: String(formData.get("dateLabel")),
      award: (formData.get("award") as string) || null,
      summary: String(formData.get("summary")),
      description: String(formData.get("description")),
      demoUrl: (formData.get("demoUrl") as string) || null,
      imageUrl: (formData.get("imageUrl") as string) || null,
      category: parseTags(String(formData.get("category") ?? "")),
      techStack: parseTags(String(formData.get("techStack") ?? "")),
      order: Number(formData.get("order") ?? 0),
    },
  });

  revalidatePath("/works");
  revalidatePath("/admin/works");
  redirect("/admin/works");
}

export async function updateWork(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.work.update({
    where: { id },
    data: {
      slug: String(formData.get("slug")),
      numberLabel: String(formData.get("numberLabel")),
      title: String(formData.get("title")),
      dateLabel: String(formData.get("dateLabel")),
      award: (formData.get("award") as string) || null,
      summary: String(formData.get("summary")),
      description: String(formData.get("description")),
      demoUrl: (formData.get("demoUrl") as string) || null,
      imageUrl: (formData.get("imageUrl") as string) || null,
      category: parseTags(String(formData.get("category") ?? "")),
      techStack: parseTags(String(formData.get("techStack") ?? "")),
      order: Number(formData.get("order") ?? 0),
    },
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
