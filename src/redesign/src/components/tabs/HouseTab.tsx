import { useState, type ReactNode } from 'react';
import type { House, Member, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { MemberCard } from '@/components/MemberCard';
import { MemberLedgerRow } from '@/components/MemberLedgerRow';
import { useConfirm } from '@/components/ConfirmDialog';
import { cx } from '@/lib/utils';

interface Props {
  house: House;
  data: LanceData;
  search: string;
  isAdmin: boolean;
  canManageHouse: boolean;
  onUpsert: (m: Member) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** New — moved out of the global action bar into the ribbon. */
  onDeleteHouse?: () => Promise<void>;
  onViewMember: (m: Member) => void;
  // Forwarded for compat with existing Layout.tsx call site. Unused here.
  onUpsertCharInventory?: unknown;
  onDeleteCharInventory?: unknown;
  onUpsertSkill?: unknown;
  onDeleteSkill?: unknown;
  onUpsertRitual?: unknown;
  onDeleteRitual?: unknown;
}

type ViewMode = 'ledger' | 'cards';
const VIEW_STORAGE_KEY = 'serrated.viewMode';

export function HouseTab({
  house, data, search, isAdmin, canManageHouse,
  onUpsert: _onUpsert,
  onUnassign, onDelete, onDeleteHouse, onViewMember,
}: Props) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof localStorage === 'undefined') return 'ledger';
    return (localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode) || 'ledger';
  });
  const setMode = (m: ViewMode) => {
    setView(m);
    try { localStorage.setItem(VIEW_STORAGE_KEY, m); } catch { /* ignore */ }
  };
  const { confirm, Dialog } = useConfirm();

  const houseMembers = data.members.filter(m => m.house_id === house.id);
  const filtered = !search ? houseMembers : houseMembers.filter(m => {
    const q = search.toLowerCase();
    return [m.name, m.rank, m.function, m.player_name, m.military_function]
      .filter(Boolean)
      .some(v => v!.toLowerCase().includes(q));
  });
  const nobles = filtered.filter(m => m.is_noble);
  const regulars = filtered.filter(m => !m.is_noble);

  return (
    <div className="animate-fade-in">
      <HouseRibbon
        house={house}
        memberCount={houseMembers.length}
        nobleCount={houseMembers.filter(m => m.is_noble).length}
        canManage={canManageHouse && !!onDeleteHouse}
        onDelete={async () => {
          if (!onDeleteHouse) return;
          if (await confirm({
            title: `Delete ${house.name}?`,
            body: 'Members will be unassigned.',
            danger: true,
          })) await onDeleteHouse();
        }}
      />

      {nobles.length > 0 && (
        <RosterSection
          label="Nobility"
          Icon={Icons.Crown}
          color="text-gold-300"
          count={nobles.length}
          view={view}
          onChangeView={setMode}
        >
          <Roster
            view={view}
            members={nobles}
            isAdmin={isAdmin}
            houseColor={house.primary_color}
            onView={onViewMember}
            onUnassign={onUnassign}
            onDelete={onDelete}
          />
        </RosterSection>
      )}

      {regulars.length > 0 && (
        <RosterSection
          label="Members"
          Icon={Icons.Users}
          color="text-ink-300"
          count={regulars.length}
          /* Only show the view toggle on the first section so we don't duplicate it */
          view={nobles.length > 0 ? null : view}
          onChangeView={nobles.length > 0 ? null : setMode}
        >
          <Roster
            view={view}
            members={regulars}
            isAdmin={isAdmin}
            houseColor={house.primary_color}
            onView={onViewMember}
            onUnassign={onUnassign}
            onDelete={onDelete}
          />
        </RosterSection>
      )}

      {filtered.length === 0 && (
        <p className="text-ink-300 text-center py-16">No members found</p>
      )}

      {Dialog}
    </div>
  );
}

/* ─────────────────────────── Ribbon ─────────────────────────── */

