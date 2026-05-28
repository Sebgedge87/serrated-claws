import { useState } from 'react';
import type { CharInventoryItem, CharacterSkill, House, LanceData, Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { MemberCard } from '@/components/MemberCard';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { SectionHeader } from './OverviewTab';

interface Props {
  house: House;
  data: LanceData;
  search: string;
  isAdmin: boolean;
  canManageHouse: boolean;
  onUpsert: (m: Partial<Member> & { name: string }) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
  onUpsertSkill?: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill?: (id: string) => Promise<void>;
  onViewMember?: (m: Member) => void;
}

export function HouseTab({ house, data, search, isAdmin, canManageHouse, onUpsert, onUnassign, onDelete, onUpsertCharInventory, onDeleteCharInventory, onUpsertSkill, onDeleteSkill, onViewMember }: Props) {
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
      <div className="flex items-center gap-3.5 mb-2">
        <div className="w-12 h-12 rounded-xl grid place-items-center border" style={{ color: c, background: `linear-gradient(180deg, ${c}30, ${c}10)`, borderColor: `${c}40`, boxShadow: `0 0 24px ${c}25` }}>
          <Icons.Shield size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">{house.name}</h2>
          <p className="text-sm text-ink-100/60 m-0 tracking-wider">
            {houseMembers.length} sworn · {houseMembers.filter(m => m.is_noble).length} noble
            {house.motto && <span className="italic"> · "{house.motto}"</span>}
          </p>
        </div>
      </div>

      {house.description && <p className="text-sm text-ink-100/70 mt-3 mb-6 max-w-2xl">{house.description}</p>}

      {nobles.length > 0 && (
        <>
          <SectionHeader icon={<Icons.Crown size={16} />} title="Nobility" count={nobles.length} />
          <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
            {nobles.map(m => (
              <MemberCard key={m.id} member={m} isAdmin={isAdmin} onUnassign={isAdmin ? onUnassign : undefined} onDelete={isAdmin ? onDelete : undefined} onViewSheet={onViewMember} />
            ))}
          </div>
        </>
      )}

      {regulars.length > 0 && (
        <>
          <SectionHeader icon={<Icons.Users size={16} />} title="Members" count={regulars.length} />
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
        />
      )}
    </div>
  );
}
