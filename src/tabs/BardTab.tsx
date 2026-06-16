import { useState } from 'react';
import type { BardWork, LanceData } from '@/lib/types';
import { useLance } from '@/contexts/LanceContext';
import { Icons } from '@/components/Icons';
import { BardWorkEditor, renderMarkdown } from '@/components/BardWorkEditor';
import { WorkTypePill, WORK_TYPE_STYLES } from '@/components/BardWorksSection';
import { exportBardWorkPdf } from '@/lib/parchmentPdf';
import { cx } from '@/lib/utils';
import { useConfirm } from '@/components/ConfirmDialog';
import { CustomSelect } from '@/components/ui/CustomSelect';

// ── Filter types ───────────────────────────────────────────────────────────────

type FilterType = BardWork['work_type'] | 'all';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all',   label: 'All Works' },
  { value: 'story', label: 'Stories'   },
  { value: 'feat',  label: 'Feats'     },
  { value: 'song',  label: 'Songs'     },
  { value: 'poem',  label: 'Poems'     },
  { value: 'other', label: 'Other'     },
];

// ── Expanded work view ─────────────────────────────────────────────────────────

interface WorkCardProps {
  work: BardWork;
  data: LanceData;
  currentMemberId: string | null;
  isAdmin: boolean;
  onEdit: (work: BardWork) => void;
  onDelete: (id: string) => Promise<void>;
}

