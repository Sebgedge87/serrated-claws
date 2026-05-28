import type { House, Member } from '@/lib/types';
import { Icons } from '@/lib/icons';
import { MemberCard } from '@/components/MemberCard';

interface Props {
  house: House;
  members: Member[];
  searchQuery: string;
  canEditAll: boolean;
  onRemove: (m: Member) => void;
}

export function HouseTab({ house, members, searchQuery, canEditAll, onRemove }: Props) {
  const houseMembers = members.filter(m => m.house_id === house.id);
  const filtered = !searchQuery ? houseMembers : houseMembers.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.rank?.toLowerCase().includes(q) ||
      m.function?.toLowerCase().includes(q) ||
      m.player_name?.toLowerCase().includes(q)
    );
  });
  const nobles = filtered.filter(m => m.is_noble);
  const regulars = filtered.filter(m => !m.is_noble);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3.5 mb-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${house.primary_color}30, ${house.primary_color}10)`,
            border: `1px solid ${house.primary_color}40`,
            color: house.primary_color,
            boxShadow: `0 0 24px ${house.primary_color}25`,
          }}
        >
          <Icons.Shield size={24} />
        </div>
        <div>
          <h2 className="font-display font-bold text-3xl gold-text leading-none">{house.name}</h2>
          <p className="text-xs text-ink-300 tracking-wide mt-1">
            {houseMembers.length} sworn · {houseMembers.filter(m => m.is_noble).length} noble
            {house.motto && <span className="italic"> · "{house.motto}"</span>}
          </p>
        </div>
      </div>

      {nobles.length > 0 && (
        <Section icon={<Icons.Crown size={16} className="text-gold-400" />} label="Nobility" count={nobles.length} colorClass="text-gold-400">
          <div className="grid gap-3.5 mb-8">
            {nobles.map(m => <MemberCard key={m.id} member={m} isAdmin={canEditAll} onDelete={canEditAll ? (id) => { const mem = members.find(x => x.id === id); if (mem) onRemove(mem); } : undefined} />)}
          </div>
        </Section>
      )}

      {regulars.length > 0 && (
        <Section icon={<Icons.Users size={16} className="text-ink-300" />} label="Members" count={regulars.length} colorClass="text-ink-300">
          <div className="grid gap-3.5">
            {regulars.map(m => <MemberCard key={m.id} member={m} isAdmin={canEditAll} onDelete={canEditAll ? (id) => { const mem = members.find(x => x.id === id); if (mem) onRemove(mem); } : undefined} />)}
          </div>
        </Section>
      )}

      {filtered.length === 0 && (
        <p className="text-ink-300 text-center py-16">No members found</p>
      )}
    </div>
  );
}

function Section({
  icon, label, count, colorClass, children,
}: { icon: React.ReactNode; label: string; count: number; colorClass: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-2.5 mt-8 mb-4">
        {icon}
        <h3 className={`text-xs uppercase tracking-widest font-bold ${colorClass}`}>{label}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 to-transparent" />
        <span className="text-xs text-ink-300">{count}</span>
      </div>
      {children}
    </>
  );
}
