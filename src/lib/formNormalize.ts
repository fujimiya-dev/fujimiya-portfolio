// Shared "trim, empty → null" rule for translation-table text fields, so an
// admin saving an English field with only whitespace (or clearing it out)
// reliably falls back to the Japanese value on display rather than storing
// an empty string that would display as blank.
export function normText(raw: FormDataEntryValue | null): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  return t === "" ? null : t;
}

export function normLines(raw: FormDataEntryValue | null): string[] {
  if (raw == null) return [];
  return String(raw)
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}
