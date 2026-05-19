import jsPDF from 'jspdf';
import type { LanceData, LanceEvent, CovenRitual } from './types';
import { formatIncome } from './utils';

// ── Palette ───────────────────────────────────────────────────────────────────
const PARCHMENT: [number, number, number] = [244, 234, 208];
const PARCHMENT_DARK: [number, number, number] = [228, 212, 175];
const INK: [number, number, number] = [38, 20, 10];
const INK_MID: [number, number, number] = [90, 55, 25];
const INK_LIGHT: [number, number, number] = [150, 110, 60];
const BORDER: [number, number, number] = [110, 70, 25];
const RULE: [number, number, number] = [165, 125, 68];
const SHORTFALL: [number, number, number] = [155, 45, 25];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const INNER = MARGIN + 4;
const CONTENT_W = PAGE_W - INNER * 2;

// ── Page background & border ──────────────────────────────────────────────────
function drawBackground(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Solid parchment base
  doc.setFillColor(...PARCHMENT);
  doc.rect(0, 0, w, h, 'F');

  // Subtle horizontal banding to simulate paper grain
  for (let y = 0; y < h; y += 14) {
    doc.setFillColor(...PARCHMENT_DARK);
    doc.rect(0, y, w, 1.2, 'F');
  }

  // Soft re-wash to blend bands
  doc.setFillColor(PARCHMENT[0], PARCHMENT[1], PARCHMENT[2]);
  doc.rect(0, 0, w, h, 'F'); // intentional - blends without opacity API

  // Outer border
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1.4);
  doc.setLineDashPattern([], 0);
  doc.rect(MARGIN, MARGIN, w - MARGIN * 2, h - MARGIN * 2);

  // Inner border
  doc.setLineWidth(0.3);
  doc.rect(MARGIN + 2.8, MARGIN + 2.8, w - (MARGIN + 2.8) * 2, h - (MARGIN + 2.8) * 2);

  // Corner ornaments — drawn as small crossed lines (no Unicode needed)
  const C = 3.5;
  const corners: [number, number][] = [
    [MARGIN + 1.4, MARGIN + 1.4],
    [w - MARGIN - 1.4, MARGIN + 1.4],
    [MARGIN + 1.4, h - MARGIN - 1.4],
    [w - MARGIN - 1.4, h - MARGIN - 1.4],
  ];
  doc.setLineWidth(0.8);
  for (const [cx, cy] of corners) {
    doc.line(cx - C, cy, cx + C, cy);
    doc.line(cx, cy - C, cx, cy + C);
  }
  doc.setLineDashPattern([], 0);
}

function newPage(doc: jsPDF) {
  doc.addPage();
  drawBackground(doc);
}

// ── Decorative rule with optional centred label ───────────────────────────────
function rule(doc: jsPDF, y: number, label?: string) {
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  if (label) {
    const lw = doc.getTextWidth(label) + 6;
    const cx = PAGE_W / 2;
    doc.line(INNER, y, cx - lw / 2, y);
    doc.line(cx + lw / 2, y, PAGE_W - INNER, y);
    doc.setTextColor(...INK_LIGHT);
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.text(label, cx, y, { align: 'center', baseline: 'middle' });
  } else {
    doc.line(INNER, y, PAGE_W - INNER, y);
  }
}

// ── Document title block ──────────────────────────────────────────────────────
function docTitle(doc: jsPDF, title: string, subtitle: string, y: number): number {
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.7);
  doc.line(INNER, y, PAGE_W - INNER, y);
  y += 1.8;
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);

  y += 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text(title, PAGE_W / 2, y, { align: 'center' });

  if (subtitle) {
    y += 7;
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK_MID);
    doc.text(subtitle, PAGE_W / 2, y, { align: 'center' });
  }

  y += 4;
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);
  y += 1.8;
  doc.setLineWidth(0.7);
  doc.line(INNER, y, PAGE_W - INNER, y);
  return y + 7;
}

// ── Section header ────────────────────────────────────────────────────────────
function sectionHeader(doc: jsPDF, label: string, y: number): number {
  rule(doc, y + 2.5, `— ${label} —`);
  return y + 10;
}

// ── Column types ──────────────────────────────────────────────────────────────
type Col = { label: string; x: number; w: number; align?: 'left' | 'right' };

function tableHeader(doc: jsPDF, cols: Col[], y: number): number {
  doc.setLineDashPattern([], 0);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK_MID);
  for (const col of cols) {
    doc.text(col.label, col.align === 'right' ? col.x + col.w : col.x, y, { align: col.align ?? 'left' });
  }
  y += 2;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);
  return y + 4.5;
}

