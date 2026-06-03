import { useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, House, LanceData, Member } from '@/lib/types';
import { MemberCard } from '@/components/MemberCard';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { monogramOf } from '@/lib/utils';

interface Props {
  house: House;
  data: LanceData;
  search: string;
  isAdmin: boolean;

  onUpsert: (m: Partial<Member> & { name: string }) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
  onUpsertSkill?: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill?: (id: string) => Promise<void>;
  onUpsertRitual?: (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual?: (id: string) => Promise<void>;
  onViewMember?: (m: Member) => void;
}

export function HouseTab({ house, data, search, isAdmin, onUpsert, onUnassign, onDelete, onUpsertCharInventory, onDeleteCharInventory, onUpsertSkill, onDeleteSkill, onUpsertRitual, onDeleteRitual, onViewMember }: Props) {
  const [editing, setEditing] = useState<Member | null>(null);
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

      <div className="flex items-center gap-3.5 mb-2 mt-3" style={{ background: 'var(--bg-2)' }}>
        {/* Monogram crest */}
        <div
          className="w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-lg select-none flex-shrink-0"
          style={{ background: `${c}22`, border: `1px solid ${c}66`, color: c }}
        >
          {monogramOf(house.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-4xl font-bold text-ink-100 m-0">{house.name}</h2>
          <p className="text-sm text-ink-100/60 m-0 tracking-wider">
            {houseMembers.length} sworn · {houseMembers.filter(m => m.is_noble).length} noble
            {house.motto && <span className="italic"> · "{house.motto}"</span>}
          </p>
        </div>
        {isAdmin && (
          <button className="text-xs text-ink-100/50 hover:text-ink-100/80 border border-ink-100/20 rounded px-2 py-1 transition-colors flex-shrink-0">
            Manage House
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="mb-4">
          <button className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
            ⚠ Delete house
          </button>
        </div>
      )}

      {house.description && <p className="text-sm text-ink-100/70 mt-3 mb-6 max-w-2xl">{house.description}</p>}

      {nobles.length > 0 && (
        <>
          <SectionHeader title="Nobility" count={nobles.length} />
          <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
            {nobles.map(m => (
              <MemberCard key={m.id} member={m} isAdmin={isAdmin} onUnassign={isAdmin ? onUnassign : undefined} onDelete={isAdmin ? onDelete : undefined} onViewSheet={onViewMember} />
            ))}
          </div>
        </>
      )}

      {regulars.length > 0 && (
        <>
          <SectionHeader title="Members" count={regulars.length} />
          <div className="grid sm:grid-cols-2 gap-3.5">
            {regulars.map(m => (
              <MemberCard key={m.id} member={m} isAdmin={isAdmin} onUnassign={isAdmin ? onUnassign : undefined} onDelete={isAdmin ? onDelete : undefined} onViewSheet={onViewMember} />
            ))}
          </div>
        </>
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
