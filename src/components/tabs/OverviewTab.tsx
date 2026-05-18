import type { LanceData } from '@/lib/types';
import { Icons } from '@/lib/icons';
import { parseCoin } from '@/lib/utils';

interface Props {
  data: LanceData;
}

const RESOURCE_META: Record<string, { color: string; Icon: typeof Icons.Gem }> = {
  'Military Unit': { color: '#a8413f', Icon: Icons.Swords },
  'Mana Site':     { color: '#b56eb5', Icon: Icons.Sparkles },
  'Mana Crystals': { color: '#b56eb5', Icon: Icons.Sparkles },
  'Herb Garden':   { color: '#7ed47e', Icon: Icons.Leaf },
  'Farm':          { color: '#e0c66d', Icon: Icons.Leaf },
  'Forest':        { color: '#7ea88e', Icon: Icons.Leaf },
  'Mine':          { color: '#c0c0c0', Icon: Icons.Gem },
  'Fleet':         { color: '#7eb0d4', Icon: Icons.Briefcase },
  'Business':      { color: '#e0c66d', Icon: Icons.Briefcase },
  'Congregation':  { color: '#d4b46d', Icon: Icons.Sparkles },
};
function resourceMetaFor(name: string) {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(RESOURCE_META)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return meta;
  }
  return { color: '#d4b46d', Icon: Icons.Gem };
}

