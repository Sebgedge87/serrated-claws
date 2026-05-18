/** Shared utilities. */

/** Convert any string-form coin amount (e.g. "4 crowns", "18 r", "1 throne") to rings. */
export function parseCoinToRings(value: string | null | undefined): number {
  if (!value) return 0;
  const s = String(value).toLowerCase();
  const match = s.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (s.includes('throne')) return num * 160;
  if (s.includes('crown') || s.includes(' c')) return num * 20;
  return num;
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
