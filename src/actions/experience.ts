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

export async function createExperience(formData: FormData) {
  await requireAdmin();

  await prisma.experience.create({
    data: {
      org: String(formData.get("org")),
      dateLabel: String(formData.get("dateLabel")),
      summary: String(formData.get("summary")),
      tags: parseTags(String(formData.get("tags") ?? "")),
      order: Number(formData.get("order") ?? 0),
    },
  });

  revalidatePath("/experience");
  revalidatePath("/admin/experience");
  redirect("/admin/experience");
}

export async function updateExperience(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.experience.update({
    where: { id },
    data: {
      org: String(formData.get("org")),
      dateLabel: String(formData.get("dateLabel")),
      summary: String(formData.get("summary")),
      tags: parseTags(String(formData.get("tags") ?? "")),
      order: Number(formData.get("order") ?? 0),
    },
  });

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
