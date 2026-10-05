"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteExperience, reorderExperience } from "@/actions/experience";

type ExperienceListItem = { id: string; org: string; dateLabel: string };

export default function ExperienceAdminList({ initialItems }: { initialItems: ExperienceListItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === overId) return;
    setItems((prev) => {
      const fromIndex = prev.findIndex((i) => i.id === draggedId);
      const toIndex = prev.findIndex((i) => i.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    reorderExperience(items.map((i) => i.id)).catch((err) => {
      console.error("reorderExperience failed:", err);
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteExperience(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="glass-panel divide-y divide-white/10 rounded-sm px-6">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDraggedId(item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragEnd={handleDragEnd}
          className="flex cursor-grab items-center justify-between py-4 active:cursor-grabbing"
        >
          <div className="flex items-center gap-3">
            <span className="select-none text-ink-faint" aria-hidden="true">
              ⠿
            </span>
            <div>
              <p className="font-label">{item.org}</p>
              <p className="text-xs text-ink-faint">{item.dateLabel}</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href={`/admin/experience/${item.id}/edit`} className="neon-link text-accent-blue hover:text-accent-teal">
              編集
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="neon-link text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              削除
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="py-6 text-sm text-ink-faint">まだ経歴が登録されていません。</p>}
    </div>
  );
}
