import { useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, LanceData, Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { MemberCard } from '@/components/MemberCard';
import { AddPersonModal } from '@/components/modals/AddPersonModal';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  onUpsert: (m: Partial<Member> & { name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
  onUpsertSkill?: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill?: (id: string) => Promise<void>;
  onUpsertRitual?: (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual?: (id: string) => Promise<void>;
  onViewMember?: (m: Member) => void;
}

export function UnassignedTab({ data, isAdmin, onUpsert, onDelete, onUpsertCharInventory, onDeleteCharInventory, onUpsertSkill, onDeleteSkill, onUpsertRitual, onDeleteRitual, onViewMember }: Props) {
  const [editing, setEditing] = useState<Member | null>(null);
  const unassigned = data.members.filter(m => !m.house_id);

  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center border border-gold-500/40 text-gold-300" style={{ background: 'linear-gradient(180deg, rgba(212,180,109,0.3), rgba(212,180,109,0.1))' }}>
          <Icons.Question size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Unassigned</h2>
          <p className="text-sm text-ink-100/60 m-0">Members not yet sworn to a house</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {unassigned.map(m => (
          <MemberCard key={m.id} member={m} isAdmin={isAdmin} onDelete={onDelete} onViewSheet={onViewMember} />
        ))}
        {unassigned.length === 0 && <p className="text-center py-16 text-ink-100/50">All sworn. No unassigned members.</p>}
      </div>

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
