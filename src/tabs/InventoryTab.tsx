import { useMemo, useState } from 'react';
import type { LanceData } from '@/lib/types';
import { EMPIRE_CATALOGUE, INVENTORY_TYPES, TYPE_COLORS } from '@/lib/catalogue';
import type { CatalogueEntry, CatalogueType } from '@/lib/types';
import { Icons } from '@/components/Icons';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  onSetInventory: (item: string, current: number, required: number) => Promise<void>;
  onLogInventory: (item: string, amount: number, direction: 'In' | 'Out' | 'Adjustment', notes?: string) => Promise<void>;
}

const TYPE_ICONS: Record<CatalogueType, typeof Icons.Package> = {
  Currency: Icons.Coins,
  'Resource Source': Icons.Briefcase,
  'Building Material': Icons.Package,
  'Crafting Material': Icons.Gem,
  Herb: Icons.Leaf,
  'Carded / Consumable Item': Icons.Wand,
  Vis: Icons.Sparkles,
  'Magic Item': Icons.Wand
};

export function InventoryTab({ data, isAdmin, onSetInventory, onLogInventory }: Props) {
  const [typeFilter, setTypeFilter] = useState<'All' | CatalogueType>('All');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(true);

  const invMap = useMemo(() => Object.fromEntries(data.inventory.map(i => [i.item, i])), [data.inventory]);

  const items = showAll ? EMPIRE_CATALOGUE : EMPIRE_CATALOGUE.filter(i => i.track);
  const filtered = items.filter(i => {
    if (typeFilter !== 'All' && i.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.item.toLowerCase().includes(q) && !(i.subType?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const grouped = new Map<CatalogueType, CatalogueEntry[]>();
  filtered.forEach(i => {
    const arr = grouped.get(i.type) ?? [];
    arr.push(i);
    grouped.set(i.type, arr);
  });
  const orderedTypes = INVENTORY_TYPES.filter(t => grouped.has(t));

  const totalTracked = EMPIRE_CATALOGUE.filter(i => i.track).length;
  const withStock = data.inventory.filter(v => v.current_qty > 0).length;
  const shortfalls = data.inventory.filter(v => v.required_qty > v.current_qty).length;

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl grid place-items-center border border-gold-500/40 text-gold-300" style={{ background: 'linear-gradient(180deg, rgba(212,180,109,0.3), rgba(212,180,109,0.1))', boxShadow: '0 0 24px rgba(212,180,109,0.25)' }}>
            <Icons.Package size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Inventory</h2>
            <p className="text-sm text-ink-100/60 m-0 tracking-wide">
              {EMPIRE_CATALOGUE.length} catalogue items · {totalTracked} trackable · {withStock} held · {shortfalls > 0 ? `${shortfalls} short` : 'no shortfalls'}
            </p>
          </div>
        </div>
        <MoneyHelper inventory={invMap} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
          <input className="input pl-10" placeholder="Search items, sub-types..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['All', ...INVENTORY_TYPES] as const).map(t => {
            const isActive = typeFilter === t;
            const c = t === 'All' ? '#d4b46d' : TYPE_COLORS[t];
            const TypeIcon = t !== 'All' ? TYPE_ICONS[t] : null;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: isActive ? `linear-gradient(180deg, ${c}30, ${c}15)` : 'transparent',
                  color: isActive ? c : 'rgba(232, 230, 227, 0.5)',
                  borderColor: isActive ? `${c}50` : 'rgba(201, 169, 97, 0.15)',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                {TypeIcon && <TypeIcon size={13} />}
                {t}
              </button>
            );
          })}
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gold-500/15 rounded-lg cursor-pointer text-xs text-ink-100/60">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          Show all items
        </label>
      </div>

      {/* Tables */}
      {orderedTypes.map(type => {
        const list = grouped.get(type)!;
        const TypeIcon = TYPE_ICONS[type];
        const c = TYPE_COLORS[type];
        return (
          <div key={type} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg grid place-items-center border" style={{ color: c, background: `linear-gradient(180deg, ${c}30, ${c}15)`, borderColor: `${c}40` }}>
                <TypeIcon size={16} />
              </div>
              <h3 className="text-sm uppercase tracking-widest font-bold m-0 font-sans" style={{ color: c }}>{type}</h3>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${c}50, transparent)` }} />
              <span className="text-xs text-ink-100/50">{list.length} items</span>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gold-500/10">
                  <tr>
                    <Th>Item</Th>
                    <Th>Sub-type</Th>
                    <Th>Unit</Th>
                    <Th center>Current</Th>
                    <Th center>Required</Th>
                    <Th center>Status</Th>
                    {isAdmin && <Th center>Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, idx) => {
                    const stock = invMap[item.item] ?? { item: item.item, current_qty: 0, required_qty: 0 };
                    const status = stock.required_qty === 0 ? null : stock.current_qty >= stock.required_qty ? 'OK' : `−${stock.required_qty - stock.current_qty}`;
                    return (
                      <tr key={item.item} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                        <td className="px-4 py-3 text-sm font-semibold align-top">
                          {item.item}
                          {item.notes && <div className="text-[11px] text-ink-100/50 font-normal mt-0.5">{item.notes}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-100/60">{item.subType ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-ink-100/60">{item.unit ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {isAdmin ? (
                            <input
                              type="number"
                              defaultValue={stock.current_qty}
                              onBlur={e => {
                                const v = parseInt(e.target.value, 10) || 0;
                                if (v !== stock.current_qty) onSetInventory(item.item, v, stock.required_qty);
                              }}
                              className="w-20 px-2 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm font-bold text-center"
                            />
                          ) : (
                            <span className="font-bold">{stock.current_qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAdmin ? (
                            <input
                              type="number"
                              defaultValue={stock.required_qty}
                              onBlur={e => {
                                const v = parseInt(e.target.value, 10) || 0;
                                if (v !== stock.required_qty) onSetInventory(item.item, stock.current_qty, v);
                              }}
                              className="w-20 px-2 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm text-ink-100/70 text-center"
                            />
                          ) : (
                            <span className="text-ink-100/70">{stock.required_qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status && (
                            <span className={status === 'OK' ? 'pill pill-active' : 'pill pill-kia'}>{status === 'OK' ? '✓ OK' : status}</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex gap-1">
                              <button onClick={() => onLogInventory(item.item, 1, 'In')} className="px-2.5 py-1 bg-sage-500/15 text-sage-500 border border-sage-500/30 rounded font-bold text-sm">+</button>
                              <button onClick={() => onLogInventory(item.item, 1, 'Out')} disabled={stock.current_qty <= 0} className="px-2.5 py-1 bg-red-500/15 text-red-300 border border-red-500/30 rounded font-bold text-sm disabled:opacity-30">−</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && <p className="text-center py-16 text-ink-100/50">No items match your filters</p>}

      {data.inventoryLog.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-display font-bold text-gold-300 mb-3">Recent Transactions</h3>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gold-500/10">
                <tr>
                  <Th>When</Th>
                  <Th>Item</Th>
                  <Th center>Direction</Th>
                  <Th right>Amount</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {data.inventoryLog.slice(0, 15).map((entry, idx) => (
                  <tr key={entry.id} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                    <td className="px-4 py-2.5 text-xs text-ink-100/60">{new Date(entry.ts).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold">{entry.item}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={entry.direction === 'In' ? 'pill pill-active' : 'pill pill-kia'}>{entry.direction}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold">{entry.amount}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-100/60">{entry.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, center, right }: { children: React.ReactNode; center?: boolean; right?: boolean }) {
  return (
    <th className={`px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-ink-100 ${center ? 'text-center' : right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function MoneyHelper({ inventory }: { inventory: Record<string, { current_qty: number; required_qty: number }> }) {
  const [rings, setRings] = useState(0);
  const [crowns, setCrowns] = useState(0);
  const [thrones, setThrones] = useState(0);

  const totalRings = rings + crowns * 20 + thrones * 160;

  function useStockpile() {
    setRings(inventory['Ring']?.current_qty ?? 0);
    setCrowns(inventory['Crown']?.current_qty ?? 0);
    setThrones(inventory['Throne']?.current_qty ?? 0);
  }

  return (
    <div className="card p-4 min-w-[320px]" style={{ borderLeft: '3px solid #e0c66d' }}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-gold-300 uppercase tracking-widest m-0">💰 Money Helper</h4>
        <button onClick={useStockpile} className="btn btn-ghost btn-sm">Use Stockpile</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <NumberInput label="Rings" value={rings} onChange={setRings} />
        <NumberInput label="Crowns" value={crowns} onChange={setCrowns} />
        <NumberInput label="Thrones" value={thrones} onChange={setThrones} />
      </div>
      <div className="bg-black/30 rounded-lg px-3 py-2.5 text-xs space-y-1">
        <div className="flex justify-between"><span className="text-ink-100/60">Total Rings:</span><span className="font-bold">{totalRings.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-ink-100/60">= Crowns:</span><span className="font-bold">{(totalRings / 20).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-ink-100/60">= Thrones:</span><span className="font-bold">{(totalRings / 160).toFixed(3)}</span></div>
      </div>
      <div className="text-[10px] text-ink-100/50 mt-2 text-center">20 rings = 1 crown · 8 crowns = 1 throne</div>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="text-[10px] text-ink-100/60 block mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full px-2 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm"
      />
    </div>
  );
}
