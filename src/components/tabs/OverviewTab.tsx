import type { Member, LanceData } from '@/lib/types';
import { memberIncomeRings, monogramOf } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface Props {
  data: LanceData;
  filteredMembers: Member[];
  isAdmin: boolean;
  onNavigate?: (tab: string) => void;
}

const HOUSE_COLORS = ['#d4b46d', '#a8413f', '#7eb0d4', '#9c7eb0', '#7ea88e'];

const RESOURCE_META: Record<string, { color: string }> = {
  'Military Unit': { color: '#a8413f' },
  'Mana Site':     { color: '#b56eb5' },
  'Mana Crystals': { color: '#b56eb5' },
  'Herb Garden':   { color: '#7ed47e' },
  Farm:            { color: '#e0c66d' },
  Forest:          { color: '#7ea88e' },
  Mine:            { color: '#c0c0c0' },
  Fleet:           { color: '#7eb0d4' },
  Business:        { color: '#e0c66d' },
  Congregation:    { color: '#d4b46d' },
};

function getResourceColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(RESOURCE_META)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return meta.color;
  }
  return '#d4b46d';
}

export function OverviewTab({ data, filteredMembers, isAdmin, onNavigate }: Props) {
  const totalMembers = data.members.length;
  const coven = data.members.filter(m => m.coven).length;
  const nobles = filteredMembers.filter(m => m.is_noble);

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
  const rings  = inv['Ring']?.current_qty   ?? 0;
  const crowns = inv['Crown']?.current_qty  ?? 0;
  const thrones = inv['Throne']?.current_qty ?? 0;
  const totalInRings = rings + crowns * 20 + thrones * 160;

  // Income per event + tithe
  const grossIncomeRings = data.members.reduce(
    (sum, m) => sum + memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event),
    0
  );
  const tithingRings = Math.round(grossIncomeRings * 0.1);
  const incomeMembers = data.members.filter(
    m => memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event) > 0
  ).length;

  return (
    <div>
      {/* Title */}
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 600, lineHeight: 1.1, color: 'var(--gold)', marginBottom: '4px' }}>
        Lance Overview
      </h2>
      <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '14px', color: 'rgb(var(--ink-300))', marginBottom: '32px' }}>
        At a glance: rosters, nobility, and holdings of your group
      </p>

      {/* Stat strip — ONE bordered row */}
      <div
        className="mb-10"
        style={{
          border: '1px solid var(--line)',
          borderRadius: '8px',
          display: 'flex',
          overflow: 'hidden',
          background: 'rgb(var(--ink-800))',
        }}
      >
        {[
          { label: 'Members',        value: totalMembers,        tab: 'roster' as string | null },
          { label: 'Nobles',         value: nobles.length,       tab: 'roster' as string | null },
          { label: 'Coven Members',  value: coven,               tab: 'covens' as string | null },
          { label: 'Covens',         value: data.members.filter(m => m.coven).length, tab: 'covens' as string | null },
          { label: 'Businesses',     value: data.businesses.length, tab: 'businesses' as string | null },
        ].map((s, i) => (
          <div
            key={s.label}
            onClick={() => s.tab && onNavigate?.(s.tab)}
            style={{
              flex: 1,
              padding: '18px 16px',
              borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
              cursor: s.tab ? 'pointer' : 'default',
              textAlign: 'center',
            }}
            className={s.tab ? 'hover:bg-white/[0.02] transition-colors' : ''}
          >
            <div className="num" style={{ fontSize: '32px', color: 'rgb(var(--ink-100))', lineHeight: 1, marginBottom: '5px' }}>{s.value}</div>
            <div className="eyebrow" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Treasury & Income — two flat panels */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 mb-10">
        {/* Treasury */}
        <div className="card p-6 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => onNavigate?.('treasury')}>
          <div className="eyebrow mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Treasury</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Rings',   value: rings },
              { label: 'Crowns',  value: crowns },
              { label: 'Thrones', value: thrones },
            ].map(t => (
              <div key={t.label} style={{ background: 'var(--inset)', borderRadius: '6px', padding: '10px 8px', textAlign: 'center', border: '1px solid var(--line-soft)' }}>
                <div className="eyebrow" style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{t.label}</div>
                <div className="num" style={{ fontSize: '22px', color: 'var(--gold)', lineHeight: 1 }}>{t.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'rgb(var(--ink-300))' }}>
            ≈{' '}
            <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(totalInRings / 20).toFixed(1)} crowns</span>
            {' · '}
            <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(totalInRings / 160).toFixed(2)} thrones</span>
          </div>
        </div>

        {/* Tithe */}
        <div className="card p-6 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => onNavigate?.('treasury')}>
          <div className="eyebrow mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Group Tithe Per Event</div>
          <div className="num" style={{ fontSize: '38px', color: 'var(--ok)', lineHeight: 1, marginBottom: '6px' }}>
            {tithingRings.toLocaleString()}
            <span style={{ fontFamily: "'Spectral', serif", fontSize: '14px', color: 'rgb(var(--ink-300))', marginLeft: '8px', fontVariantNumeric: 'normal' }}>rings / event</span>
          </div>
          <div style={{ fontSize: '13px', color: 'rgb(var(--ink-300))', marginBottom: '12px' }}>
            ≈{' '}
            <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(tithingRings / 20).toFixed(1)} crowns</span>
            {' · '}
            <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(tithingRings / 160).toFixed(2)} thrones</span>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px', fontSize: '12px', color: 'rgb(var(--ink-300))' }}>
            <div>10% tithe from {incomeMembers} member{incomeMembers !== 1 ? 's' : ''} with stipend</div>
            {isAdmin && (
              <div style={{ marginTop: '4px', color: 'rgb(var(--ink-300))' }}>
                Gross income:{' '}
                <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{grossIncomeRings.toLocaleString()} r</span>
                <span style={{ marginLeft: '6px' }}>
                  ≈{' '}
                  <span className="num">{(grossIncomeRings / 20).toFixed(1)} c</span>
                  {' · '}
                  <span className="num">{(grossIncomeRings / 160).toFixed(2)} t</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Holdings */}
      {resourceList.length > 0 && (
        <>
          <SectionHeader title="Resource Holdings"  />
          <div
            className="mb-10"
            style={{
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              overflow: 'hidden',
              background: 'rgb(var(--ink-800))',
            }}
          >
            {resourceList.map(([name, count], i) => {
              const color = getResourceColor(name);
              return (
                <div
                  key={name}
                  onClick={() => onNavigate?.('inventory')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    flex: '1 1 auto',
                  }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <span className="swatch-dot" style={{ '--c': color } as React.CSSProperties} />
                  <span style={{ fontSize: '11px', fontFamily: "'Figtree', system-ui, sans-serif", color: 'rgb(var(--ink-300))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{name}</span>
                  <span className="num" style={{ fontSize: '18px', color: 'rgb(var(--ink-100))', marginLeft: 'auto' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* The Houses */}
      <SectionHeader title="The Houses"  />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {data.houses.map((house, idx) => {
          const c = house.primary_color ?? HOUSE_COLORS[idx % HOUSE_COLORS.length];
          const members = data.members.filter(m => m.house_id === house.id);
          const houseNobles = members.filter(m => m.is_noble).length;
          return (
            <div
              key={house.id}
              onClick={() => onNavigate?.(house.id)}
              className="card cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{ padding: '0', overflow: 'hidden' }}
            >
              {/* Thin house-colour top rule */}
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${c}, transparent)` }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  {/* Crest monogram + name/motto */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        border: `1px solid ${c}50`,
                        background: `${c}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '16px',
                        fontWeight: 600,
                        color: c,
                      }}
                    >
                      {monogramOf(house.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: 600, color: 'rgb(var(--ink-100))', lineHeight: 1.2, marginBottom: '3px' }}>
                        {house.name}
                      </div>
                      {house.motto && (
                        <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '12px', color: 'rgb(var(--ink-300))', lineHeight: 1.4 }}>
                          {house.motto}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Members + Nobles counts */}
                  <div style={{ display: 'flex', gap: '16px', flexShrink: 0, textAlign: 'right' }}>
                    <div>
                      <div className="eyebrow" style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Members</div>
                      <div className="num" style={{ fontSize: '20px', color: 'rgb(var(--ink-100))', lineHeight: 1 }}>{members.length}</div>
                    </div>
                    <div>
                      <div className="eyebrow" style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Nobles</div>
                      <div className="num" style={{ fontSize: '20px', color: c, lineHeight: 1 }}>{houseNobles}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
