import jsPDF from 'jspdf';
import type { LanceData, LanceEvent } from './types';
import { memberIncomeRings, formatIncome } from './utils';
import type { CovenRitual } from './types';

// ── Palette ───────────────────────────────────────────────────────────────────
const PARCHMENT: [number, number, number] = [244, 234, 208];
const PARCHMENT_DARK: [number, number, number] = [230, 215, 180];
const INK: [number, number, number] = [38, 20, 10];
const INK_MID: [number, number, number] = [90, 55, 25];
const INK_LIGHT: [number, number, number] = [140, 100, 55];
const BORDER: [number, number, number] = [110, 70, 25];
const RULE: [number, number, number] = [160, 120, 65];

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const INNER = MARGIN + 3;
const CONTENT_W = PAGE_W - INNER * 2;

// ── Page utilities ─────────────────────────────────────────────────────────────
function drawBackground(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Parchment fill
  doc.setFillColor(...PARCHMENT);
  doc.rect(0, 0, w, h, 'F');

  // Subtle aged bands — simulates uneven paper
  doc.setFillColor(...PARCHMENT_DARK);
  for (let y = 0; y < h; y += 18) {
    doc.setFillColor(PARCHMENT_DARK[0], PARCHMENT_DARK[1] + (y % 36 === 0 ? 8 : 0), PARCHMENT_DARK[2]);
    doc.rect(0, y, w, 3, 'F');
  }
  // Re-fill to blend bands (low opacity trick via layering)
  doc.setFillColor(PARCHMENT[0], PARCHMENT[1], PARCHMENT[2]);
  doc.setGState(doc.GState({ opacity: 0.88 }));
  doc.rect(0, 0, w, h, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Outer border — double line
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1.2);
  doc.rect(MARGIN, MARGIN, w - MARGIN * 2, h - MARGIN * 2);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN + 2.5, MARGIN + 2.5, w - (MARGIN + 2.5) * 2, h - (MARGIN + 2.5) * 2);

  // Corner ornaments
  const corners: [number, number][] = [
    [MARGIN + 1, MARGIN + 1],
    [w - MARGIN - 1, MARGIN + 1],
    [MARGIN + 1, h - MARGIN - 1],
    [w - MARGIN - 1, h - MARGIN - 1],
  ];
  doc.setFontSize(8);
  doc.setTextColor(...BORDER);
  for (const [x, y] of corners) {
    doc.text('✦', x, y, { align: 'center', baseline: 'middle' });
  }
}

function newPage(doc: jsPDF) {
  doc.addPage();
  drawBackground(doc);
}

function rule(doc: jsPDF, y: number, label?: string) {
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  if (label) {
    const lw = doc.getTextWidth(label) + 4;
    const cx = PAGE_W / 2;
    doc.line(INNER, y, cx - lw / 2, y);
    doc.line(cx + lw / 2, y, PAGE_W - INNER, y);
    doc.setTextColor(...INK_LIGHT);
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.text(label, cx, y, { align: 'center', baseline: 'middle' });
  } else {
    doc.line(INNER, y, PAGE_W - INNER, y);
  }
}

function docTitle(doc: jsPDF, title: string, subtitle: string, y: number): number {
  // Decorative top rule
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(INNER, y, PAGE_W - INNER, y);
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);

  // Title
  y += 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(title, PAGE_W / 2, y, { align: 'center' });

  // Subtitle
  if (subtitle) {
    y += 7;
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...INK_MID);
    doc.text(subtitle, PAGE_W / 2, y, { align: 'center' });
  }

  y += 5;
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);
  y += 2;
  doc.setLineWidth(0.6);
  doc.line(INNER, y, PAGE_W - INNER, y);
  return y + 6;
}

function sectionHeader(doc: jsPDF, label: string, y: number): number {
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  rule(doc, y + 2, `— ${label} —`);
  return y + 9;
}

function tableHeader(doc: jsPDF, cols: { label: string; x: number; w: number; align?: 'left' | 'right' }[], y: number): number {
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK_MID);
  for (const col of cols) {
    doc.text(col.label, col.align === 'right' ? col.x + col.w : col.x, y, { align: col.align ?? 'left' });
  }
  y += 1.5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(INNER, y, PAGE_W - INNER, y);
  return y + 4;
}

