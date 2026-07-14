import { useState, useRef, useCallback, useEffect } from 'react';
import { Icons } from '@/components/Icons';
import { cx } from '@/lib/utils';
import { renderMarkdown } from '@/components/BardWorkEditor';
import { jsPDF } from 'jspdf';

interface Member { id: string; name: string }

interface Props {
  covenName: string;
  ritualName: string;
  initialScript: string;
  members: Member[];
  onSave: (script: string) => Promise<void>;
}

interface SlashCmd {
  key: string; label: string; description: string; hint: string;
  icon: React.ReactNode; category: string; value: string;
}

function buildCommands(members: Member[]): SlashCmd[] {
  const base: SlashCmd[] = [
    { key: 'text',     label: 'Text',           description: 'Plain paragraph',        hint: 'p',   icon: <span style={{ fontFamily: 'serif', fontSize: '13px', fontWeight: 700 }}>P</span>,    category: 'Blocks', value: '\n'      },
    { key: 'h1',       label: 'Heading 1',      description: 'Large section heading',   hint: '#',   icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800 }}>H1</span>,   category: 'Blocks', value: '\n# '    },
    { key: 'h2',       label: 'Heading 2',      description: 'Medium section heading',  hint: '##',  icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800 }}>H2</span>,   category: 'Blocks', value: '\n## '   },
    { key: 'h3',       label: 'Heading 3',      description: 'Small section heading',   hint: '###', icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800 }}>H3</span>,   category: 'Blocks', value: '\n### '  },
    { key: 'bullet',   label: 'Bulleted list',  description: 'Create a simple list',    hint: '-',   icon: <span style={{ fontSize: '16px' }}>•</span>,                                           category: 'Blocks', value: '\n- '    },
    { key: 'numbered', label: 'Numbered list',  description: 'Create a numbered list',  hint: '1.',  icon: <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700 }}>1.</span>,category: 'Blocks', value: '\n1. '   },
    { key: 'quote',    label: 'Quote',          description: 'Capture a quotation',     hint: '>',   icon: <span style={{ fontSize: '14px', fontStyle: 'italic', fontWeight: 700 }}>"</span>,    category: 'Blocks', value: '\n> '    },
    { key: 'hr',       label: 'Divider',        description: 'Visually divide sections',hint: '---', icon: <span style={{ fontSize: '12px' }}>—</span>,                                           category: 'Blocks', value: '\n---\n' },
    { key: 'stage',    label: 'Stage direction',description: 'Narrator / stage note',   hint: '**',  icon: <span style={{ fontSize: '11px' }}>📢</span>,                                           category: 'Ritual', value: '\n**[Stage] **' },
    { key: 'chant',    label: 'Chant',          description: 'Words spoken together',   hint: '>',   icon: <span style={{ fontSize: '11px' }}>🎵</span>,                                           category: 'Ritual', value: '\n> **All:** ' },
    { key: 'action',   label: 'Action',         description: 'Physical action to take', hint: '-',   icon: <span style={{ fontSize: '11px' }}>⚡</span>,                                           category: 'Ritual', value: '\n- *Action:* ' },
  ];
  const mentions: SlashCmd[] = members.map(m => ({
    key: `@${m.id}`, label: `@${m.name}`, description: `Assign action to ${m.name}`, hint: '@',
    icon: <span style={{ fontSize: '11px', color: '#a78bfa' }}>@</span>,
    category: 'Coven members', value: `@${m.name} `,
  }));
  return [...base, ...mentions];
}

function ToolbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick}
      className="w-7 h-7 rounded text-xs text-ink-100/70 hover:text-gold-300 hover:bg-gold-500/15 transition-colors flex items-center justify-center">
      {children}
    </button>
  );
}

