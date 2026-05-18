import { useState, useMemo } from 'react';
import type { InventoryItem, LanceData } from '@/lib/types';
import { EMPIRE_CATALOGUE, INVENTORY_TYPES, TYPE_COLORS } from '@/lib/catalogue';
import { Icons } from '@/lib/icons';

interface Props {
  data: LanceData;
  canEdit: boolean;
  onUpdateInventory: (item: string, patch: Partial<InventoryItem>) => Promise<unknown>;
  onLogTransaction: (item: string, amount: number, direction: 'In' | 'Out') => Promise<unknown>;
}

function typeIcon(type: string) {
  switch (type) {
    case 'Currency': return Icons.Coins;
    case 'Resource Source': return Icons.Briefcase;
    case 'Building Material': return Icons.Package;
    case 'Crafting Material': return Icons.Gem;
    case 'Herb': return Icons.Leaf;
    case 'Carded / Consumable Item': return Icons.Wand;
    case 'Vis': return Icons.Sparkles;
    case 'Magic Item': return Icons.Wand;
    default: return Icons.Package;
  }
}

export function InventoryTab({ data, canEdit, onUpdateInventory, onLogTransaction }: Props) {
  const [typeFilter, setTypeFilter] = useState<'All' | string>('All');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(true);

  const filtered = useMemo(() => {
    const items = showAll ? EMPIRE_CATALOGUE : EMPIRE_CATALOGUE.filter(i => i.track);
    return items.filter(i => {
      if (typeFilter !== 'All' && i.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.item.toLowerCase().includes(q) && !(i.subType ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [showAll, typeFilter, search]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof EMPIRE_CATALOGUE> = {};
    for (const item of filtered) {
      (g[item.type] ??= []).push(item);
    }
    return INVENTORY_TYPES.filter(t => g[t]).map(t => [t, g[t]] as const);
  }, [filtered]);

  const totalTracked = EMPIRE_CATALOGUE.filter(i => i.track).length;
  const withStock = Object.values(data.inventory).filter(v => v.current_qty > 0).length;
  const shortfalls = Object.values(data.inventory).filter(v => v.required_qty > v.current_qty).length;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gold-400"
               style={{ background: 'linear-gradient(180deg, rgba(212,180,109,0.3), rgba(212,180,109,0.1))', border: '1px solid rgba(212,180,109,0.4)', boxShadow: '0 0 24px rgba(212,180,109,0.25)' }}>
            <Icons.Package size={24} />
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl gold-text">Inventory</h2>
            <p className="text-xs text-ink-300 tracking-wide">
              {EMPIRE_CATALOGUE.length} catalogue items · {totalTracked} trackable · {withStock} held · {shortfalls > 0 ? `${shortfalls} short` : 'no shortfalls'}
            </p>
          </div>
        </div>
        <MoneyHelper data={data} />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Icons.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items, sub-types..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['All', ...INVENTORY_TYPES] as const).map(t => {
            const Icon = t !== 'All' ? typeIcon(t) : null;
            const isActive = typeFilter === t;
            const c = t !== 'All' ? (TYPE_COLORS[t] ?? '#d4b46d') : '#d4b46d';
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: isActive ? `linear-gradient(180deg, ${c}30, ${c}15)` : 'transparent',
                  color: isActive ? c : '#8a7f70',
                  border: `1px solid ${isActive ? c + '50' : 'rgba(201,169,97,0.15)'}`,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {Icon && <Icon size={13} />}
                {t}
              </button>
            );
          })}
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gold-500/15 rounded-lg cursor-pointer text-xs text-ink-300">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="cursor-pointer" />
          Show all items
        </label>
      </div>

      {/* Tables */}
      {grouped.map(([type, items]) => {
        const Icon = typeIcon(type);
        const c = TYPE_COLORS[type] ?? '#d4b46d';
        return (
          <div key={type} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: `linear-gradient(180deg, ${c}30, ${c}15)`, border: `1px solid ${c}40`, color: c }}>
                <Icon size={16} />
              </div>
              <h3 className="text-xs uppercase tracking-widest font-bold font-sans" style={{ color: c }}>{type}</h3>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${c}50, transparent)` }} />
              <span className="text-ink-300 text-xs">{items.length} items</span>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gold-500/5">
                    <th className="text-left text-[11px] uppercase tracking-widest font-bold px-4 py-3">Item</th>
                    <th className="text-left text-[11px] uppercase tracking-widest font-bold px-4 py-3">Sub-type</th>
                    <th className="text-left text-[11px] uppercase tracking-widest font-bold px-4 py-3">Unit</th>
                    <th className="text-center text-[11px] uppercase tracking-widest font-bold px-4 py-3">Current</th>
                    <th className="text-center text-[11px] uppercase tracking-widest font-bold px-4 py-3">Required</th>
                    <th className="text-center text-[11px] uppercase tracking-widest font-bold px-4 py-3">Status</th>
                    {canEdit && <th className="text-center text-[11px] uppercase tracking-widest font-bold px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const stock = data.inventory[item.item] ?? { item: item.item, current_qty: 0, required_qty: 0 };
                    const shortfall = stock.required_qty - stock.current_qty;
                    const status = stock.required_qty === 0 ? null : (stock.current_qty >= stock.required_qty ? 'OK' : 'Short');
                    return (
                      <tr key={item.item} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {item.item}
                          {item.notes && <div className="text-[11px] text-ink-300 font-normal mt-0.5">{item.notes}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-300">{item.subType}</td>
                        <td className="px-4 py-3 text-xs text-ink-300">{item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            value={stock.current_qty}
                            onChange={e => onUpdateInventory(item.item, { current_qty: parseInt(e.target.value) || 0 })}
                            className="w-[70px] px-2 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm font-semibold text-center disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            value={stock.required_qty}
                            onChange={e => onUpdateInventory(item.item, { required_qty: parseInt(e.target.value) || 0 })}
                            className="w-[70px] px-2 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm text-center text-ink-300 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status && (
                            <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${status === 'OK' ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'}`}>
                              {status === 'OK' ? '✓ OK' : `−${shortfall}`}
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => onLogTransaction(item.item, 1, 'In')}
                                className="px-2.5 py-1 bg-success-500/15 text-success-400 border border-success-500/30 rounded text-sm font-bold hover:bg-success-500/25"
                                title="Add 1"
                              >+</button>
                              <button
                                onClick={() => onLogTransaction(item.item, 1, 'Out')}
                                disabled={stock.current_qty <= 0}
                                className="px-2.5 py-1 bg-danger-500/15 text-danger-400 border border-danger-500/30 rounded text-sm font-bold hover:bg-danger-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Remove 1"
                              >−</button>
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

      {filtered.length === 0 && <div className="text-center py-16 text-ink-300">No items match your filters</div>}

      {data.inventoryLog.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-display text-gold-400 mb-3">Recent Transactions</h3>
          <div className="card overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gold-500/5">
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider">When</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider">Item</th>
                  <th className="text-center px-4 py-2.5 text-[11px] uppercase tracking-wider">Direction</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.inventoryLog.slice(0, 15).map(e => (
                  <tr key={e.id} className="border-t border-gold-500/10">
                    <td className="px-4 py-2.5 text-xs text-ink-300">{new Date(e.ts).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-semibold">{e.item}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${e.direction === 'In' ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'}`}>
                        {e.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">{e.amount}</td>
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

function MoneyHelper({ data }: { data: LanceData }) {
  const [rings, setRings] = useState(0);
  const [crowns, setCrowns] = useState(0);
  const [thrones, setThrones] = useState(0);

  const total = rings + crowns * 20 + thrones * 160;
  const stockRings = data.inventory['Ring']?.current_qty ?? 0;
  const stockCrowns = data.inventory['Crown']?.current_qty ?? 0;
  const stockThrones = data.inventory['Throne']?.current_qty ?? 0;

  return (
    <div className="card p-4 min-w-[320px] border-l-[3px] border-l-[#e0c66d]">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[#e0c66d] text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-1.5">
          <Icons.Coins size={14} /> Money Helper
        </h4>
        <button
          onClick={() => { setRings(stockRings); setCrowns(stockCrowns); setThrones(stockThrones); }}
          className="px-2.5 py-1 text-[11px] border border-gold-500/15 rounded text-ink-300 hover:text-ink-100"
        >Use Stockpile</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Num label="Rings"   value={rings}   onChange={setRings} />
        <Num label="Crowns"  value={crowns}  onChange={setCrowns} />
        <Num label="Thrones" value={thrones} onChange={setThrones} />
      </div>
      <div className="bg-black/30 px-3 py-2.5 rounded-lg text-xs">
        <Row label="Total Rings:" value={total.toLocaleString()} bold />
        <Row label="= Crowns:" value={(total/20).toFixed(2)} bold />
        <Row label="= Thrones:" value={(total/160).toFixed(3)} bold />
      </div>
      <div className="text-[11px] text-ink-300 mt-2 text-center">20 rings = 1 crown · 8 crowns = 1 throne</div>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="text-[11px] text-ink-300 block mb-0.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} className="input py-1.5 px-2 text-sm" />
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between mb-1 last:mb-0">
      <span className="text-ink-300">{label}</span>
      <span className={bold ? 'font-bold' : ''}>{value}</span>
    </div>
  );
}
