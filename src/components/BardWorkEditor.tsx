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
  action: 'insert' | 'type';
  value: string;
}

const SLASH_COMMANDS: SlashCmd[] = [
  { key: 'h1',       label: '/h1',       description: 'Heading 1',   action: 'insert', value: '\n# '     },
  { key: 'h2',       label: '/h2',       description: 'Heading 2',   action: 'insert', value: '\n## '    },
  { key: 'h3',       label: '/h3',       description: 'Heading 3',   action: 'insert', value: '\n### '   },
  { key: 'quote',    label: '/quote',    description: 'Blockquote',  action: 'insert', value: '\n> '     },
  { key: 'hr',       label: '/hr',       description: 'Divider',     action: 'insert', value: '\n---\n'  },
  { key: 'bullet',   label: '/bullet',   description: 'Bullet list', action: 'insert', value: '\n- '     },
  { key: 'numbered', label: '/numbered', description: 'Numbered list', action: 'insert', value: '\n1. '  },
  { key: 'story',    label: '/story',    description: 'Set type: Story', action: 'type', value: 'story'  },
  { key: 'feat',     label: '/feat',     description: 'Set type: Feat',  action: 'type', value: 'feat'   },
  { key: 'song',     label: '/song',     description: 'Set type: Song',  action: 'type', value: 'song'   },
  { key: 'poem',     label: '/poem',     description: 'Set type: Poem',  action: 'type', value: 'poem'   },
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

  const filteredCmds = SLASH_COMMANDS.filter(c =>
    slashFilter === '' || c.key.startsWith(slashFilter.toLowerCase())
  );

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
    if (cmd.action === 'type') {
      setWorkType(cmd.value as WorkType);
      // Remove the slash text from the content
      const ta = textareaRef.current;
      if (ta && slashStartPosRef.current >= 0) {
        const before = content.slice(0, slashStartPosRef.current);
        const after = content.slice(ta.selectionStart);
        setContent(before + after);
      }
    } else {
      const ta = textareaRef.current;
      if (!ta || slashStartPosRef.current < 0) return;
      const before = content.slice(0, slashStartPosRef.current);
      const after = content.slice(ta.selectionStart);
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
  }, [content]);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-4xl bg-gradient-to-b from-ink-800/98 to-ink-900/98 border border-gold-500/30 rounded-none sm:rounded-2xl min-h-screen sm:min-h-0 sm:my-4"
        style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gold-500/15" style={{ background: 'linear-gradient(180deg, rgba(201,169,97,0.08), transparent)' }}>
          <div className="w-9 h-9 rounded-lg grid place-items-center text-gold-300 border border-gold-300/30" style={{ background: 'linear-gradient(180deg, rgba(201,169,97,0.25), rgba(201,169,97,0.1))' }}>
            <Icons.Feather size={18} />
          </div>
          <h2 className="text-lg font-display font-bold text-ink-100 flex-1">{initial ? 'Edit Work' : 'New Bard Work'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><Icons.X size={16} /></button>
        </div>

        {/* Meta row */}
        <div className="px-6 py-4 border-b border-gold-500/10 grid sm:grid-cols-[1fr_auto] gap-3">
          <input
            className="input text-lg font-display"
            placeholder="Title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <select
            className="input w-auto"
            value={workType}
            onChange={e => setWorkType(e.target.value as WorkType)}
          >
            {WORK_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-gold-500/10 flex flex-wrap gap-1 items-center">
          <ToolbarBtn title="Bold (**text**)" onClick={() => insertAt('**', '**', 'bold text')}>
            <span className="font-bold text-sm">B</span>
          </ToolbarBtn>
          <ToolbarBtn title="Italic (*text*)" onClick={() => insertAt('*', '*', 'italic text')}>
            <span className="italic text-sm">I</span>
          </ToolbarBtn>
          <div className="w-px h-5 bg-gold-500/20 mx-1" />
          <ToolbarBtn title="Heading 1" onClick={() => insertAt('\n# ', '', 'Heading')}>H1</ToolbarBtn>
          <ToolbarBtn title="Heading 2" onClick={() => insertAt('\n## ', '', 'Heading')}>H2</ToolbarBtn>
          <ToolbarBtn title="Heading 3" onClick={() => insertAt('\n### ', '', 'Heading')}>H3</ToolbarBtn>
          <div className="w-px h-5 bg-gold-500/20 mx-1" />
          <ToolbarBtn title="Blockquote" onClick={() => insertAt('\n> ', '', 'quote')}>
            <Icons.Scroll size={13} />
          </ToolbarBtn>
          <ToolbarBtn title="Horizontal rule" onClick={() => insertAt('\n---\n')}>—</ToolbarBtn>
          <ToolbarBtn title="Bullet list" onClick={() => insertAt('\n- ', '', 'item')}>•</ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => insertAt('\n1. ', '', 'item')}>1.</ToolbarBtn>
          <div className="flex-1" />
          <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5">
            <button
              onClick={() => setPreview(false)}
              className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors', !preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}
            >Edit</button>
            <button
              onClick={() => setPreview(true)}
              className={cx('px-2.5 py-1 text-[11px] rounded-sm transition-colors', preview ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100')}
            >Preview</button>
          </div>
        </div>

        {/* Editor / Preview area */}
        <div className="px-6 py-4 relative" style={{ minHeight: 320 }}>
          {preview ? (
            <div
              className="prose prose-invert max-w-none text-ink-100 min-h-[320px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<p class="text-ink-100/30 italic">Nothing to preview…</p>' }}
            />
          ) : (
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="input w-full font-mono text-sm resize-none leading-relaxed"
                style={{ minHeight: 320 }}
                placeholder={"Start writing…\n\nTip: type / at the start of a line for commands"}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
              />
              {/* Slash menu */}
              {slashMenuOpen && filteredCmds.length > 0 && (
                <div
                  className="absolute left-0 top-full mt-1 z-10 w-64 bg-ink-800/98 border border-gold-500/30 rounded-lg shadow-2xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {filteredCmds.map((cmd, i) => (
                    <button
                      key={cmd.key}
                      className={cx(
                        'w-full px-3 py-2 text-left flex items-center gap-2.5 text-sm transition-colors',
                        i === slashIndex ? 'bg-gold-500/20 text-gold-300' : 'text-ink-100 hover:bg-gold-500/10'
                      )}
                      onMouseEnter={() => setSlashIndex(i)}
                      onClick={() => handleSlashCommand(cmd)}
                    >
                      <span className="font-mono text-xs text-gold-400 w-20 flex-shrink-0">{cmd.label}</span>
                      <span className="text-ink-100/60 text-xs">{cmd.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold-500/15 flex items-center justify-between gap-3 bg-black/20">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!error && <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (
                <><Icons.Save size={14} />Save</>
              )}
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