function HouseRibbon({
  house, memberCount, nobleCount, canManage, onDelete,
}: {
  house: House;
  memberCount: number;
  nobleCount: number;
  canManage: boolean;
  onDelete: () => void;
}) {
  const c = house.primary_color || '#d4b46d';
  return (
    <div className="relative rounded-2xl overflow-hidden mb-7 border border-gold-500/20">
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: `linear-gradient(110deg, ${c} 0%, ${c}88 35%, rgba(20,17,14,0.95) 75%)` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="relative z-10 px-7 py-6 flex items-center gap-5 flex-wrap">
        <div
          className="w-16 h-16 rounded-2xl grid place-items-center text-white
                     bg-gradient-to-b from-white/20 to-black/15 backdrop-blur-sm
                     border border-white/25"
          aria-hidden="true"
        >
          <Icons.Shield size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-3xl text-white drop-shadow-md leading-tight">
            {house.name}
          </h1>
          {house.motto && (
            <p className="font-display italic text-sm text-white/85 mt-1">"{house.motto}"</p>
          )}
          <div className="flex gap-2 mt-2.5">
            <RibbonTag><Icons.Users size={11} />{memberCount} sworn</RibbonTag>
            <RibbonTag><Icons.Crown size={11} />{nobleCount} noble</RibbonTag>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onDelete}
            className="btn btn-sm self-start"
            style={{ background: 'rgba(168,65,63,0.85)', color: 'white' }}
          >
            <Icons.Trash size={12} />
            Delete house
          </button>
        )}
      </div>
    </div>
  );
}

function RibbonTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold
                     bg-black/30 text-white border border-white/25">
      {children}
    </span>
  );
}

/* ─────────────────────────── Section header ─────────────────────────── */

function RosterSection({
  label, Icon, color, count, children, view, onChangeView,
}: {
  label: string;
  Icon: (props: { size?: number; className?: string }) => JSX.Element;
  color: string;
  count: number;
  children: ReactNode;
  view: ViewMode | null;
  onChangeView: ((m: ViewMode) => void) | null;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 mt-8 mb-4">
        <Icon size={16} className={color} />
        <h3 className={cx('text-xs uppercase tracking-widest font-bold', color)}>{label}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 to-transparent" />
        <span className="text-xs text-ink-300">{count}</span>
        {view && onChangeView && (
          <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5 ml-2" role="tablist" aria-label="View mode">
            {(['ledger', 'cards'] as const).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={view === m}
                onClick={() => onChangeView(m)}
                className={cx(
                  'px-2.5 py-1 text-[11px] rounded-sm transition-colors',
                  view === m ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100'
                )}
              >
                {m === 'ledger' ? 'Ledger' : 'Cards'}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </>
  );
}

/* ─────────────────────────── Roster body ─────────────────────────── */

function Roster({
  view, members, isAdmin, houseColor, onView, onUnassign, onDelete,
}: {
  view: ViewMode;
  members: Member[];
  isAdmin: boolean;
  houseColor: string;
  onView: (m: Member) => void;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (view === 'cards') {
    return (
      <div className="grid gap-3.5">
        {members.map(m => (
          <MemberCard
            key={m.id}
            member={m}
            isAdmin={isAdmin}
            onUnassign={onUnassign}
            onDelete={onDelete}
            onViewSheet={onView}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="card p-0 overflow-hidden">
      <div className="grid grid-cols-[36px_1.4fr_90px_1fr_100px_72px_104px] gap-3.5 px-4 py-2
                      text-[10px] uppercase tracking-[0.16em] text-ink-300 font-bold
                      border-b border-gold-500/15">
        <span /><span>Member</span><span>Rank</span><span>Function</span>
        <span>Income</span><span>Status</span><span className="text-right pr-1">Actions</span>
      </div>
      {members.map(m => (
        <MemberLedgerRow
          key={m.id}
          member={m}
          isAdmin={isAdmin}
          houseColor={houseColor}
          onView={() => onView(m)}
          onUnassign={() => onUnassign(m.id)}
          onDelete={() => onDelete(m.id)}
        />
      ))}
    </div>
  );
}