function tableRow(doc: jsPDF, cols: { value: string; x: number; w: number; align?: 'left' | 'right' }[], y: number, italic = false): number {
  doc.setFont('times', italic ? 'italic' : 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  for (const col of cols) {
    const txt = doc.splitTextToSize(col.value, col.w);
    doc.text(txt[0] ?? '', col.align === 'right' ? col.x + col.w : col.x, y, { align: col.align ?? 'left' });
  }
  return y + 5.5;
}

function checkPage(doc: jsPDF, y: number, needed = 12): number {
  if (y + needed > PAGE_H - MARGIN - 8) {
    newPage(doc);
    return MARGIN + 12;
  }
  return y;
}

// ── Roster PDF ────────────────────────────────────────────────────────────────
export async function exportRosterPdf(data: LanceData, nextEvent?: LanceEvent) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const eventName = nextEvent?.name ?? 'Event Roster';
  const dateRange = nextEvent
    ? nextEvent.end_date
      ? `${fmtDate(nextEvent.start_date)} – ${fmtDate(nextEvent.end_date)}`
      : fmtDate(nextEvent.start_date)
    : '';

  let y = docTitle(doc, eventName, dateRange, MARGIN + 8);

  // Subtitle: attending count
  const attending = data.members.filter(m => m.attending_event);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`${attending.length} member${attending.length !== 1 ? 's' : ''} attending`, PAGE_W / 2, y, { align: 'center' });
  y += 8;

  // Group by function
  const sorted = [...attending].sort((a, b) => {
    const fa = a.function ?? 'Unassigned'; const fb = b.function ?? 'Unassigned';
    return fa !== fb ? fa.localeCompare(fb) : a.name.localeCompare(b.name);
  });
  const groups: Record<string, typeof sorted> = {};
  for (const m of sorted) { const k = m.function ?? 'Unassigned'; (groups[k] ??= []).push(m); }

  const COLS = [
    { label: 'Character',  x: INNER,       w: 38 },
    { label: 'Player',     x: INNER + 40,  w: 32 },
    { label: 'House',      x: INNER + 74,  w: 30 },
    { label: 'Rank',       x: INNER + 106, w: 28 },
    { label: 'Resource',   x: INNER + 136, w: 24 },
    { label: 'Income',     x: INNER + 155, w: 16, align: 'right' as const },
    { label: 'Tithe',      x: INNER + 173, w: 14, align: 'right' as const },
  ];

  for (const [fn, members] of Object.entries(groups)) {
    y = checkPage(doc, y, 20);
    y = sectionHeader(doc, fn, y);
    y = tableHeader(doc, COLS, y);

    for (const m of members) {
      y = checkPage(doc, y);
      const house = data.houses.find(h => h.id === m.house_id)?.name ?? '—';
      const rings = memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event);
      const income = formatIncome(m.rings_per_event, m.crowns_per_event, m.thrones_per_event) ?? '—';
      const tithe = rings > 0 ? `${Math.round(rings * 0.1)}r` : '—';
      y = tableRow(doc, [
        { value: m.name,            ...COLS[0] },
        { value: m.player_name ?? '—', ...COLS[1] },
        { value: house,             ...COLS[2] },
        { value: m.rank ?? '—',    ...COLS[3] },
        { value: m.resource ?? '—',...COLS[4] },
        { value: income,            ...COLS[5] },
        { value: tithe,             ...COLS[6] },
      ], y);
    }
    y += 4;
  }

  // Footer
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`The Serrated Claws · ${new Date().toLocaleDateString('en-GB')}`, PAGE_W / 2, PAGE_H - MARGIN - 4, { align: 'center' });

  doc.save(`roster-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ── Resources PDF ─────────────────────────────────────────────────────────────
export async function exportResourcesPdf(data: LanceData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  let y = docTitle(doc, 'Event Resources', `Prepared ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN + 8);

  // ── Funds ──
  y = checkPage(doc, y, 16);
  y = sectionHeader(doc, 'Treasury', y);

  const invMap = Object.fromEntries(data.inventory.map(i => [i.item, i.current_qty]));
  const r = invMap['Ring'] ?? 0;
  const c = invMap['Crown'] ?? 0;
  const t = invMap['Throne'] ?? 0;
  const totalRings = r + c * 20 + t * 160;

  const FUND_COLS = [
    { label: 'Denomination', x: INNER,       w: 60 },
    { label: 'In Stock',     x: INNER + 62,  w: 30, align: 'right' as const },
  ];
  y = tableHeader(doc, FUND_COLS, y);
  for (const [denom, qty] of [['Rings', r], ['Crowns', c], ['Thrones', t]] as [string, number][]) {
    y = tableRow(doc, [{ value: denom, ...FUND_COLS[0] }, { value: String(qty), ...FUND_COLS[1] }], y);
  }
  // Separator + total
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(INNER, y - 1, INNER + 95, y - 1);
  y = tableRow(doc, [
    { value: 'Total (in rings)', x: INNER, w: 60 },
    { value: String(totalRings), x: INNER + 62, w: 30, align: 'right' as const },
  ], y, true);
  y += 5;

  // ── Inventory ──
  const invItems = data.inventory.filter(i => i.current_qty > 0 || i.required_qty > 0);
  if (invItems.length > 0) {
    y = checkPage(doc, y, 20);
    y = sectionHeader(doc, 'Inventory', y);

    const INV_COLS = [
      { label: 'Item',      x: INNER,       w: 70 },
      { label: 'In Stock',  x: INNER + 72,  w: 22, align: 'right' as const },
      { label: 'Required',  x: INNER + 96,  w: 22, align: 'right' as const },
      { label: 'Shortfall', x: INNER + 120, w: 22, align: 'right' as const },
    ];
    y = tableHeader(doc, INV_COLS, y);

    for (const item of invItems) {
      y = checkPage(doc, y);
      const shortfall = Math.max(0, item.required_qty - item.current_qty);
      if (shortfall > 0) {
        // Highlight shortfalls in a slightly warmer ink
        doc.setTextColor(160, 50, 30);
      }
      y = tableRow(doc, [
        { value: item.item,              ...INV_COLS[0] },
        { value: String(item.current_qty), ...INV_COLS[1] },
        { value: String(item.required_qty), ...INV_COLS[2] },
        { value: shortfall > 0 ? String(shortfall) : '—', ...INV_COLS[3] },
      ], y);
      doc.setTextColor(...INK);
    }
  }

  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`The Serrated Claws · ${new Date().toLocaleDateString('en-GB')}`, PAGE_W / 2, PAGE_H - MARGIN - 4, { align: 'center' });

  doc.save(`resources-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Rituals PDF ───────────────────────────────────────────────────────────────
export async function exportRitualsPdf(covenName: string, domain: string | null, rituals: CovenRitual[], manaAvailable: number) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawBackground(doc);

  const subtitle = domain ? `${domain} Coven` : 'Coven Ritual Register';
  let y = docTitle(doc, covenName, subtitle, MARGIN + 8);

  // Mana summary
  const totalRequired = rituals.reduce((s, r) => s + r.magnitude, 0);
  const surplus = manaAvailable - totalRequired;
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK_MID);
  doc.text(
    `${rituals.length} ritual${rituals.length !== 1 ? 's' : ''} · Required: ${totalRequired} mana · Have: ${manaAvailable} · ${surplus >= 0 ? 'Surplus' : 'Shortfall'}: ${Math.abs(surplus)}`,
    PAGE_W / 2, y, { align: 'center' }
  );
  y += 8;

  const COLS = [
    { label: 'Ritual',    x: INNER,       w: 70 },
    { label: 'Realm',     x: INNER + 72,  w: 28 },
    { label: 'Mag.',      x: INNER + 102, w: 14, align: 'right' as const },
    { label: 'Notes',     x: INNER + 118, w: 68 },
  ];

  y = tableHeader(doc, COLS, y);

  for (const r of rituals) {
    y = checkPage(doc, y, 32);

    // Ritual name + realm + magnitude row
    y = tableRow(doc, [
      { value: r.ritual_name,        ...COLS[0] },
      { value: r.realm ?? '—',       ...COLS[1] },
      { value: String(r.magnitude),  ...COLS[2] },
      { value: r.notes ?? '',        ...COLS[3] },
    ], y);

    // Wording box — dotted lines for the coven leader to write on
    const boxTop = y;
    const boxH = 22;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.15);
    doc.rect(INNER, boxTop, CONTENT_W, boxH);

    // Label
    doc.setFont('times', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...INK_LIGHT);
    doc.text('Wording:', INNER + 2, boxTop + 4);

    // Dotted writing lines inside box
    doc.setDrawColor(180, 150, 100);
    doc.setLineWidth(0.1);
    for (let ly = boxTop + 7; ly < boxTop + boxH - 2; ly += 5) {
      doc.setLineDashPattern([1, 2], 0);
      doc.line(INNER + 18, ly, INNER + CONTENT_W - 2, ly);
    }
    doc.setLineDashPattern([], 0);

    y = boxTop + boxH + 4;
  }

  if (rituals.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...INK_LIGHT);
    doc.text('No rituals recorded.', PAGE_W / 2, y + 8, { align: 'center' });
  }

  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_LIGHT);
  doc.text(`The Serrated Claws · ${new Date().toLocaleDateString('en-GB')}`, PAGE_W / 2, PAGE_H - MARGIN - 4, { align: 'center' });

  doc.save(`rituals-${covenName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
