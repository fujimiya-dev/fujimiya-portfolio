"use client";

import { useMemo, useState } from "react";

export function useTagFilter<T>(
  items: T[],
  searchableText: (item: T) => string,
  getTags: (item: T) => string[]
) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => getTags(item).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [items, getTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = q === "" || searchableText(item).toLowerCase().includes(q);
      const matchesTag = !activeTag || getTags(item).includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [items, query, activeTag, searchableText, getTags]);

  function toggleTag(tag: string) {
    setActiveTag((current) => (current === tag ? null : tag));
    setQuery(tag);
  }

  return { query, setQuery, activeTag, toggleTag, allTags, filtered };
}
