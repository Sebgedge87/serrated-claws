import { useEffect, useState } from 'react';
import { memberIncomeRings } from '@/lib/utils';
import { useLance } from '@/contexts/LanceContext';
import { InventoryTab } from '@/tabs/InventoryTab';
import { BusinessesTab } from '@/tabs/BusinessesTab';

type TreasuryView = 'holdings' | 'stock' | 'ventures';

const SUB_TABS: { id: TreasuryView; label: string }[] = [
  { id: 'holdings', label: 'Holdings' },
  { id: 'stock', label: 'Stock' },
  { id: 'ventures', label: 'Ventures' },
];

export function BankTab({ canManageBusiness, initialView }: { canManageBusiness: (id: string) => boolean; initialView?: TreasuryView }) {
  const [view, setView] = useState<TreasuryView>(initialView ?? 'holdings');
  const { data, isAdmin, settings, setInventory: onUpsertInventory } = useLance();
  const lanceName = settings?.name;
  const inv = Object.fromEntries(data.inventory.map(i => [i.item, i]));
  const rings   = inv['Ring']?.current_qty   ?? 0;
  const crowns  = inv['Crown']?.current_qty  ?? 0;
  const thrones = inv['Throne']?.current_qty ?? 0;
  const totalInRings = rings + crowns * 20 + thrones * 160;

  // Income
  const grossIncomeRings = data.members.reduce(
    (sum, m) => sum + memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event),
    0,
  );
  const tithingRings = Math.round(grossIncomeRings * 0.1);

  const incomeMembers = data.members
    .filter(m => memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event) > 0)
    .map(m => ({
      name: m.name,
      rings: m.rings_per_event ?? 0,
      crowns: m.crowns_per_event ?? 0,
      thrones: m.thrones_per_event ?? 0,
      total: memberIncomeRings(m.rings_per_event, m.crowns_per_event, m.thrones_per_event),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* Title */}
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 600, lineHeight: 1.1, color: 'var(--gold)', marginBottom: '4px' }}>
        Treasury
      </h2>
      <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '14px', color: 'rgb(var(--ink-300))', marginBottom: '20px' }}>
        House funds and income{lanceName ? ` — ${lanceName}` : ''}
      </p>

      {/* Sub-tab nav */}
      <div className="flex gap-1 mb-8 border-b border-gold-500/15 pb-0">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className="px-4 py-2 text-sm font-semibold transition-colors relative"
            style={{
              color: view === t.id ? 'var(--gold)' : 'rgb(var(--ink-300))',
              borderBottom: view === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'stock' && <InventoryTab />}
      {view === 'ventures' && <BusinessesTab canManageBusiness={canManageBusiness} />}
      {view !== 'holdings' ? null : (<>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 mb-10">
        {/* Treasury panel */}
        <div className="card p-6">
          <div className="eyebrow mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Current Holdings</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {([
              { label: 'Rings',   value: rings,   key: 'Ring' },
              { label: 'Crowns',  value: crowns,  key: 'Crown' },
              { label: 'Thrones', value: thrones, key: 'Throne' },
            ] as { label: string; value: number; key: string }[]).map(t => (
              <div key={t.label} style={{ background: 'var(--inset)', borderRadius: '6px', padding: '10px 8px', textAlign: 'center', border: '1px solid var(--line-soft)' }}>
                <div className="eyebrow" style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{t.label}</div>
                {isAdmin && onUpsertInventory ? (
                  <EditableQty
                    value={t.value}
                    onChange={v => onUpsertInventory(t.key, v, inv[t.key]?.required_qty ?? 0)}
                  />
                ) : (
                  <div className="num" style={{ fontSize: '22px', color: 'var(--gold)', lineHeight: 1 }}>{t.value.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px', fontSize: '13px', color: 'rgb(var(--ink-300))' }}>
            <div style={{ marginBottom: '4px' }}>
              Total:{' '}
              <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{totalInRings.toLocaleString()} rings</span>
            </div>
            <div>
              ≈{' '}
              <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(totalInRings / 20).toFixed(1)} crowns</span>
              {' · '}
              <span className="num" style={{ color: 'rgb(var(--ink-100))' }}>{(totalInRings / 160).toFixed(2)} thrones</span>
            </div>
          </div>
        </div>

        {/* Income / Tithe panel */}
        <div className="card p-6">
          <div className="eyebrow mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Lance Tithe Per Event</div>
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
            <div>10% tithe from {incomeMembers.length} member{incomeMembers.length !== 1 ? 's' : ''} with stipend</div>
            {isAdmin && (
              <div style={{ marginTop: '4px' }}>
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

      {/* Businesses */}
      {data.businesses.length > 0 && (
        <div className="mb-10">
          <div className="eyebrow mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Lance Businesses
          </div>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'rgb(var(--ink-800))',
            }}
          >
            {data.businesses.map((b, i) => {
              const owners = b.owners
                .map(id => data.members.find(m => m.id === id)?.name)
                .filter(Boolean) as string[];
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgb(var(--ink-100))' }}>{b.name}</div>
                    {b.type && <div style={{ fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{b.type}</div>}
                    {b.notes && <div style={{ fontSize: '12px', color: 'rgb(var(--ink-300))', marginTop: '2px', fontStyle: 'italic' }}>{b.notes}</div>}
                  </div>
                  {owners.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'rgb(var(--ink-300))', textAlign: 'right', flexShrink: 0 }}>
                      {owners.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-member income breakdown */}
      {incomeMembers.length > 0 && (
        <div className="mb-10">
          <div className="eyebrow mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Member Income Breakdown
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--line)]">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-bold text-ink-100">Member</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-widest font-bold text-ink-100">Rings / event</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-widest font-bold text-ink-100">Crowns / event</th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-widest font-bold text-ink-100">Thrones / event</th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-widest font-bold text-ink-100">Total rings</th>
                </tr>
              </thead>
              <tbody>
                {incomeMembers.map((m, idx) => (
                  <tr key={m.name} className={idx > 0 ? 'border-t border-[color:var(--line-soft)]' : ''}>
                    <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: 'rgb(var(--ink-100))' }}>{m.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="num text-sm" style={{ color: m.rings > 0 ? 'rgb(var(--ink-100))' : 'rgb(var(--ink-300))' }}>{m.rings > 0 ? m.rings : '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="num text-sm" style={{ color: m.crowns > 0 ? 'rgb(var(--ink-100))' : 'rgb(var(--ink-300))' }}>{m.crowns > 0 ? m.crowns : '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="num text-sm" style={{ color: m.thrones > 0 ? 'rgb(var(--ink-100))' : 'rgb(var(--ink-300))' }}>{m.thrones > 0 ? m.thrones : '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="num text-sm" style={{ color: 'var(--gold)' }}>{m.total.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory transaction log */}
      {data.inventoryLog.length > 0 && (
        <div className="mb-10">
          <div className="eyebrow mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Recent Transactions
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--line)]">
                  <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-widest font-bold text-ink-100/60">Item</th>
                  <th className="px-4 py-2.5 text-center text-[11px] uppercase tracking-widest font-bold text-ink-100/60">Direction</th>
                  <th className="px-4 py-2.5 text-center text-[11px] uppercase tracking-widest font-bold text-ink-100/60">Amount</th>
                  <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-widest font-bold text-ink-100/60 hidden sm:table-cell">Notes</th>
                  <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-widest font-bold text-ink-100/60 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.inventoryLog.map((entry, idx) => {
                  const dirColor = entry.direction === 'In' ? 'var(--ok)' : entry.direction === 'Out' ? 'var(--danger)' : 'rgb(var(--ink-300))';
                  return (
                    <tr key={entry.id} className={idx > 0 ? 'border-t border-[color:var(--line-soft)]' : ''}>
                      <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'rgb(var(--ink-100))' }}>{entry.item}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="text-xs font-semibold" style={{ color: dirColor }}>{entry.direction}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="num text-sm" style={{ color: dirColor }}>{entry.direction === 'Out' ? '−' : '+'}{entry.amount}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-ink-100/60 hidden sm:table-cell">{entry.notes ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-ink-100/50 text-right hidden sm:table-cell">
                        {new Date(entry.ts).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}

function EditableQty({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setLocal(value); }, [value]);

  async function commit(v: number) {
    if (v === value || busy) return;
    setBusy(true);
    try { await onChange(v); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <button
        onClick={async () => { const nv = Math.max(0, local - 1); setLocal(nv); await commit(nv); }}
        disabled={busy || local <= 0}
        style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(180,50,50,0.2)', color: '#f87171', border: '1px solid rgba(180,50,50,0.3)', fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >−</button>
      <input
        type="number"
        value={local}
        onChange={e => setLocal(parseInt(e.target.value, 10) || 0)}
        onBlur={e => commit(parseInt(e.target.value, 10) || 0)}
        style={{ width: '52px', textAlign: 'center', background: 'transparent', border: 'none', fontFamily: 'inherit', fontSize: '22px', color: 'var(--gold)', fontWeight: 700 }}
      />
      <button
        onClick={async () => { const nv = local + 1; setLocal(nv); await commit(nv); }}
        disabled={busy}
        style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(109,212,126,0.2)', color: '#6dd47e', border: '1px solid rgba(109,212,126,0.3)', fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >+</button>
    </div>
  );
}