export function RitualScriptEditor({ covenName, ritualName, initialScript, members, onSave }: Props) {
  const [content, setContent] = useState(initialScript);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const [menuSearch, setMenuSearch] = useState('');

  // @mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashStartPosRef = useRef<number>(-1);
  const mentionStartPosRef = useRef<number>(-1);
  const menuSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setContent(initialScript); setDirty(false); }, [initialScript]);

  const SLASH_COMMANDS = buildCommands(members);

  const filteredCmds = SLASH_COMMANDS.filter(c => {
    const q = (slashFilter || menuSearch).toLowerCase();
    return q === '' || c.key.includes(q) || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });
  const groupedCmds = filteredCmds.reduce<Record<string, SlashCmd[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd); return acc;
  }, {});

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
  );

  const insertAt = useCallback((before: string, after = '', placeholder = '') => {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    const insert = before + (sel || placeholder) + after;
    const next = ta.value.slice(0, start) + insert + ta.value.slice(end);
    setContent(next); setDirty(next !== initialScript);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.selectionStart = start + before.length;
      textareaRef.current.selectionEnd = start + before.length + (sel || placeholder).length;
      textareaRef.current.focus();
    });
  }, [initialScript]);

  const handleSlashCommand = useCallback((cmd: SlashCmd) => {
    const ta = textareaRef.current; if (!ta) return;
    if (slashStartPosRef.current < 0) return;
    const before = ta.value.slice(0, slashStartPosRef.current);
    const after = ta.value.slice(ta.selectionStart);
    const next = before + cmd.value + after;
    setContent(next); setDirty(next !== initialScript);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = slashStartPosRef.current + cmd.value.length;
      textareaRef.current.selectionStart = pos; textareaRef.current.selectionEnd = pos;
      textareaRef.current.focus();
    });
    setSlashMenuOpen(false); slashStartPosRef.current = -1;
  }, [initialScript]);

  function insertMentionMember(name: string) {
    const ta = textareaRef.current; if (!ta) return;
    const before = content.slice(0, mentionStartPosRef.current);
    const after = content.slice(ta.selectionStart);
    const next = before + `@${name} ` + after;
    setContent(next); setDirty(next !== initialScript);
    setMentionOpen(false); mentionStartPosRef.current = -1;
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = before.length + name.length + 2;
      textareaRef.current.selectionStart = pos; textareaRef.current.selectionEnd = pos;
      textareaRef.current.focus();
    });
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val); setDirty(val !== initialScript);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);

    // Slash command detection (start of line)
    const lineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.slice(lineStart);
    if (currentLine.startsWith('/')) {
      slashStartPosRef.current = lineStart;
      setSlashFilter(currentLine.slice(1));
      setSlashMenuOpen(true); setSlashIndex(0);
      setMentionOpen(false);
      return;
    } else {
      if (slashMenuOpen) { setSlashMenuOpen(false); slashStartPosRef.current = -1; }
    }

    // @mention detection
    const atMatch = before.match(/@([\w ]*)$/);
    if (atMatch) {
      mentionStartPosRef.current = before.lastIndexOf('@');
      setMentionQuery(atMatch[1]);
      setMentionOpen(true); setMentionIndex(0);
    } else {
      if (mentionOpen) { setMentionOpen(false); mentionStartPosRef.current = -1; }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionOpen && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredMembers.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMentionMember(filteredMembers[mentionIndex].name); return; }
      if (e.key === 'Escape') { setMentionOpen(false); return; }
    }
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filteredCmds.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (filteredCmds[slashIndex]) handleSlashCommand(filteredCmds[slashIndex]); return; }
      if (e.key === 'Escape') { setSlashMenuOpen(false); slashStartPosRef.current = -1; return; }
      if (e.key === ' ') { setSlashMenuOpen(false); slashStartPosRef.current = -1; return; }
    }
  }

  useEffect(() => {
    if (slashMenuOpen) { setMenuSearch(''); requestAnimationFrame(() => menuSearchRef.current?.focus()); }
  }, [slashMenuOpen]);

  useEffect(() => {
    if (!slashMenuOpen) return;
    const h = () => { setSlashMenuOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [slashMenuOpen]);

  async function save() {
    if (!dirty || busy) return;
    setBusy(true);
    try { await onSave(content); setDirty(false); } finally { setBusy(false); }
  }

  function exportPdf() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18; const lineH = 6; let y = 20;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(ritualName, margin, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(120, 100, 80);
    doc.text(`${covenName} · Ritual Script`, margin, y); y += 10;
    doc.setTextColor(30, 28, 24);
    for (const raw of content.split('\n')) {
      if (y > 270) { doc.addPage(); y = 20; }
      if (raw.trim() === '') { y += lineH * 0.5; continue; }
      const plain = raw.replace(/^#{1,3} /, '').replace(/^[*-] /, '• ').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
      const isHeading = /^#{1,3} /.test(raw);
      doc.setFont('helvetica', isHeading ? 'bold' : 'normal');
      doc.setFontSize(isHeading ? 11 : 10);
      const wrapped = doc.splitTextToSize(plain, pageW - margin * 2);
      doc.text(wrapped, margin, y); y += wrapped.length * lineH + (isHeading ? 2 : 0);
    }
    doc.save(`${ritualName.replace(/\s+/g, '_')}_script.pdf`);
  }

  // Render with @mention highlights
  function renderWithMentions(md: string): string {
    let html = renderMarkdown(md);
    const sorted = [...members].sort((a, b) => b.name.length - a.name.length);
    for (const m of sorted) {
      const esc = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(
        new RegExp(`@${esc}`, 'g'),
        `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;border-radius:3px;padding:0 3px;font-weight:600">@${m.name}</span>`
      );
    }
    return html;
  }

  return (
    <div className="mt-4 border-t border-gold-500/10 pt-4">
      {/* Header row */}
      <div className="flex items-center gap-2 px-1 mb-0" style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 8 }}>
        <span className="eyebrow text-[11px] text-ink-100/50 flex-1">Ritual Script</span>
        <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5">
          <button onClick={() => setPreview(false)} className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors', !preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}>Edit</button>
          <button onClick={() => setPreview(true)}  className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors',  preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}>Preview</button>
        </div>
        <button onClick={exportPdf} className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-ink-100/15 rounded hover:border-ink-100/30 transition-colors text-ink-100/50 hover:text-ink-100/80">
          <Icons.Download size={11} />PDF
        </button>
        {dirty && (
          <button onClick={save} disabled={busy} className="btn btn-primary btn-sm text-[11px] py-1 px-2.5">
            {busy ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      {!preview && (
        <div className="flex flex-wrap gap-0.5 items-center py-1.5 px-1" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <ToolbarBtn title="Bold (**text**)" onClick={() => insertAt('**', '**', 'bold')}><span className="font-bold text-sm">B</span></ToolbarBtn>
          <ToolbarBtn title="Italic (*text*)" onClick={() => insertAt('*', '*', 'italic')}><span className="italic text-sm">I</span></ToolbarBtn>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--line)' }} />
          <ToolbarBtn title="Heading 1" onClick={() => insertAt('\n# ', '', 'Heading')}>H1</ToolbarBtn>
          <ToolbarBtn title="Heading 2" onClick={() => insertAt('\n## ', '', 'Heading')}>H2</ToolbarBtn>
          <ToolbarBtn title="Heading 3" onClick={() => insertAt('\n### ', '', 'Heading')}>H3</ToolbarBtn>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--line)' }} />
          <ToolbarBtn title="Blockquote / chant" onClick={() => insertAt('\n> ', '', 'chant')}><span className="font-bold italic text-sm">"</span></ToolbarBtn>
          <ToolbarBtn title="Divider" onClick={() => insertAt('\n---\n')}>—</ToolbarBtn>
          <ToolbarBtn title="Bullet" onClick={() => insertAt('\n- ', '', 'item')}>•</ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => insertAt('\n1. ', '', 'item')}>1.</ToolbarBtn>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--line)' }} />
          <ToolbarBtn title="Stage direction" onClick={() => insertAt('\n**[', ']**', 'Stage')}><span style={{ fontSize: 11 }}>📢</span></ToolbarBtn>
          <ToolbarBtn title="All chant" onClick={() => insertAt('\n> **All:** ', '', 'words')}><span style={{ fontSize: 11 }}>🎵</span></ToolbarBtn>
          <ToolbarBtn title="Action" onClick={() => insertAt('\n- *Action:* ', '', 'do this')}><span style={{ fontSize: 11 }}>⚡</span></ToolbarBtn>
        </div>
      )}

      {/* Editor / Preview */}
      <div className="relative">
        {preview ? (
          <div
            className="px-1 py-3 text-sm text-ink-100/80 leading-relaxed"
            style={{ minHeight: 180 }}
            dangerouslySetInnerHTML={{ __html: renderWithMentions(content) || '<span style="color:rgba(232,230,227,0.25);font-style:italic">Nothing written yet.</span>' }}
          />
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={"Write the ritual script here…\n\nType / for commands · @ to mention a coven member\nTip: use /stage for stage directions, /chant for words spoken together"}
              className="w-full font-mono text-sm leading-relaxed bg-transparent outline-none resize-none pt-3 px-1"
              style={{ minHeight: 200, color: 'rgb(var(--ink-100))', border: 'none' }}
            />

            {/* Slash command menu */}
            {slashMenuOpen && (
              <div
                className="absolute left-0 top-0 z-20 w-80"
                style={{ background: 'rgb(20,18,14)', border: '1px solid var(--line-strong)', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.8)', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <Icons.Search size={13} style={{ color: 'rgb(var(--ink-300))', flexShrink: 0 }} />
                  <input
                    ref={menuSearchRef}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'rgb(var(--ink-100))' }}
                    placeholder="Filter…"
                    value={menuSearch}
                    onChange={e => { setMenuSearch(e.target.value); setSlashIndex(0); }}
                    onKeyDown={e => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filteredCmds.length - 1)); }
                      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); }
                      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (filteredCmds[slashIndex]) handleSlashCommand(filteredCmds[slashIndex]); }
                      if (e.key === 'Escape') { setSlashMenuOpen(false); slashStartPosRef.current = -1; textareaRef.current?.focus(); }
                    }}
                  />
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {filteredCmds.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: 'rgb(var(--ink-300))' }}>No results</div>
                  ) : Object.entries(groupedCmds).map(([category, cmds]) => {
                    const categoryStart = filteredCmds.indexOf(cmds[0]);
                    return (
                      <div key={category}>
                        <div className="px-3 pt-3 pb-1 eyebrow" style={{ fontSize: 10 }}>{category}</div>
                        {cmds.map((cmd, j) => {
                          const idx = categoryStart + j;
                          const active = idx === slashIndex;
                          return (
                            <button key={cmd.key}
                              className="w-full px-3 py-2 text-left flex items-center gap-3 transition-colors"
                              style={active ? { background: 'rgba(203,171,104,0.12)' } : undefined}
                              onMouseEnter={() => setSlashIndex(idx)}
                              onClick={() => handleSlashCommand(cmd)}
                            >
                              <div className="flex-shrink-0 flex items-center justify-center"
                                style={{ width: 28, height: 28, borderRadius: 5, background: active ? 'rgba(203,171,104,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? 'rgba(203,171,104,0.3)' : 'rgba(255,255,255,0.08)'}`, color: active ? 'var(--gold)' : 'rgb(var(--ink-100))' }}>
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium" style={{ color: active ? 'var(--gold)' : 'rgb(var(--ink-100))', lineHeight: 1.2 }}>{cmd.label}</div>
                                <div className="text-xs truncate mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>{cmd.description}</div>
                              </div>
                              <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgb(var(--ink-300))', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {cmd.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* @mention popup */}
            {mentionOpen && filteredMembers.length > 0 && (
              <div className="absolute left-0 top-0 z-20"
                style={{ background: 'rgb(20,18,14)', border: '1px solid var(--line-strong)', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: 180, overflow: 'hidden' }}>
                <div className="px-3 pt-2 pb-1 eyebrow" style={{ fontSize: 10 }}>Coven members</div>
                {filteredMembers.map((m, i) => (
                  <button key={m.id}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 transition-colors"
                    style={{ background: i === mentionIndex ? 'rgba(167,139,250,0.12)' : 'transparent' }}
                    onMouseEnter={() => setMentionIndex(i)}
                    onMouseDown={() => insertMentionMember(m.name)}
                  >
                    <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>@</span>
                    <span className="text-sm text-ink-100">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-[10px] text-ink-100/25 mt-1 px-1">
        / for commands · @ to mention · **bold** · *italic* · # heading · - bullet
      </p>
    </div>
  );
}
