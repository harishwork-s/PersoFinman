export function matchesSearch(item, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return String(item.name || "").toLowerCase().includes(normalized);
}