function tableRow(
  doc: jsPDF,
  cols: { value: string; x: number; w: number; align?: 'left' | 'right'; color?: [number, number, number] }[],
  y: number,
  style: 'normal' | 'italic' | 'bold' = 'normal'
): number {
  doc.setLineDashPattern([], 0);
  doc.setFont('times', style);
  doc.setFontSize(9);
  for (const col of cols) {
    doc.setTextColor(...(col.color ?? INK));
    const text = doc.splitTextToSize(col.value, col.w - 1)[0] ?? '';
    doc.text(text, col.align === 'right' ? col.x + col.w : col.x, y, { align: col.align ?? 'left' });
  }
  doc.setTextColor(...INK);
  return y + 5.5;
}

function checkPage(doc: jsPDF, y: number, needed = 12): number {
  if (y + needed > PAGE_H - MARGIN - 10) { newPage(doc); return MARGIN + 14; }
  return y;
}

function footer(doc: jsPDF) {
  doc.setLineDashPattern([], 0);
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`The Serrated Claws  ·  ${new Date().toLocaleDateString('en-GB')}`, PAGE_W / 2, PAGE_H - MARGIN - 4, { align: 'center' });
}

// ── Roster PDF ────────────────────────────────────────────────────────────────
export async function exportRosterPdf(data: LanceData, nextEvent?: LanceEvent) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const eventName = nextEvent?.name ?? 'Event Roster';
  const dateRange = nextEvent
    ? nextEvent.end_date
      ? `${fmtDate(nextEvent.start_date)} – ${fmtDate(nextEvent.end_date)}`
      : fmtDate(nextEvent.start_date)
    : '';

  let y = docTitle(doc, eventName, dateRange, MARGIN + 8);

  const attending = data.members.filter(m => m.attending_event);
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`${attending.length} member${attending.length !== 1 ? 's' : ''} attending`, PAGE_W / 2, y, { align: 'center' });
  y += 9;

  const sorted = [...attending].sort((a, b) => {
    const fa = a.function ?? 'Unassigned'; const fb = b.function ?? 'Unassigned';
    return fa !== fb ? fa.localeCompare(fb) : a.name.localeCompare(b.name);
  });
  const groups: Record<string, typeof sorted> = {};
  for (const m of sorted) { const k = m.function ?? 'Unassigned'; (groups[k] ??= []).push(m); }

  // Columns fit within CONTENT_W (174mm): last col right-edge = INNER+174 = PAGE_W-INNER
  const COLS: Col[] = [
    { label: 'Character', x: INNER,       w: 37 },
    { label: 'Player',    x: INNER + 38,  w: 32 },
    { label: 'House',     x: INNER + 71,  w: 32 },
    { label: 'Rank',      x: INNER + 104, w: 25 },
    { label: 'Resource',  x: INNER + 130, w: 26 },
    { label: 'Income',    x: INNER + 157, w: 17, align: 'right' },
  ];

  for (const [fn, members] of Object.entries(groups)) {
    y = checkPage(doc, y, 22);
    y = sectionHeader(doc, fn, y);
    y = tableHeader(doc, COLS, y);
    for (const m of members) {
      y = checkPage(doc, y);
      const house = data.houses.find(h => h.id === m.house_id)?.name ?? '—';
      const income = formatIncome(m.rings_per_event, m.crowns_per_event, m.thrones_per_event) ?? '—';
      y = tableRow(doc, [
        { value: m.name,               ...COLS[0] },
        { value: m.player_name ?? '—', ...COLS[1] },
        { value: house,                ...COLS[2] },
        { value: m.rank ?? '—',   ...COLS[3] },
        { value: m.resource ?? '—', ...COLS[4] },
        { value: income,               ...COLS[5] },
      ], y);
    }
    y += 5;
  }

  footer(doc);
  doc.save(`roster-${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

// ── Resources PDF ─────────────────────────────────────────────────────────────
const CURRENCY_ITEMS = new Set(['Ring', 'Crown', 'Throne']);

export async function exportResourcesPdf(data: LanceData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  let y = docTitle(
    doc,
    'Event Resources',
    `Prepared ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    MARGIN + 8
  );

  // Treasury
  y = checkPage(doc, y, 16);
  y = sectionHeader(doc, 'Treasury', y);

  const invMap = Object.fromEntries(data.inventory.map(i => [i.item, i.current_qty]));
  const r = invMap['Ring'] ?? 0;
  const c = invMap['Crown'] ?? 0;
  const t = invMap['Throne'] ?? 0;
  const totalRings = r + c * 20 + t * 160;

  const FUND_COLS: Col[] = [
    { label: 'Denomination', x: INNER,      w: 60 },
    { label: 'In Stock',     x: INNER + 61, w: 30, align: 'right' },
  ];
  y = tableHeader(doc, FUND_COLS, y);
  for (const [denom, qty] of [['Rings', r], ['Crowns', c], ['Thrones', t]] as [string, number][]) {
    y = tableRow(doc, [{ value: denom, ...FUND_COLS[0] }, { value: String(qty), ...FUND_COLS[1] }], y);
  }
  // Total line
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(INNER, y - 1, INNER + 94, y - 1);
  y = tableRow(doc, [
    { value: 'Total in rings', x: INNER, w: 60 },
    { value: String(totalRings), x: INNER + 61, w: 30, align: 'right' },
  ], y, 'bold');
  y += 6;

  // Inventory — exclude currency items already shown in treasury
  const invItems = data.inventory.filter(i =>
    !CURRENCY_ITEMS.has(i.item) && (i.current_qty > 0 || i.required_qty > 0)
  );

  if (invItems.length > 0) {
    y = checkPage(doc, y, 22);
    y = sectionHeader(doc, 'Inventory', y);

    const INV_COLS: Col[] = [
      { label: 'Item',      x: INNER,       w: 75 },
      { label: 'In Stock',  x: INNER + 76,  w: 25, align: 'right' },
      { label: 'Required',  x: INNER + 103, w: 25, align: 'right' },
      { label: 'Shortfall', x: INNER + 130, w: 25, align: 'right' },
    ];
    y = tableHeader(doc, INV_COLS, y);

    for (const item of invItems) {
      y = checkPage(doc, y);
      const shortfall = Math.max(0, item.required_qty - item.current_qty);
      y = tableRow(doc, [
        { value: item.item,                 ...INV_COLS[0] },
        { value: String(item.current_qty),  ...INV_COLS[1] },
        { value: String(item.required_qty), ...INV_COLS[2] },
        { value: shortfall > 0 ? String(shortfall) : '—', ...INV_COLS[3], color: shortfall > 0 ? SHORTFALL : undefined },
      ], y);
    }
  }

  footer(doc);
  doc.save(`resources-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Rituals PDF ───────────────────────────────────────────────────────────────
export async function exportRitualsPdf(
  covenName: string,
  domain: string | null,
  rituals: CovenRitual[],
  manaAvailable: number
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  const subtitle = domain ? `${domain} Coven` : 'Coven Ritual Register';
  let y = docTitle(doc, covenName, subtitle, MARGIN + 8);

  const totalRequired = rituals.reduce((s, r) => s + r.magnitude, 0);
  const surplus = manaAvailable - totalRequired;
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK_MID);
  const manaLine = `${rituals.length} ritual${rituals.length !== 1 ? 's' : ''}  ·  Required: ${totalRequired} mana  ·  Have: ${manaAvailable}  ·  ${surplus >= 0 ? 'Surplus' : 'Shortfall'}: ${Math.abs(surplus)}`;
  doc.text(manaLine, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  if (rituals.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...INK_LIGHT);
    doc.text('No rituals recorded.', PAGE_W / 2, y + 10, { align: 'center' });
    footer(doc);
    doc.save(`rituals-${covenName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
    return;
  }

  for (const r of rituals) {
    const wordingLines = r.wording ? doc.splitTextToSize(r.wording, CONTENT_W - 22) : [];
    const wordingTextH = wordingLines.length > 0 ? wordingLines.length * 5 + 2 : 0;
    const boxH = Math.max(28, wordingTextH + 14);
    y = checkPage(doc, y, 22 + boxH);

    // Ritual header row
    doc.setLineDashPattern([], 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(r.ritual_name, INNER, y);

    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_MID);
    if (r.realm) doc.text(r.realm, INNER + 100, y);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(String(r.magnitude), PAGE_W - INNER, y, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(...INK_LIGHT);
    doc.text('mag', PAGE_W - INNER - 10, y + 0.5);

    y += 2;
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.15);
    doc.line(INNER, y, PAGE_W - INNER, y);
    y += 3;

    if (r.notes) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...INK_LIGHT);
      doc.text(r.notes, INNER, y);
      y += 5;
    }

    // Wording box
    const boxTop = y;
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.setFillColor(PARCHMENT[0] - 6, PARCHMENT[1] - 6, PARCHMENT[2] - 6);
    doc.rect(INNER, boxTop, CONTENT_W, boxH, 'FD');

    // "Wording:" label
    doc.setFont('times', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...INK_LIGHT);
    doc.text('Wording:', INNER + 2.5, boxTop + 5);

    if (wordingLines.length > 0) {
      // Print saved wording
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      let ly = boxTop + 10;
      for (const line of wordingLines) {
        doc.text(line, INNER + 20, ly);
        ly += 5;
      }
    } else {
      // Blank dotted writing lines
      doc.setLineDashPattern([1.5, 2.5], 0);
      doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
      doc.setLineWidth(0.12);
      for (let ly = boxTop + 10; ly < boxTop + boxH - 4; ly += 6) {
        doc.line(INNER + 20, ly, PAGE_W - INNER - 3, ly);
      }
      doc.setLineDashPattern([], 0);
    }

    y = boxTop + boxH + 6;
  }

  footer(doc);
  doc.save(`rituals-${covenName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}
