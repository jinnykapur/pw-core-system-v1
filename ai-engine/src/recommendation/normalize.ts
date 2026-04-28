export function normalizeToken(s: string) {
  return s.trim().toLowerCase();
}

export function uniqueNormalized(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = normalizeToken(raw);
    if (!t) continue;
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

