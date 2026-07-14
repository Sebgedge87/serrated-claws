import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Icons } from '@/components/Icons';

interface Member {
  id: string;
  name: string;
}

interface Props {
  covenName: string;
  ritualName: string;
  initialScript: string;
  members: Member[];
  onSave: (script: string) => Promise<void>;
}

// Render markdown-like text with @mentions highlighted.
// Supports: **bold**, *italic*, # headings, - bullet, blank line = paragraph break, @Name highlight
function renderScript(text: string, members: Member[]): string {
  const memberNames = members.map(m => m.name);

  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (const raw of lines) {
    let line = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    if (line.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3 style="font-size:1rem;font-weight:700;margin:1em 0 0.25em">${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h2 style="font-size:1.15rem;font-weight:700;margin:1em 0 0.25em">${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h1 style="font-size:1.3rem;font-weight:700;margin:1em 0 0.3em">${line.slice(2)}</h1>`);
      continue;
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { htmlLines.push('<ul style="margin:0.25em 0 0.25em 1.25em;padding:0">'); inList = true; }
      let content = line.slice(2);
      content = applyInline(content, memberNames);
      htmlLines.push(`<li style="margin:0.1em 0">${content}</li>`);
      continue;
    }

    if (inList) { htmlLines.push('</ul>'); inList = false; }

    if (line.trim() === '') {
      htmlLines.push('<br/>');
      continue;
    }

    line = applyInline(line, memberNames);
    htmlLines.push(`<p style="margin:0.1em 0">${line}</p>`);
  }
  if (inList) htmlLines.push('</ul>');
  return htmlLines.join('');
}

function applyInline(text: string, memberNames: string[]): string {
  // Bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // @mention — match @followed by a member name (sorted longest first to avoid partial matches)
  const sorted = [...memberNames].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(
      new RegExp(`@${escaped}`, 'g'),
      `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;border-radius:3px;padding:0 3px;font-weight:600">@${name}</span>`
    );
  }
  // Any remaining unmatched @word
  text = text.replace(/@(\w[\w\s]*)/g, '<span style="color:#a78bfa">@$1</span>');
  return text;
}

export function RitualScriptEditor({ covenName, ritualName, initialScript, members, onSave }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [script, setScript] = useState(initialScript);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mention, setMention] = useState<{ query: string; top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setScript(initialScript); setDirty(false); }, [initialScript]);

  async function save() {
    if (!dirty || busy) return;
    setBusy(true);
    try { await onSave(script); setDirty(false); } finally { setBusy(false); }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setScript(val);
    setDirty(val !== initialScript);

    // Detect @ trigger for mention popup
    const pos = e.target.selectionStart ?? 0;
    const before = val.slice(0, pos);
    const atMatch = before.match(/@([\w ]*)$/);
    if (atMatch) {
      const textarea = textareaRef.current!;
      const rect = textarea.getBoundingClientRect();
      // Approximate position — place below textarea for simplicity
      setMention({ query: atMatch[1], top: rect.bottom + 4, left: rect.left + 12 });
    } else {
      setMention(null);
    }
  }

  function insertMention(name: string) {
    const ta = textareaRef.current!;
    const pos = ta.selectionStart ?? 0;
    const before = script.slice(0, pos);
    const after = script.slice(pos);
    const atIdx = before.lastIndexOf('@');
    const newScript = before.slice(0, atIdx) + `@${name}` + after;
    setScript(newScript);
    setDirty(newScript !== initialScript);
    setMention(null);
    setTimeout(() => {
      ta.focus();
      const newPos = atIdx + name.length + 1;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }

  const filteredMembers = mention
    ? members.filter(m => m.name.toLowerCase().startsWith(mention.query.toLowerCase()))
    : [];

  async function exportPdf() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const lineH = 6;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(ritualName, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 100, 80);
    doc.text(`${covenName} — Ritual Script`, margin, y);
    y += 10;
    doc.setTextColor(30, 28, 24);

    const lines = script.split('\n');
    for (const raw of lines) {
      if (y > 270) { doc.addPage(); y = 20; }
      if (raw.trim() === '') { y += lineH * 0.5; continue; }

      // Strip markdown syntax for plain PDF
      const plain = raw
        .replace(/^#{1,3} /, '')
        .replace(/^[*-] /, '• ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1');

      const isHeading = /^#{1,3} /.test(raw);
      if (isHeading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }

      const wrapped = doc.splitTextToSize(plain, pageW - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineH + (isHeading ? 2 : 0);
    }

    doc.save(`${ritualName.replace(/\s+/g, '_')}_script.pdf`);
  }

  const rendered = renderScript(script, members);

  return (
    <div className="mt-4 border-t border-gold-500/10 pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow text-[11px] text-ink-100/50">Ritual Script</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-ink-100/10">
            <button
              onClick={() => setMode('edit')}
              className="px-2.5 py-1 text-[11px] transition-colors"
              style={{ background: mode === 'edit' ? 'rgba(201,169,97,0.15)' : 'transparent', color: mode === 'edit' ? 'var(--gold)' : 'rgba(232,230,227,0.4)' }}
            >Edit</button>
            <button
              onClick={() => setMode('preview')}
              className="px-2.5 py-1 text-[11px] transition-colors"
              style={{ background: mode === 'preview' ? 'rgba(201,169,97,0.15)' : 'transparent', color: mode === 'preview' ? 'var(--gold)' : 'rgba(232,230,227,0.4)' }}
            >Preview</button>
          </div>
          <button onClick={exportPdf} className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-ink-100/15 rounded hover:border-ink-100/30 transition-colors text-ink-100/50 hover:text-ink-100/80">
            <Icons.Download size={11} />
            PDF
          </button>
          {dirty && (
            <button onClick={save} disabled={busy} className="btn btn-primary btn-sm text-[11px] py-1 px-2.5">
              {busy ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={script}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setMention(null), 150)}
            placeholder={`Write the ritual script here…\n\nUse **bold**, *italic*, # headings, - bullets\nType @${members[0]?.name ?? 'MemberName'} to assign actions to coven members`}
            className="input w-full font-mono text-sm leading-relaxed resize-none"
            style={{ minHeight: '220px', background: 'rgb(var(--ink-900))', padding: '12px' }}
          />
          {mention && filteredMembers.length > 0 && (
            <div
              className="fixed z-50 rounded border shadow-xl"
              style={{ top: mention.top, left: mention.left, background: 'rgb(20,18,14)', border: '1px solid var(--line-strong)', minWidth: 160 }}
            >
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  onMouseDown={() => insertMention(m.name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                >
                  <span style={{ color: '#a78bfa' }}>@</span>
                  <span className="text-ink-100">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={previewRef}
          className="rounded border p-4 text-sm text-ink-100/80 leading-relaxed"
          style={{ background: 'rgb(var(--ink-900))', border: '1px solid var(--line)', minHeight: '120px' }}
          dangerouslySetInnerHTML={{ __html: rendered || '<span style="color:rgba(232,230,227,0.3)">Nothing written yet.</span>' }}
        />
      )}

      <p className="text-[10px] text-ink-100/25 mt-1">
        Supports **bold**, *italic*, # headings, - bullets · Type @ to mention a coven member
      </p>
    </div>
  );
}