export function OverviewTab({ data }: Props) {
  const totalMembers = data.members.filter(m => m.house_id).length;
  const covenMembers = data.members.filter(m => m.coven_id).length;
  const nobles = data.members.filter(m => m.is_noble).length;
  const active = data.members.filter(m => m.status === 'active').length;

  // Resource aggregation
  const resourceCounts = new Map<string, number>();
  for (const m of data.members) {
    if (m.resource) {
      const key = m.resource.trim();
      resourceCounts.set(key, (resourceCounts.get(key) ?? 0) + 1);
    }
  }
  const resourceList = [...resourceCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Treasury
  const rings = data.inventory['Ring']?.current_qty ?? 0;
  const crowns = data.inventory['Crown']?.current_qty ?? 0;
  const thrones = data.inventory['Throne']?.current_qty ?? 0;
  const totalRings = rings + crowns * 20 + thrones * 160;

  // Income per event
  const incomeRings = data.members.reduce((sum, m) => sum + parseCoin(m.coin_per_event), 0);
  const stipendCount = data.members.filter(m => m.coin_per_event).length;

  const stats = [
    { label: 'Total Members', value: totalMembers,         Icon: Icons.Users,     color: '#d4b46d' },
    { label: 'Coven Members', value: covenMembers,         Icon: Icons.Sparkles,  color: '#b56eb5' },
    { label: 'Nobles',        value: nobles,               Icon: Icons.Crown,     color: '#e0c66d' },
    { label: 'Active',        value: active,               Icon: Icons.Heart,     color: '#6dd47e' },
    { label: 'Businesses',    value: data.businesses.length, Icon: Icons.Briefcase, color: '#7eb0d4' },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="font-display font-semibold text-3xl gold-text mb-1">Lance Overview</h2>
      <p className="text-ink-300 text-sm mb-8">At a glance: rosters, nobility, and holdings of the Serrated Claws</p>

      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="card card-lift p-6 relative overflow-hidden">
            <div
              className="absolute -top-8 -right-8 w-32 h-32 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${s.color}20, transparent 70%)` }}
            />
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3.5"
              style={{ background: `linear-gradient(180deg, ${s.color}30, ${s.color}15)`, border: `1px solid ${s.color}40`, color: s.color }}
            >
              <s.Icon size={20} />
            </div>
            <div className="font-display font-bold text-4xl leading-none mb-1.5">{s.value}</div>
            <div className="text-[11px] text-ink-300 uppercase tracking-widest font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Treasury & Income */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 mb-10">
        <div className="card card-lift p-6 relative overflow-hidden border-l-[3px] border-l-[#e0c66d]">
          <div className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(224,198,109,0.15), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(180deg, rgba(224,198,109,0.3), rgba(224,198,109,0.15))', border: '1px solid rgba(224,198,109,0.4)', color: '#e0c66d' }}>
              <Icons.Coins size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#e0c66d] uppercase tracking-widest font-sans">Treasury</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <CoinTile label="Rings"   value={rings}   color="#c0a060" />
            <CoinTile label="Crowns"  value={crowns}  color="#d4b46d" />
            <CoinTile label="Thrones" value={thrones} color="#f0d488" />
          </div>
          <div className="px-3.5 py-3 bg-black/30 rounded-lg text-xs flex justify-between flex-wrap gap-2">
            <div><span className="text-ink-300">Total: </span><span className="text-[#e0c66d] font-bold">{totalRings.toLocaleString()} r</span></div>
            <div className="text-ink-300">
              ≈ <span className="text-ink-100 font-semibold">{(totalRings/20).toFixed(1)} c</span>
              <span> · </span>
              <span className="text-ink-100 font-semibold">{(totalRings/160).toFixed(2)} t</span>
            </div>
          </div>
        </div>

        <div className="card card-lift p-6 relative overflow-hidden border-l-[3px] border-l-success-400">
          <div className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(109,212,126,0.12), transparent 70%)' }} />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(180deg, rgba(109,212,126,0.25), rgba(109,212,126,0.12))', border: '1px solid rgba(109,212,126,0.4)', color: '#6dd47e' }}>
              <Icons.Zap size={20} />
            </div>
            <h3 className="text-sm font-bold text-success-400 uppercase tracking-widest font-sans">Income Per Event</h3>
          </div>
          <div className="font-display font-bold text-4xl text-success-400 leading-none mb-2">
            {incomeRings.toLocaleString()}
            <span className="text-base text-ink-300 ml-2 font-sans font-medium">rings</span>
          </div>
          <div className="text-xs text-ink-300">
            ≈ {(incomeRings/20).toFixed(1)} crowns · {(incomeRings/160).toFixed(2)} thrones
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-gold-500/15 text-xs text-ink-300">
            Aggregated from {stipendCount} members with stipend
          </div>
        </div>
      </div>

      {/* Resource Holdings */}
      {resourceList.length > 0 && (
        <>
          <SectionHeader Icon={Icons.Gem} label="Resource Holdings" count={`${resourceList.length} types`} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mb-10">
            {resourceList.map(([name, count]) => {
              const meta = resourceMetaFor(name);
              return (
                <div key={name} className="card card-lift p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: `linear-gradient(180deg, ${meta.color}30, ${meta.color}15)`, border: `1px solid ${meta.color}40`, color: meta.color }}>
                    <meta.Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-ink-300 uppercase tracking-wider mb-0.5">{name}</div>
                    <div className="font-display font-bold text-2xl leading-none">{count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Houses */}
      <SectionHeader Icon={Icons.Shield} label="The Houses" count={data.houses.length} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {data.houses.map(house => {
          const houseMembers = data.members.filter(m => m.house_id === house.id);
          const houseNobles = houseMembers.filter(m => m.is_noble).length;
          return (
            <div key={house.id} className="card card-lift p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                   style={{ background: `linear-gradient(90deg, ${house.primary_color}, transparent)` }} />
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                     style={{ background: `linear-gradient(180deg, ${house.primary_color}30, ${house.primary_color}15)`, border: `1px solid ${house.primary_color}40`, color: house.primary_color }}>
                  <Icons.Shield size={22} />
                </div>
                <h4 className="font-display font-semibold text-[17px]">{house.name}</h4>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-0.5">Members</div>
                  <div className="font-display font-bold text-xl">{houseMembers.length}</div>
                </div>
                <div>
                  <div className="text-ink-300 text-[11px] uppercase tracking-wider mb-0.5">Nobles</div>
                  <div className="font-display font-bold text-xl" style={{ color: house.primary_color }}>{houseNobles}</div>
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
    <div className="bg-black/25 rounded-lg px-3 py-2.5 text-center" style={{ border: `1px solid ${color}30` }}>
      <div className="text-[10px] text-ink-300 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display font-bold text-[22px] leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

function SectionHeader({ Icon, label, count }: { Icon: typeof Icons.Gem; label: string; count: number | string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={18} className="text-gold-400" />
      <h3 className="text-sm uppercase tracking-widest font-bold text-gold-400 font-sans">{label}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 to-transparent" />
      <span className="text-xs text-ink-300">{count}</span>
    </div>
  );
}
