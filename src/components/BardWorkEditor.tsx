import { useState, useRef, useCallback, useEffect } from 'react';
import type { BardWork } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { cx } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type WorkType = BardWork['work_type'];

interface Props {
  initial?: BardWork | null;
  lanceId: string;
  houseId: string;
  authorMemberId: string;
  onSave: (work: Omit<BardWork, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

interface SlashCmd {
  key: string;
  label: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
  category: string;
  action: 'insert' | 'type';
  value: string;
}

const SLASH_COMMANDS: SlashCmd[] = [
  { key: 'text',     label: 'Text',          description: 'Plain paragraph',       hint: 'p',    icon: <span style={{ fontFamily: 'serif', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>P</span>,     category: 'Basic blocks', action: 'insert', value: '\n'      },
  { key: 'h1',       label: 'Heading 1',     description: 'Large section heading',  hint: '#',    icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>H1</span>,    category: 'Basic blocks', action: 'insert', value: '\n# '    },
  { key: 'h2',       label: 'Heading 2',     description: 'Medium section heading', hint: '##',   icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>H2</span>,    category: 'Basic blocks', action: 'insert', value: '\n## '   },
  { key: 'h3',       label: 'Heading 3',     description: 'Small section heading',  hint: '###',  icon: <span style={{ fontFamily: 'serif', fontSize: '11px', fontWeight: 800, lineHeight: 1 }}>H3</span>,    category: 'Basic blocks', action: 'insert', value: '\n### '  },
  { key: 'bullet',   label: 'Bulleted list', description: 'Create a simple list',   hint: '-',    icon: <span style={{ fontSize: '16px', lineHeight: 1 }}>•</span>,                                            category: 'Basic blocks', action: 'insert', value: '\n- '    },
  { key: 'numbered', label: 'Numbered list', description: 'Create a numbered list', hint: '1.',   icon: <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>1.</span>, category: 'Basic blocks', action: 'insert', value: '\n1. '   },
  { key: 'quote',    label: 'Quote',         description: 'Capture a quotation',    hint: '>',    icon: <span style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1, fontStyle: 'italic' }}>"</span>,      category: 'Basic blocks', action: 'insert', value: '\n> '    },
  { key: 'hr',       label: 'Divider',       description: 'Visually divide sections', hint: '---', icon: <span style={{ fontSize: '12px', lineHeight: 1 }}>—</span>,                                          category: 'Basic blocks', action: 'insert', value: '\n---\n' },
  { key: 'story',    label: 'Story',         description: 'Set work type to Story', hint: 'type', icon: <span style={{ fontSize: '11px', lineHeight: 1 }}>📖</span>,                                           category: 'Work type',    action: 'type',   value: 'story'   },
  { key: 'feat',     label: 'Feat',          description: 'Set work type to Feat',  hint: 'type', icon: <span style={{ fontSize: '11px', lineHeight: 1 }}>⚔️</span>,                                           category: 'Work type',    action: 'type',   value: 'feat'    },
  { key: 'song',     label: 'Song',          description: 'Set work type to Song',  hint: 'type', icon: <span style={{ fontSize: '11px', lineHeight: 1 }}>🎵</span>,                                           category: 'Work type',    action: 'type',   value: 'song'    },
  { key: 'poem',     label: 'Poem',          description: 'Set work type to Poem',  hint: 'type', icon: <span style={{ fontSize: '11px', lineHeight: 1 }}>✦</span>,                                            category: 'Work type',    action: 'type',   value: 'poem'    },
];

const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: 'story', label: 'Story' },
  { value: 'feat',  label: 'Feat'  },
  { value: 'song',  label: 'Song'  },
  { value: 'poem',  label: 'Poem'  },
  { value: 'other', label: 'Other' },
];

// ── Simple markdown renderer ───────────────────────────────────────────────────

export function renderMarkdown(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  const inlineFormat = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>');

  for (const raw of lines) {
    const line = raw;

    // HR
    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid rgba(201,169,97,0.4);margin:1em 0" />');
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    if (h3) { closeList(); out.push(`<h3 style="font-size:1.1em;font-weight:700;margin:1em 0 0.3em">${inlineFormat(h3[1])}</h3>`); continue; }
    const h2 = line.match(/^## (.+)/);
    if (h2) { closeList(); out.push(`<h2 style="font-size:1.3em;font-weight:700;margin:1.2em 0 0.4em">${inlineFormat(h2[1])}</h2>`); continue; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { closeList(); out.push(`<h1 style="font-size:1.6em;font-weight:800;margin:1.4em 0 0.5em">${inlineFormat(h1[1])}</h1>`); continue; }

    // Blockquote
    const bq = line.match(/^&gt; (.+)/);
    if (bq) {
      closeList();
      out.push(`<blockquote style="border-left:3px solid rgba(201,169,97,0.5);padding-left:1em;margin:0.8em 0;color:rgba(255,255,255,0.7);font-style:italic">${inlineFormat(bq[1])}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = line.match(/^- (.+)/);
    if (ul) {
      if (!inUl) { closeList(); out.push('<ul style="margin:0.5em 0;padding-left:1.5em">'); inUl = true; }
      out.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\. (.+)/);
    if (ol) {
      if (!inOl) { closeList(); out.push('<ol style="margin:0.5em 0;padding-left:1.5em">'); inOl = true; }
      out.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    closeList();

    if (line.trim() === '') {
      out.push('<p style="margin:0.6em 0"> </p>');
    } else {
      out.push(`<p style="margin:0.5em 0;line-height:1.7">${inlineFormat(line)}</p>`);
    }
  }

  closeList();
  return out.join('');
}

// ── Editor component ──────────────────────────────────────────────────────────

export function BardWorkEditor({ initial, lanceId, houseId, authorMemberId, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [workType, setWorkType] = useState<WorkType>(initial?.work_type ?? 'story');
  const [content, setContent] = useState(initial?.content ?? '');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashStartPosRef = useRef<number>(-1);

  const [menuSearch, setMenuSearch] = useState('');
  const menuSearchRef = useRef<HTMLInputElement>(null);

  const filteredCmds = SLASH_COMMANDS.filter(c => {
    const q = (slashFilter || menuSearch).toLowerCase();
    return q === '' || c.key.includes(q) || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const groupedCmds = filteredCmds.reduce<Record<string, SlashCmd[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  // Toolbar insert helpers
  const insertAt = useCallback((before: string, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    const insert = before + (sel || placeholder) + after;
    const next = ta.value.slice(0, start) + insert + ta.value.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = start + before.length + (sel || placeholder).length;
      textareaRef.current.selectionStart = start + before.length;
      textareaRef.current.selectionEnd = pos;
      textareaRef.current.focus();
    });
  }, []);

  const handleSlashCommand = useCallback((cmd: SlashCmd) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const currentContent = ta.value;
    if (cmd.action === 'type') {
      setWorkType(cmd.value as WorkType);
      if (slashStartPosRef.current >= 0) {
        const before = currentContent.slice(0, slashStartPosRef.current);
        const after = currentContent.slice(ta.selectionStart);
        setContent(before + after);
      }
    } else {
      if (slashStartPosRef.current < 0) return;
      const before = currentContent.slice(0, slashStartPosRef.current);
      const after = currentContent.slice(ta.selectionStart);
      const next = before + cmd.value + after;
      setContent(next);
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const pos = slashStartPosRef.current + cmd.value.length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      });
    }
    setSlashMenuOpen(false);
    slashStartPosRef.current = -1;
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(i => Math.min(i + 1, filteredCmds.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredCmds[slashIndex]) handleSlashCommand(filteredCmds[slashIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setSlashMenuOpen(false);
        slashStartPosRef.current = -1;
        return;
      }
      if (e.key === ' ') {
        setSlashMenuOpen(false);
        slashStartPosRef.current = -1;
        return;
      }
    }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);

    // Detect slash command at start of a line
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const lineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.slice(lineStart);

    if (currentLine.startsWith('/')) {
      slashStartPosRef.current = lineStart;
      const filter = currentLine.slice(1);
      setSlashFilter(filter);
      setSlashMenuOpen(true);
      setSlashIndex(0);
    } else {
      if (slashMenuOpen) {
        setSlashMenuOpen(false);
        slashStartPosRef.current = -1;
      }
    }
  }

  // Focus search input when slash menu opens
  useEffect(() => {
    if (slashMenuOpen) {
      setMenuSearch('');
      requestAnimationFrame(() => menuSearchRef.current?.focus());
    }
  }, [slashMenuOpen]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!slashMenuOpen) return;
    const handler = () => setSlashMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [slashMenuOpen]);

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        lance_id: lanceId,
        house_id: houseId,
        author_member_id: authorMemberId,
        title: title.trim(),
        work_type: workType,
        content,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-4xl sm:my-4"
        style={{
          background: 'rgb(var(--ink-800))',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0"
               style={{ background: 'rgba(203,171,104,0.12)', border: '1px solid var(--line)', color: 'var(--gold)' }}>
            <Icons.Feather size={18} />
          </div>
          <h2 className="font-display font-bold text-xl text-ink-100 flex-1">{initial ? 'Edit Work' : 'New Bard Work'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><Icons.X size={16} /></button>
        </div>

        {/* Meta row — title + type pill group */}
        <div className="px-6 py-4 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <input
            className="input text-lg font-display flex-1 min-w-[200px]"
            placeholder="Title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          {/* Type toggle — small pill group, no native select */}
          <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5 flex-shrink-0">
            {WORK_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWorkType(opt.value)}
                className={cx(
                  'px-2.5 py-1 text-[11px] rounded-sm transition-colors capitalize',
                  workType === opt.value ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 flex flex-wrap gap-1 items-center" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <ToolbarBtn title="Bold (**text**)" onClick={() => insertAt('**', '**', 'bold text')}>
            <span className="font-bold text-sm">B</span>
          </ToolbarBtn>
          <ToolbarBtn title="Italic (*text*)" onClick={() => insertAt('*', '*', 'italic text')}>
            <span className="italic text-sm">I</span>
          </ToolbarBtn>
          <div className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
          <ToolbarBtn title="Heading 1" onClick={() => insertAt('\n# ', '', 'Heading')}>H1</ToolbarBtn>
          <ToolbarBtn title="Heading 2" onClick={() => insertAt('\n## ', '', 'Heading')}>H2</ToolbarBtn>
          <ToolbarBtn title="Heading 3" onClick={() => insertAt('\n### ', '', 'Heading')}>H3</ToolbarBtn>
          <div className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
          <ToolbarBtn title="Blockquote" onClick={() => insertAt('\n> ', '', 'quote')}>
            <Icons.Scroll size={13} />
          </ToolbarBtn>
          <ToolbarBtn title="Horizontal rule" onClick={() => insertAt('\n---\n')}>—</ToolbarBtn>
          <ToolbarBtn title="Bullet list" onClick={() => insertAt('\n- ', '', 'item')}>•</ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => insertAt('\n1. ', '', 'item')}>1.</ToolbarBtn>
          <div className="flex-1" />
          <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5">
            <button onClick={() => setPreview(false)} className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors', !preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}>Edit</button>
            <button onClick={() => setPreview(true)}  className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors',  preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}>Preview</button>
          </div>
        </div>

        {/* Editor / Preview area */}
        <div className="px-6 py-4 relative" style={{ minHeight: 360 }}>
          {preview ? (
            <div
              className="prose prose-invert max-w-none text-ink-100 min-h-[360px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<p style="color:rgba(236,228,211,0.3);font-style:italic">Nothing to preview…</p>' }}
            />
          ) : (
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="w-full font-mono text-sm resize-none leading-relaxed bg-transparent outline-none"
                style={{
                  minHeight: 360,
                  color: 'rgb(var(--ink-100))',
                  border: 'none',
                  padding: 0,
                }}
                placeholder={"Start writing…\n\nTip: type / at the start of a line for commands"}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
              />
              {/* Slash menu — Notion-style block picker */}
              {slashMenuOpen && (
                <div
                  className="absolute left-0 top-0 z-20 w-80"
                  style={{
                    background: 'rgb(20,18,14)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: '8px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Search input */}
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
                  {/* Block groups */}
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {filteredCmds.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm" style={{ color: 'rgb(var(--ink-300))' }}>No results</div>
                    ) : (
                      Object.entries(groupedCmds).map(([category, cmds]) => {
                        const categoryStart = filteredCmds.indexOf(cmds[0]);
                        return (
                          <div key={category}>
                            <div className="px-3 pt-3 pb-1" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--ink-300))', fontFamily: "'Figtree', system-ui, sans-serif" }}>
                              {category}
                            </div>
                            {cmds.map((cmd, j) => {
                              const globalIdx = categoryStart + j;
                              const active = globalIdx === slashIndex;
                              return (
                                <button
                                  key={cmd.key}
                                  className="w-full px-3 py-2 text-left flex items-center gap-3 transition-colors"
                                  style={active ? { background: 'rgba(203,171,104,0.12)' } : undefined}
                                  onMouseEnter={() => setSlashIndex(globalIdx)}
                                  onClick={() => handleSlashCommand(cmd)}
                                >
                                  {/* Icon box */}
                                  <div
                                    className="flex-shrink-0 flex items-center justify-center"
                                    style={{
                                      width: 28, height: 28, borderRadius: 5,
                                      background: active ? 'rgba(203,171,104,0.15)' : 'rgba(255,255,255,0.06)',
                                      border: `1px solid ${active ? 'rgba(203,171,104,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                      color: active ? 'var(--gold)' : 'rgb(var(--ink-100))',
                                    }}
                                  >
                                    {cmd.icon}
                                  </div>
                                  {/* Label + description */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium" style={{ color: active ? 'var(--gold)' : 'rgb(var(--ink-100))', lineHeight: 1.2 }}>{cmd.label}</div>
                                    <div className="text-xs truncate mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>{cmd.description}</div>
                                  </div>
                                  {/* Hint */}
                                  <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgb(var(--ink-300))', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {cmd.hint}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--line)' }}>
          {error ? <p className="text-red-400 text-sm">{error}</p> : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><Icons.Save size={14} />Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded text-xs text-ink-100/70 hover:text-gold-300 hover:bg-gold-500/15 transition-colors flex items-center justify-center"
    >
      {children}
    </button>
  );
}
