/** Shared utilities. */

/** Total income in rings from structured currency fields. */
export function memberIncomeRings(rings: number | null, crowns: number | null, thrones: number | null): number {
  return (rings ?? 0) + (crowns ?? 0) * 20 + (thrones ?? 0) * 160;
}

/** Format income fields as a compact string, rolling up to crowns/thrones.
 *  e.g. rings=25, crowns=3 → total 85r → "4c · 5r". Returns null if all zero. */
export function formatIncome(rings: number | null, crowns: number | null, thrones: number | null): string | null {
  let total = memberIncomeRings(rings, crowns, thrones);
  if (total === 0) return null;
  const t = Math.floor(total / 160); total %= 160;
  const c = Math.floor(total / 20);  const r = total % 20;
  const parts: string[] = [];
  if (t) parts.push(`${t}t`);
  if (c) parts.push(`${c}c`);
  if (r) parts.push(`${r}r`);
  return parts.join(' · ');
}

/** Initials for avatar tiles. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Slugify a house name for use as an ID. */
export function houseIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^house\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `house-${Date.now()}`;
}

/** "House Du Hyre" → "DH", "House de la Montagne" → "dM". Used for tab + ribbon monograms.
 *  Preserves source casing so two-word lowercased prefixes like "de la" stay lowercase. */
export function monogramOf(name: string): string {
  const stripped = name.replace(/^House\s+/i, '').trim();
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] ?? '') + (words[1][0] ?? '');
}

/** Class names helper. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const cn = cx;
