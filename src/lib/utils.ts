/** Shared utilities. */

/** Total income in rings from structured currency fields. */
export function memberIncomeRings(rings: number | null, crowns: number | null, thrones: number | null): number {
  return (rings ?? 0) + (crowns ?? 0) * 20 + (thrones ?? 0) * 160;
}

/** Format income fields as a compact string, e.g. "1t · 2c · 18r". Returns null if all zero. */
export function formatIncome(rings: number | null, crowns: number | null, thrones: number | null): string | null {
  const parts: string[] = [];
  if (thrones) parts.push(`${thrones}t`);
  if (crowns) parts.push(`${crowns}c`);
  if (rings) parts.push(`${rings}r`);
  return parts.length ? parts.join(' · ') : null;
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

/** Class names helper. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const cn = cx;
