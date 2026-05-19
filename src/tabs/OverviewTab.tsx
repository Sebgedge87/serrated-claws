import type { Member, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { parseCoinToRings } from '@/lib/utils';

interface Props {
  data: LanceData;
  filteredMembers: Member[];
  isAdmin: boolean;
}

const HOUSE_COLORS = ['#d4b46d', '#a8413f', '#7eb0d4', '#9c7eb0', '#7ea88e'];

const RESOURCE_META: Record<string, { color: string; Icon: typeof Icons.Gem }> = {
  'Military Unit': { color: '#a8413f', Icon: Icons.Swords },
  'Mana Site': { color: '#b56eb5', Icon: Icons.Sparkles },
  'Mana Crystals': { color: '#b56eb5', Icon: Icons.Sparkles },
  'Herb Garden': { color: '#7ed47e', Icon: Icons.Leaf },
  Farm: { color: '#e0c66d', Icon: Icons.Leaf },
  Forest: { color: '#7ea88e', Icon: Icons.Leaf },
  Mine: { color: '#c0c0c0', Icon: Icons.Gem },
  Fleet: { color: '#7eb0d4', Icon: Icons.Briefcase },
  Business: { color: '#e0c66d', Icon: Icons.Briefcase },
  Congregation: { color: '#d4b46d', Icon: Icons.Sparkles }
};

function getResourceMeta(name: string) {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(RESOURCE_META)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return meta;
  }
  return { color: '#d4b46d', Icon: Icons.Gem };
}

