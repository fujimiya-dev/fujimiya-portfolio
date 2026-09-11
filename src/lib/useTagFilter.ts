"use client";

import { useMemo, useState } from "react";

export function useTagFilter<T extends { tags: string[] }>(
  items: T[],
  searchableText: (item: T) => string
) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = q === "" || searchableText(item).toLowerCase().includes(q);
      const matchesTag = !activeTag || item.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [items, query, activeTag, searchableText]);

  function toggleTag(tag: string) {
    setActiveTag((current) => (current === tag ? null : tag));
    setQuery(tag);
  }

  return { query, setQuery, activeTag, toggleTag, allTags, filtered };
}
