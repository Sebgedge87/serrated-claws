import { useState } from 'react';
import type { BardWork, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { BardWorkEditor, renderMarkdown } from '@/components/BardWorkEditor';
import { exportBardWorkPdf } from '@/lib/parchmentPdf';
import { cx } from '@/lib/utils';
import { useConfirm } from '@/components/ConfirmDialog';
import { useLance } from '@/contexts/LanceContext';

// ── Work type styling ──────────────────────────────────────────────────────────

export const WORK_TYPE_STYLES: Record<BardWork['work_type'], { bg: string; text: string; border: string; label: string }> = {
  story: { bg: 'rgba(122,90,16,0.25)', text: '#d4a832', border: 'rgba(122,90,16,0.5)', label: 'Story' },
  feat:  { bg: 'rgba(26,92,37,0.25)',  text: '#5ec96a', border: 'rgba(26,92,37,0.5)',  label: 'Feat'  },
  song:  { bg: 'rgba(26,63,122,0.25)', text: '#5ea0d4', border: 'rgba(26,63,122,0.5)', label: 'Song'  },
  poem:  { bg: 'rgba(107,32,128,0.25)',text: '#c06dd4', border: 'rgba(107,32,128,0.5)',label: 'Poem'  },
  other: { bg: 'rgba(74,74,74,0.25)',  text: '#a0a0a0', border: 'rgba(74,74,74,0.5)',  label: 'Other' },
};

export function WorkTypePill({ type }: { type: BardWork['work_type'] }) {
  const s = WORK_TYPE_STYLES[type] ?? WORK_TYPE_STYLES.other;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ── Work card ──────────────────────────────────────────────────────────────────

interface WorkCardProps {
  work: BardWork;
  data: LanceData;
  currentMemberId: string | null;
  isAdmin: boolean;
  onEdit: (work: BardWork) => void;
  onDelete: (id: string) => Promise<void>;
}

function WorkCard({ work, data, currentMemberId, isAdmin, onEdit, onDelete }: WorkCardProps) {
  const [expanded, setExpanded] = useState(false);
  const author = data.members.find(m => m.id === work.author_member_id);
  const house = data.houses.find(h => h.id === work.house_id);
  const { confirm, Dialog } = useConfirm();

  const canEdit = currentMemberId === work.author_member_id;
  const canDelete = canEdit || isAdmin;

  const excerpt = work.content.replace(/#{1,3} /g, '').replace(/[*_`>-]/g, '').slice(0, 150);

  return (
    <div
      className="card border border-gold-500/15 transition-shadow hover:shadow-lg hover:border-gold-500/25"
    >
      {/* Card header */}
      <div
        className="p-4 cursor-pointer select-none flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <WorkTypePill type={work.work_type} />
            <span className="text-[10px] text-ink-100/40">
              {new Date(work.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h4 className="text-base font-display font-semibold text-ink-100 truncate">{work.title || 'Untitled'}</h4>
          <p className="text-xs text-ink-100/50 mt-0.5">{author?.name ?? 'Unknown author'}</p>
          {!expanded && (
            <p className="text-sm text-ink-100/60 mt-1.5 leading-relaxed line-clamp-2">{excerpt}{excerpt.length >= 150 ? '…' : ''}</p>
          )}
        </div>
        <Icons.ChevronDown size={16} className={cx('text-ink-100/40 flex-shrink-0 mt-1 transition-transform', expanded && 'rotate-180')} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gold-500/10">
          <div
            className="px-5 py-4 prose-bard"
            style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(work.content) || '<p style="opacity:0.3;font-style:italic">No content yet.</p>' }}
          />
          <div className="px-5 py-3 border-t border-gold-500/10 flex items-center gap-2 flex-wrap">
            {/* PDF export */}
            <button
              className="btn btn-ghost btn-sm"
              title="Export to PDF"
              onClick={() => exportBardWorkPdf(work, author?.name ?? 'Unknown', house?.name ?? 'Unknown House')}
            >
              <Icons.Download size={13} />
              PDF
            </button>
            <div className="flex-1" />
            {canEdit && (
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(work)}>
                <Icons.Edit size={13} />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                onClick={async () => {
                  if (await confirm({ title: `Delete "${work.title}"?`, body: 'This cannot be undone.', danger: true })) {
                    await onDelete(work.id);
                  }
                }}
              >
                <Icons.Trash size={13} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
      {Dialog}
    </div>
  );
}

// ── BardWorksSection ──────────────────────────────────────────────────────────

interface Props {
  houseId: string;
  currentMemberId: string | null;
}

export function BardWorksSection({ houseId, currentMemberId }: Props) {
  const { lanceId, data, isAdmin, upsertBardWork: onUpsertBardWork, deleteBardWork: onDeleteBardWork } = useLance();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<BardWork | null>(null);

  const works = data.bardWorks
    .filter(w => w.house_id === houseId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const bardFunctionIds = new Set(
    data.functions.filter(f => f.name.toLowerCase().includes('bard')).map(f => f.id)
  );
  const isBardInHouse = currentMemberId
    ? data.members.some(m =>
        m.id === currentMemberId &&
        m.house_id === houseId &&
        !!m.function && bardFunctionIds.has(m.function)
      )
    : false;

  const currentMemberCanEditBardWorks = currentMemberId
    ? (data.members.find(m => m.id === currentMemberId)?.can_edit_bard_works ?? false)
    : false;

  const canAdd = (isBardInHouse || isAdmin || currentMemberCanEditBardWorks) && !!currentMemberId;

  function openNew() {
    setEditingWork(null);
    setEditorOpen(true);
  }

  function openEdit(work: BardWork) {
    setEditingWork(work);
    setEditorOpen(true);
  }

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <Icons.Feather size={16} className="text-gold-300" />
        <h3 className="text-xs uppercase tracking-widest font-bold text-gold-300 m-0">Chronicles</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 to-transparent" />
        <span className="text-xs text-ink-100/50">{works.length}</span>
        {canAdd && (
          <button className="btn btn-sm btn-ghost ml-2" onClick={openNew}>
            <Icons.Plus size={12} />
            Add Work
          </button>
        )}
      </div>

      {works.length === 0 && (
        <p className="text-ink-100/40 text-sm italic text-center py-8">
          No chronicles yet. {canAdd ? 'Add the first work.' : 'Only Bards may add works.'}
        </p>
      )}

      <div className="grid gap-3">
        {works.map(w => (
          <WorkCard
            key={w.id}
            work={w}
            data={data}
            currentMemberId={currentMemberId}
            isAdmin={isAdmin}
            onEdit={openEdit}
            onDelete={onDeleteBardWork}
          />
        ))}
      </div>

      {editorOpen && currentMemberId && (
        <BardWorkEditor
          initial={editingWork}
          lanceId={editingWork?.lance_id ?? lanceId}
          houseId={editingWork?.house_id ?? houseId}
          authorMemberId={editingWork?.author_member_id ?? currentMemberId}
          onSave={onUpsertBardWork}
          onClose={() => { setEditorOpen(false); setEditingWork(null); }}
        />
      )}
    </div>
  );
}