export function OverviewTab({ data, filteredMembers, isAdmin }: Props) {
  const totalMembers = data.members.length;
  const coven = data.members.filter(m => m.coven).length;
  const nobles = filteredMembers.filter(m => m.is_noble);
  const active = filteredMembers.filter(m => m.status === 'active');

  // Resources aggregated
  const resourceCounts = new Map<string, number>();
  data.members.forEach(m => {
    if (m.resource) {
      const key = m.resource.trim();
      resourceCounts.set(key, (resourceCounts.get(key) ?? 0) + 1);
    }
  });
  const resourceList = [...resourceCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Treasury
  const inv = Object.fromEntries(data.inventory.map(i => [i.item, i]));
  const rings = inv['Ring']?.current_qty ?? 0;
  const crowns = inv['Crown']?.current_qty ?? 0;
  const thrones = inv['Throne']?.current_qty ?? 0;
  const totalInRings = rings + crowns * 20 + thrones * 160;

  // Income per event + tithe
  const grossIncomeRings = data.members.reduce((sum, m) => sum + parseCoinToRings(m.coin_per_event), 0);
  const tithingRings = Math.round(grossIncomeRings * 0.1);
  const incomeMembers = data.members.filter(m => m.coin_per_event).length;

  const stats = [
    { label: 'Total Members', value: totalMembers, Icon: Icons.Users, color: '#d4b46d' },
    { label: 'Coven Members', value: coven, Icon: Icons.Sparkles, color: '#b56eb5' },
    { label: 'Nobles', value: nobles.length, Icon: Icons.Crown, color: '#e0c66d' },
    { label: 'Active', value: active.length, Icon: Icons.Heart, color: '#6dd47e' },
    { label: 'Businesses', value: data.businesses.length, Icon: Icons.Briefcase, color: '#7eb0d4' }
  ];

  return (
    <div>
      <h2 className="text-3xl font-display font-semibold mb-2 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Lance Overview</h2>
      <p className="text-sm text-ink-100/60 mb-8">At a glance: rosters, nobility, and holdings of the Serrated Claws</p>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="card card-lift p-6 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${s.color}20, transparent 70%)` }} />
            <div className="w-10 h-10 rounded-xl grid place-items-center mb-3.5 border" style={{ color: s.color, background: `linear-gradient(180deg, ${s.color}30, ${s.color}15)`, borderColor: `${s.color}40` }}>
              <s.Icon size={20} />
            </div>
            <div className="text-[40px] font-display font-bold text-ink-100 leading-none mb-1.5">{s.value}</div>
            <div className="text-[11px] uppercase tracking-widest text-ink-100/50 font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Treasury + Income */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 mb-10">
        <div className="card card-lift p-6 relative overflow-hidden" style={{ borderLeft: '3px solid #e0c66d' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(224,198,109,0.15), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl grid place-items-center text-gold-300 border border-gold-300/40" style={{ background: 'linear-gradient(180deg, rgba(224,198,109,0.3), rgba(224,198,109,0.15))' }}>
              <Icons.Coins size={20} />
            </div>
            <h3 className="text-sm font-bold text-gold-300 m-0 uppercase tracking-widest">Treasury</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <CoinTile label="Rings" value={rings} color="#c0a060" />
            <CoinTile label="Crowns" value={crowns} color="#d4b46d" />
            <CoinTile label="Thrones" value={thrones} color="#f0d488" />
          </div>
          <div className="px-3.5 py-3 bg-black/30 rounded-lg text-xs flex justify-between flex-wrap gap-2">
            <div>
              <span className="text-ink-100/60">Total: </span>
              <span className="text-gold-300 font-bold">{totalInRings.toLocaleString()} r</span>
            </div>
            <div className="text-ink-100/80">
              ≈ <span className="font-semibold text-ink-100">{(totalInRings / 20).toFixed(1)} c</span> · <span className="font-semibold text-ink-100">{(totalInRings / 160).toFixed(2)} t</span>
            </div>
          </div>
        </div>

        <div className="card card-lift p-6 relative overflow-hidden" style={{ borderLeft: '3px solid #6dd47e' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(109,212,126,0.12), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl grid place-items-center text-sage-500 border border-sage-500/40" style={{ background: 'linear-gradient(180deg, rgba(109,212,126,0.25), rgba(109,212,126,0.12))' }}>
              <Icons.Zap size={20} />
            </div>
            <h3 className="text-sm font-bold text-sage-500 m-0 uppercase tracking-widest">Lance Tithe Per Event</h3>
          </div>
          <div className="text-[40px] font-display font-bold text-sage-500 leading-none mb-2">
            {tithingRings.toLocaleString()}
            <span className="text-base text-ink-100/60 ml-2 font-medium font-sans">rings</span>
          </div>
          <div className="text-sm text-ink-100/60 mb-3.5">
            ≈ {(tithingRings / 20).toFixed(1)} crowns · {(tithingRings / 160).toFixed(2)} thrones
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-gold-500/15 text-xs space-y-1.5">
            <div className="text-ink-100/50">10% tithe from {incomeMembers} member{incomeMembers !== 1 ? 's' : ''} with stipend</div>
            {isAdmin && (
              <div className="text-ink-100/40">
                Gross income: <span className="text-ink-100/70 font-semibold">{grossIncomeRings.toLocaleString()} r</span>
                <span className="ml-1.5">≈ {(grossIncomeRings / 20).toFixed(1)} c · {(grossIncomeRings / 160).toFixed(2)} t</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resources */}
      {resourceList.length > 0 && (
        <>
          <SectionHeader icon={<Icons.Gem size={18} />} title="Resource Holdings" count={`${resourceList.length} types`} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mb-10">
            {resourceList.map(([name, count]) => {
              const meta = getResourceMeta(name);
              return (
                <div key={name} className="card card-lift p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl grid place-items-center border flex-shrink-0" style={{ color: meta.color, background: `linear-gradient(180deg, ${meta.color}30, ${meta.color}15)`, borderColor: `${meta.color}40` }}>
                    <meta.Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-widest text-ink-100/50 mb-0.5">{name}</div>
                    <div className="text-2xl font-display font-bold text-ink-100 leading-none">{count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Houses */}
      <SectionHeader icon={<Icons.Shield size={18} />} title="The Houses" count={data.houses.length} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {data.houses.map((house, idx) => {
          const c = house.primary_color ?? HOUSE_COLORS[idx % HOUSE_COLORS.length];
          const members = data.members.filter(m => m.house_id === house.id);
          return (
            <div key={house.id} className="card card-lift p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-xl grid place-items-center border" style={{ color: c, background: `linear-gradient(180deg, ${c}30, ${c}15)`, borderColor: `${c}40` }}>
                  <Icons.Shield size={22} />
                </div>
                <h4 className="text-base font-display font-semibold text-ink-100 m-0">{house.name}</h4>
              </div>
              {house.motto && <p className="text-xs italic text-ink-100/60 mb-3">{house.motto}</p>}
              <div className="flex gap-4 text-sm">
                <div>
                  <div className="text-ink-100/50 text-[11px] uppercase tracking-widest mb-0.5">Members</div>
                  <div className="text-xl font-display font-bold text-ink-100">{members.length}</div>
                </div>
                <div>
                  <div className="text-ink-100/50 text-[11px] uppercase tracking-widest mb-0.5">Nobles</div>
                  <div className="text-xl font-display font-bold" style={{ color: c }}>{members.filter(m => m.is_noble).length}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoinTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-black/25 rounded-lg p-2.5 text-center" style={{ border: `1px solid ${color}30` }}>
      <div className="text-[10px] uppercase tracking-widest text-ink-100/50 mb-1">{label}</div>
      <div className="text-[22px] font-display font-bold leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

export function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-gold-300">{icon}</span>
      <h3 className="text-sm uppercase tracking-widest font-bold text-gold-300 m-0 font-sans">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-gold-500/50 to-transparent" />
      {count != null && <span className="text-xs text-ink-100/50">{count}</span>}
    </div>
  );
}
