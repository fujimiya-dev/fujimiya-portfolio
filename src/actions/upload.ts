"use server";

import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Server Actions route through a Vercel serverless function invocation,
// which caps the request body around 4.5MB — comfortably enough for a
// screenshot PNG/JPG, but worth a clear error instead of an opaque
// mid-upload failure if someone picks something huge.
const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

export async function uploadScreenshot(formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ファイルが選択されていません" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルのみアップロードできます" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "ファイルサイズが大きすぎます(4.5MBまで)" };
  }

  try {
    const blob = await put(`works/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch (err) {
    console.error("Screenshot upload failed:", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("No token found")) {
      return {
        error:
          "アップロード機能が未設定です(BLOB_READ_WRITE_TOKENが未設定)。管理者にお問い合わせください。",
      };
    }
    return { error: "アップロードに失敗しました。時間をおいて再度お試しください" };
  }
}