function BardWorkCard({ work, data, currentMemberId, isAdmin, onEdit, onDelete }: WorkCardProps) {
  const [expanded, setExpanded] = useState(false);
  const author = data.members.find(m => m.id === work.author_member_id);
  const house = data.houses.find(h => h.id === work.house_id);
  const { confirm, Dialog } = useConfirm();

  const canEdit = currentMemberId === work.author_member_id;
  const canDelete = canEdit || isAdmin;

  const excerpt = work.content.replace(/#{1,3} /g, '').replace(/[*_`>-]/g, '').slice(0, 150);
  const style = WORK_TYPE_STYLES[work.work_type] ?? WORK_TYPE_STYLES.other;

  return (
    <div
      className="card border border-gold-500/15 transition-shadow hover:shadow-lg hover:border-gold-500/25 overflow-hidden"
      style={{ borderLeft: `3px solid ${style.border}` }}
    >
      <div
        className="p-5 cursor-pointer select-none flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <WorkTypePill type={work.work_type} />
            {house && <span className="text-[10px] text-ink-100/50 font-medium">{house.name}</span>}
            <span className="text-[10px] text-ink-100/35 ml-auto">
              {new Date(work.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h4 className="text-lg font-display font-semibold text-ink-100 leading-tight">{work.title || 'Untitled'}</h4>
          <p className="text-xs text-ink-100/50 mt-0.5">by {author?.name ?? 'Unknown'}</p>
          {!expanded && (
            <p className="text-sm text-ink-100/55 mt-2 leading-relaxed line-clamp-2">{excerpt}{excerpt.length >= 150 ? '…' : ''}</p>
          )}
        </div>
        <Icons.ChevronDown size={16} className={cx('text-ink-100/40 flex-shrink-0 mt-1.5 transition-transform', expanded && 'rotate-180')} />
      </div>

      {expanded && (
        <div className="border-t border-gold-500/10">
          <div
            className="px-5 py-5"
            style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(work.content) || '<p style="opacity:0.3;font-style:italic">No content yet.</p>' }}
          />
          <div className="px-5 py-3 border-t border-gold-500/10 flex items-center gap-2 flex-wrap bg-black/15">
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

// ── BardTab ────────────────────────────────────────────────────────────────────

interface Props {
  currentMemberId: string | null;
}

export function BardTab({ currentMemberId }: Props) {
  const { data, lanceId, isAdmin, upsertBardWork: onUpsert, deleteBardWork: onDelete } = useLance();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterHouse, setFilterHouse] = useState<string>('all');
  const [groupByHouse, setGroupByHouse] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<BardWork | null>(null);

  const bardFunctionIds = new Set(
    data.functions.filter(f => f.name.toLowerCase().includes('bard')).map(f => f.id)
  );
  const myMember = currentMemberId ? data.members.find(m => m.id === currentMemberId) : null;
  const isBard = !!myMember?.function && bardFunctionIds.has(myMember.function);
  const canAdd = (isBard || isAdmin) && !!currentMemberId;

  const filtered = data.bardWorks
    .filter(w => filterType === 'all' || w.work_type === filterType)
    .filter(w => filterHouse === 'all' || w.house_id === filterHouse)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Group by house if requested
  const grouped: { houseId: string; houseName: string; works: BardWork[] }[] = [];
  if (groupByHouse) {
    for (const house of data.houses) {
      const works = filtered.filter(w => w.house_id === house.id);
      if (works.length > 0) grouped.push({ houseId: house.id, houseName: house.name, works });
    }
    // works with no matching house
    const houseIds = new Set(data.houses.map(h => h.id));
    const orphan = filtered.filter(w => !houseIds.has(w.house_id));
    if (orphan.length > 0) grouped.push({ houseId: '', houseName: 'Unknown House', works: orphan });
  }

  function openEdit(work: BardWork) {
    setEditingWork(work);
    setEditorOpen(true);
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center text-gold-300 border border-gold-300/30" style={{ background: 'linear-gradient(180deg, rgba(201,169,97,0.25), rgba(201,169,97,0.1))' }}>
          <Icons.Feather size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-gold-300 m-0">Bard Works</h2>
          <p className="text-xs text-ink-100/50 mt-0.5 uppercase tracking-wider">{data.bardWorks.length} chronicle{data.bardWorks.length !== 1 ? 's' : ''} in the lance</p>
        </div>
        {canAdd && (
          <button
            className="btn btn-primary ml-auto"
            onClick={() => { setEditingWork(null); setEditorOpen(true); }}
          >
            <Icons.Plus size={15} />
            New Work
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {/* Work type filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={cx(
                'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors',
                filterType === opt.value
                  ? 'bg-gold-500/25 text-gold-300 border border-gold-500/40'
                  : 'text-ink-100/50 border border-gold-500/15 hover:border-gold-500/30 hover:text-ink-100/70'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* House filter */}
        <CustomSelect
          value={filterHouse}
          onChange={v => setFilterHouse(v || 'all')}
          options={[{ value: 'all', label: 'All Houses' }, ...data.houses.map(h => ({ value: h.id, label: h.name }))]}
          placeholder=""
        />

        {/* Group toggle */}
        <button
          onClick={() => setGroupByHouse(g => !g)}
          className={cx('btn btn-sm btn-ghost', groupByHouse && 'text-gold-300')}
          title="Group by house"
        >
          <Icons.Shield size={13} />
          Group
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-ink-100/40 text-sm italic text-center py-16">
          No works found{filterType !== 'all' || filterHouse !== 'all' ? ' for the current filters' : ''}.
        </p>
      )}

      {/* Works list */}
      {groupByHouse ? (
        grouped.map(group => (
          <div key={group.houseId} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Shield size={14} className="text-gold-300/60" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-gold-300/70 m-0">{group.houseName}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gold-500/20 to-transparent" />
              <span className="text-xs text-ink-100/40">{group.works.length}</span>
            </div>
            <div className="grid gap-3">
              {group.works.map(w => (
                <BardWorkCard
                  key={w.id}
                  work={w}
                  data={data}
                  currentMemberId={currentMemberId}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid gap-3">
          {filtered.map(w => (
            <BardWorkCard
              key={w.id}
              work={w}
              data={data}
              currentMemberId={currentMemberId}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {editorOpen && !!currentMemberId && (
        <BardWorkEditor
          initial={editingWork}
          lanceId={editingWork?.lance_id ?? lanceId}
          houseId={editingWork?.house_id ?? (myMember?.house_id ?? data.houses[0]?.id ?? '')}
          authorMemberId={editingWork?.author_member_id ?? (currentMemberId ?? '')}
          onSave={onUpsert}
          onClose={() => { setEditorOpen(false); setEditingWork(null); }}
        />
      )}
    </div>
  );
}
