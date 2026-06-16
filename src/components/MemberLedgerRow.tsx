import type { Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials, cx, formatIncome } from '@/lib/utils';

interface Props {
  member: Member;
  isAdmin: boolean;
  houseColor: string;
  functionName?: string | null;
  onView: () => void;
  onUnassign?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export function MemberLedgerRow({
  member, isAdmin, houseColor, functionName, onView, onUnassign, onDelete,
}: Props) {
  const { confirm, Dialog } = useConfirm();
  const income = formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(); } }}
        className="grid grid-cols-[36px_1fr_auto_auto] sm:grid-cols-[36px_1.4fr_90px_1fr_100px_88px_104px]
                   gap-2.5 sm:gap-3.5 items-center
                   px-3 sm:px-4 py-3 sm:py-2.5 text-sm border-b border-gold-500/8 cursor-pointer
                   transition-colors hover:bg-gold-500/5
                   focus:outline-none focus:bg-gold-500/8"
      >
        {/* Avatar */}
        <div
          className={cx(
            'w-7 h-7 rounded-full grid place-items-center font-display font-bold text-[11px] flex-shrink-0',
            member.is_noble ? 'text-gold-300' : 'text-ink-100'
          )}
          style={{
            background: member.is_noble
              ? `linear-gradient(135deg, ${houseColor}55, ${houseColor}22)`
              : 'linear-gradient(135deg, rgba(140,120,100,0.3), rgba(80,70,60,0.2))',
            border: `1.5px solid ${member.is_noble ? houseColor + '99' : 'rgba(140,120,100,0.3)'}`,
            boxShadow: member.is_noble ? `0 0 12px ${houseColor}40` : 'none',
          }}
        >
          {initials(member.name)}
        </div>

        {/* Name + player */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-[14px] truncate">{member.name}</span>
            {member.is_noble && <Icons.Crown size={12} className="text-gold-300 flex-shrink-0" />}
          </div>
          {member.player_name && (
            <div className="text-[11px] text-ink-100/55 truncate">{member.player_name}</div>
          )}
        </div>

        <span className="hidden sm:block text-[12px] text-ink-100 truncate">{member.rank ?? '—'}</span>
        <span className="hidden sm:block text-[12px] text-gold-300 truncate">{functionName ?? member.function ?? '—'}</span>
        <span className="hidden sm:block text-[12px] font-mono text-gold-50/85">{income ?? '—'}</span>
        <div className="overflow-hidden">
          <span className={`pill pill-${member.status.toLowerCase()}`}>{member.status}</span>
        </div>

        {/* Actions — stop propagation so row click doesn't fire too */}
        <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="btn btn-ghost btn-sm" aria-label={`Open ${member.name}`} title="Open character sheet">
            <Icons.BookOpen size={12} />
          </button>
          {isAdmin && onUnassign && member.house_id && (
            <button
              onClick={async () => { await onUnassign(); }}
              className="btn btn-ghost btn-sm"
              aria-label={`Unassign ${member.name}`}
              title="Move to Unassigned"
            >
              <Icons.Question size={11} />
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              onClick={async () => {
                if (await confirm({
                  title: `Delete ${member.name}?`,
                  body: 'This cannot be undone.',
                  danger: true,
                })) await onDelete();
              }}
              className="btn btn-ghost btn-sm text-red-300/80 hover:!text-red-300"
              aria-label={`Delete ${member.name}`}
              title="Delete"
            >
              <Icons.Trash size={11} />
            </button>
          )}
        </div>
      </div>
      {Dialog}
    </>
  );
}
