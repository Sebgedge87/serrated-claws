import type { Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { StatField } from '@/components/StatField';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials, cx, formatIncome } from '@/lib/utils';

interface Props {
  member: Member;
  isAdmin: boolean;
  canEditSelf?: boolean;
  onEdit: (m: Member) => void;
  onUnassign?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewSheet?: (m: Member) => void;
}

export function MemberCard({ member, isAdmin, canEditSelf, onEdit, onUnassign, onDelete, onViewSheet }: Props) {
  const accent = member.is_noble ? '#d4b46d' : member.status === 'active' ? '#6dd47e' : member.status === 'KIA' ? '#ff7a7a' : '#999';
  const canEdit = isAdmin || canEditSelf;
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  return (
    <>
    <div className="card card-lift overflow-hidden relative">
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40 60%, transparent)` }} />
      <div className="px-5 py-4 border-b border-gold-500/15 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className={cx(
              'w-11 h-11 rounded-full grid place-items-center flex-shrink-0 font-display font-bold text-base',
              member.is_noble ? 'text-gold-300' : 'text-ink-100'
            )}
            style={{
              background: member.is_noble
                ? 'linear-gradient(135deg, rgba(212,180,109,0.4), rgba(212,180,109,0.15))'
                : 'linear-gradient(135deg, rgba(140,120,100,0.3), rgba(80,70,60,0.2))',
              border: `1.5px solid ${member.is_noble ? 'rgba(212,180,109,0.6)' : 'rgba(140,120,100,0.3)'}`,
              boxShadow: member.is_noble ? '0 0 16px rgba(212,180,109,0.3)' : 'none'
            }}
          >
            {initials(member.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h4 className="font-display font-bold text-lg text-ink-100 m-0">{member.name}</h4>
              {member.is_noble && (
                <span className="pill pill-noble">
                  <Icons.Crown size={11} />
                  Noble
                </span>
              )}
              <span className={`pill pill-${member.status.toLowerCase()}`}>{member.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-100/60">
              {member.rank && <span className="font-semibold text-ink-100">{member.rank}</span>}
              {member.player_name && <span>·  {member.player_name}</span>}
              {member.pid && <span className="font-mono text-[11px] opacity-70">PID {member.pid}</span>}
            </div>
          </div>
        </div>
        {(canEdit || onViewSheet) && (
          <div className="flex gap-1.5 flex-shrink-0">
            {onViewSheet && (
              <button onClick={() => onViewSheet(member)} className="btn btn-ghost btn-sm">
                <Icons.BookOpen size={13} />
                Character Sheet
              </button>
            )}
            {canEdit && (
            <button onClick={() => onEdit(member)} className="btn btn-secondary btn-sm">
              <Icons.Edit size={13} />
              Edit
            </button>
            )}
            {isAdmin && onUnassign && member.house_id && (
              <button onClick={() => onUnassign(member.id)} className="btn btn-ghost btn-sm" title="Move to Unassigned">
                <Icons.Question size={13} />
              </button>
            )}
            {isAdmin && onDelete && (
              <button onClick={async () => {
                if (await confirm({ title: `Delete ${member.name}?`, body: 'This cannot be undone.', danger: true }))
                  onDelete(member.id);
              }} className="btn btn-danger btn-sm" title="Delete">
                <Icons.Trash size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
          {member.function && <StatField icon={Icons.Swords} label="Claw" value={member.function} color="#d4b46d" />}
          {member.military_function && <StatField icon={Icons.Shield} label="Military Role" value={member.military_function} />}
          {member.coven && <StatField icon={Icons.Sparkles} label="Coven" value={member.coven} color="#b56eb5" />}
          {member.hp != null && <StatField icon={Icons.Heart} label="HP" value={member.hp} color="#ff7a7a" />}
          {member.mp != null && <StatField icon={Icons.Zap} label="MP" value={member.mp} color="#7eb0ff" />}
          {member.resource && <StatField icon={Icons.Gem} label="Resource" value={member.resource} color="#7ed4ae" />}
          {formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event) && (
            <StatField icon={Icons.Coins} label="Income / Event" value={formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event)!} color="#e0c66d" />
          )}
        </div>
        {member.notes && (
          <div className="mt-3.5 px-3.5 py-3 bg-black/25 rounded-lg border-l-[3px] border-gold-500/40 text-sm leading-relaxed">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-1">Notes</div>
            {member.notes}
          </div>
        )}
      </div>
    </div>
    {ConfirmDialog}
    </>
  );
}
