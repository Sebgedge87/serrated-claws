import { useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, House, LanceData, Member } from '@/lib/types';
import { MemberCard } from '@/components/MemberCard';
import { MemberLedgerRow } from '@/components/MemberLedgerRow';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { monogramOf } from '@/lib/utils';

type ViewMode = 'ledger' | 'cards';
const VIEW_KEY = 'serrated.viewMode';

interface Props {
  house: House;
  data: LanceData;
  search: string;
  isAdmin: boolean;

  onUpsert: (m: Partial<Member> & { name: string }) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteHouse?: () => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
  onUpsertSkill?: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill?: (id: string) => Promise<void>;
  onUpsertRitual?: (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual?: (id: string) => Promise<void>;
  onViewMember?: (m: Member) => void;
}

export function HouseTab({ house, data, search, isAdmin, onUpsert, onUnassign, onDelete, onDeleteHouse, onUpsertCharInventory, onDeleteCharInventory, onUpsertSkill, onDeleteSkill, onUpsertRitual, onDeleteRitual, onViewMember }: Props) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [view, setView] = useState<ViewMode>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as ViewMode) || 'ledger'; } catch { return 'ledger'; }
  });
  const setMode = (m: ViewMode) => { setView(m); try { localStorage.setItem(VIEW_KEY, m); } catch { /* ignore */ } };

  const c = house.primary_color ?? '#d4b46d';
  const houseMembers = data.members.filter(m => m.house_id === house.id);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? houseMembers.filter(m => [m.name, m.player_name, m.rank, m.function, m.military_function].filter(Boolean).some(v => v!.toLowerCase().includes(q)))
    : houseMembers;
  const nobles = filtered.filter(m => m.is_noble);
  const regulars = filtered.filter(m => !m.is_noble);

  return (
    <div>
      {/* House-colour top rule */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${c}, transparent)` }} />
      <div className="hairline-fade" />

      {/* Masthead */}
      <div className="flex items-center gap-3.5 mb-2 mt-3">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-lg select-none flex-shrink-0"
          style={{ background: `${c}22`, border: `1px solid ${c}66`, color: c }}
        >
          {monogramOf(house.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-ink-100 m-0">{house.name}</h2>
          <p className="text-sm text-ink-100/60 m-0 tracking-wider">
            {houseMembers.length} sworn · {houseMembers.filter(m => m.is_noble).length} noble
            {house.motto && <span className="italic"> · "{house.motto}"</span>}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5 flex-shrink-0">
          {(['ledger', 'cards'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[11px] rounded-sm transition-colors ${view === m ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100'}`}
            >
              {m === 'ledger' ? 'Ledger' : 'Cards'}
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-3">
          <button className="text-xs text-red-400/60 hover:text-red-400 transition-colors" onClick={onDeleteHouse}>
            ⚠ Delete house
          </button>
        </div>
      )}

      {house.description && <p className="text-sm text-ink-100/70 mt-2 mb-6 max-w-2xl">{house.description}</p>}

      {nobles.length > 0 && (
        <>
          <SectionHeader title="Nobility" count={nobles.length} />
          {view === 'ledger' ? (
            <LedgerTable members={nobles} isAdmin={isAdmin} houseColor={c} onView={onViewMember} onUnassign={onUnassign} onDelete={onDelete} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
              {nobles.map(m => (
                <MemberCard key={m.id} member={m} isAdmin={isAdmin} onUnassign={isAdmin ? onUnassign : undefined} onDelete={isAdmin ? onDelete : undefined} onViewSheet={onViewMember} />
              ))}
            </div>
          )}
        </>
      )}

      {regulars.length > 0 && (
        <div className={nobles.length > 0 ? 'mt-8' : ''}>
          <SectionHeader title="Members" count={regulars.length} />
          {view === 'ledger' ? (
            <LedgerTable members={regulars} isAdmin={isAdmin} houseColor={c} onView={onViewMember} onUnassign={onUnassign} onDelete={onDelete} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5">
              {regulars.map(m => (
                <MemberCard key={m.id} member={m} isAdmin={isAdmin} onUnassign={isAdmin ? onUnassign : undefined} onDelete={isAdmin ? onDelete : undefined} onViewSheet={onViewMember} />
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center py-16 text-ink-100/50">No members in {house.name}</p>
      )}

      {editing && (
        <AddPersonModal
          data={data}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async m => {
            await onUpsert({ ...editing, ...m });
            setEditing(null);
          }}
          onUpsertCharInventory={onUpsertCharInventory}
          onDeleteCharInventory={onDeleteCharInventory}
          onUpsertSkill={onUpsertSkill}
          onDeleteSkill={onDeleteSkill}
          onUpsertRitual={onUpsertRitual}
          onDeleteRitual={onDeleteRitual}
        />
      )}
    </div>
  );
}

function LedgerTable({ members, isAdmin, houseColor, onView, onUnassign, onDelete }: {
  members: Member[];
  isAdmin: boolean;
  houseColor: string;
  onView?: (m: Member) => void;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div
      className="mb-2"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'rgb(var(--ink-800))',
      }}
    >
      {/* Column header — 2-col on mobile, full 7-col on sm+ */}
      <div
        className="hidden sm:grid"
        style={{
          gridTemplateColumns: '36px 1.4fr 90px 1fr 100px 88px 104px',
          gap: '14px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--line)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgb(var(--ink-300))',
          fontWeight: 700,
        }}
      >
        <span /><span>Member</span><span>Rank</span><span>Role</span>
        <span>Income</span><span>Status</span><span />
      </div>
      {/* Mobile header — just member + status */}
      <div
        className="grid sm:hidden"
        style={{
          gridTemplateColumns: '36px 1fr auto',
          gap: '10px',
          padding: '6px 12px',
          borderBottom: '1px solid var(--line)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgb(var(--ink-300))',
          fontWeight: 700,
        }}
      >
        <span /><span>Member</span><span>Status</span>
      </div>
      {members.map(m => (
        <MemberLedgerRow
          key={m.id}
          member={m}
          isAdmin={isAdmin}
          houseColor={houseColor}
          onView={() => onView?.(m)}
          onUnassign={isAdmin ? () => onUnassign(m.id) : undefined}
          onDelete={isAdmin ? () => onDelete(m.id) : undefined}
        />
      ))}
    </div>
  );
}
