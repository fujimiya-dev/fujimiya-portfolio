"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteWork, reorderWorks } from "@/actions/works";

type WorkListItem = { id: string; title: string; dateLabel: string };

export default function WorksAdminList({ initialWorks }: { initialWorks: WorkListItem[] }) {
  const [works, setWorks] = useState(initialWorks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === overId) return;
    setWorks((prev) => {
      const fromIndex = prev.findIndex((w) => w.id === draggedId);
      const toIndex = prev.findIndex((w) => w.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    reorderWorks(works.map((w) => w.id)).catch((err) => {
      console.error("reorderWorks failed:", err);
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteWork(id);
      setWorks((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="glass-panel divide-y divide-white/10 rounded-sm px-6">
      {works.map((work) => (
        <div
          key={work.id}
          draggable
          onDragStart={() => setDraggedId(work.id)}
          onDragOver={(e) => handleDragOver(e, work.id)}
          onDragEnd={handleDragEnd}
          className="flex cursor-grab items-center justify-between py-4 active:cursor-grabbing"
        >
          <div className="flex items-center gap-3">
            <span className="select-none text-ink-faint" aria-hidden="true">
              ⠿
            </span>
            <div>
              <p className="font-label">{work.title}</p>
              <p className="text-xs text-ink-faint">{work.dateLabel}</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href={`/admin/works/${work.id}/edit`} className="neon-link text-accent-blue hover:text-accent-teal">
              編集
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(work.id)}
              disabled={deletingId === work.id}
              className="neon-link text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              削除
            </button>
          </div>
        </div>
      ))}
      {works.length === 0 && <p className="py-6 text-sm text-ink-faint">まだ制作物が登録されていません。</p>}
    </div>
  );
}
