import { useMemo, useState } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import type { CraftingQueueItem, LanceData, MagicItemStock } from '@/lib/types';
import {
  MAGIC_ITEMS_CATALOGUE,
  MATERIAL_NAMES,
  TIER_LABELS,
  type CatalogueItem,
  type ItemTier,
  type MaterialCost
} from '@/lib/magicItemsCatalogue';
import { SPELLS_CATALOGUE } from '@/lib/spellsCatalogue';
import { RITUALS_CATALOGUE, REALM_COLORS, RITUAL_REALM_ORDER } from '@/lib/ritualsCatalogue';
import type { RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { StockModal } from '@/components/modals/StockModal';

const ACCENT = '#e76eb5';

type SubView = 'stock' | 'queue' | 'catalogue' | 'spells' | 'rituals';

const TIER_PILL_COLORS: Record<ItemTier, { bg: string; text: string; border: string }> = {
  apprentice: { bg: 'rgba(212,180,109,0.15)', text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
  journeyman: { bg: 'rgba(100,160,220,0.15)', text: '#6ca0dc', border: 'rgba(100,160,220,0.4)' },
  adept: { bg: 'rgba(160,100,220,0.15)', text: '#a064dc', border: 'rgba(160,100,220,0.4)' },
  masterwork: { bg: 'rgba(231,110,181,0.15)', text: '#e76eb5', border: 'rgba(231,110,181,0.4)' }
};

const STATUS_PILL_COLORS: Record<MagicItemStock['status'], { bg: string; text: string; border: string }> = {
  available: { bg: 'rgba(109,212,126,0.15)', text: '#6dd47e', border: 'rgba(109,212,126,0.4)' },
  bonded: { bg: 'rgba(212,180,109,0.15)', text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
  reserved: { bg: 'rgba(100,160,220,0.15)', text: '#6ca0dc', border: 'rgba(100,160,220,0.4)' },
  expired: { bg: 'rgba(180,50,50,0.15)', text: '#f87171', border: 'rgba(180,50,50,0.4)' }
};

const QUEUE_STATUS_ORDER: CraftingQueueItem['status'][] = [
  'planned',
  'materials-sourced',
  'in-progress',
  'complete',
  'cancelled'
];

const QUEUE_STATUS_LABELS: Record<CraftingQueueItem['status'], string> = {
  planned: 'Planned',
  'materials-sourced': 'Materials Sourced',
  'in-progress': 'In Progress',
  complete: 'Complete',
  cancelled: 'Cancelled'
};

const QUEUE_STATUS_COLORS: Record<CraftingQueueItem['status'], { bg: string; text: string; border: string }> = {
  planned: { bg: 'rgba(100,160,220,0.15)', text: '#6ca0dc', border: 'rgba(100,160,220,0.4)' },
  'materials-sourced': { bg: 'rgba(212,180,109,0.15)', text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
  'in-progress': { bg: 'rgba(231,110,181,0.15)', text: '#e76eb5', border: 'rgba(231,110,181,0.4)' },
  complete: { bg: 'rgba(109,212,126,0.15)', text: '#6dd47e', border: 'rgba(109,212,126,0.4)' },
  cancelled: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' }
};

interface Props {
  data: LanceData;
  isAdmin: boolean;
  onUpsertStock: (item: Partial<MagicItemStock> & { item_name: string; tier: string; form: string }) => Promise<void>;
  onDeleteStock: (id: string) => Promise<void>;
  onUpsertQueue: (item: Partial<CraftingQueueItem> & { item_name: string; tier: string }) => Promise<void>;
  onDeleteQueue: (id: string) => Promise<void>;
}

export function MagicItemsTab({ data, isAdmin, onUpsertStock, onDeleteStock, onUpsertQueue, onDeleteQueue }: Props) {
  const [subView, setSubView] = useState<SubView>('stock');
  const [stockModal, setStockModal] = useState<{ open: boolean; initial?: Partial<MagicItemStock>; prefill?: CatalogueItem }>({ open: false });
  const [queueModal, setQueueModal] = useState<{ open: boolean; initial?: Partial<CraftingQueueItem>; prefill?: CatalogueItem }>({ open: false });

  return (
    <div>
      {/* Tab header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center border"
            style={{
              background: `linear-gradient(180deg, ${ACCENT}30, ${ACCENT}10)`,
              borderColor: `${ACCENT}40`,
              color: ACCENT,
              boxShadow: `0 0 24px ${ACCENT}25`
            }}
          >
            <Icons.Wand size={24} />
          </div>
          <div>
            <h2
              className="text-3xl font-display font-bold m-0"
              style={{ background: `linear-gradient(180deg, #f9d5ec, ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Magic Items
            </h2>
            <p className="text-sm text-ink-100/60 m-0 tracking-wide">
              {data.magicItemsStock.length} in armoury · {data.craftingQueue.filter(q => !['complete', 'cancelled'].includes(q.status)).length} queued · {MAGIC_ITEMS_CATALOGUE.length} in catalogue
            </p>
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 mb-6 border-b border-gold-500/15 pb-0">
        {(['stock', 'queue', 'catalogue', 'spells', 'rituals'] as SubView[]).map(v => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className="tab-btn"
            style={subView === v ? { color: ACCENT, borderBottomColor: ACCENT, fontWeight: 600 } : {}}
          >
            {v === 'stock' && <Icons.Shield size={15} />}
            {v === 'queue' && <Icons.Sparkles size={15} />}
            {v === 'catalogue' && <Icons.Package size={15} />}
            {v === 'spells' && <Icons.Wand size={15} />}
            {v === 'rituals' && <Icons.Gem size={15} />}
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {subView === 'stock' && (
        <StockView
          data={data}
          isAdmin={isAdmin}
          onAdd={() => setStockModal({ open: true })}
          onEdit={item => setStockModal({ open: true, initial: item })}
          onDelete={onDeleteStock}
        />
      )}

      {subView === 'queue' && (
        <QueueView
          data={data}
          isAdmin={isAdmin}
          onAdd={() => setQueueModal({ open: true })}
          onEdit={item => setQueueModal({ open: true, initial: item })}
          onDelete={onDeleteQueue}
        />
      )}

      {subView === 'catalogue' && (
        <CatalogueView
          isAdmin={isAdmin}
          onAddToStock={item => setStockModal({ open: true, prefill: item })}
          onAddToQueue={item => setQueueModal({ open: true, prefill: item })}
        />
      )}

      {subView === 'spells' && <SpellsView />}
      {subView === 'rituals' && <RitualsView />}

      {stockModal.open && (
        <StockModal
          data={data}
          initial={stockModal.initial}
          prefill={stockModal.prefill}
          onClose={() => setStockModal({ open: false })}
          onSave={async item => {
            await onUpsertStock(item);
            setStockModal({ open: false });
          }}
        />
      )}

      {queueModal.open && (
        <QueueModal
          data={data}
          initial={queueModal.initial}
          prefill={queueModal.prefill}
          onClose={() => setQueueModal({ open: false })}
          onSave={async item => {
            await onUpsertQueue(item);
            setQueueModal({ open: false });
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// STOCK VIEW
// ============================================================
function StockView({
  data,
  isAdmin,
  onAdd,
  onEdit,
  onDelete
}: {
  data: LanceData;
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (item: MagicItemStock) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const memberMap = useMemo(() => Object.fromEntries(data.members.map(m => [m.id, m.name])), [data.members]);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={onAdd} className="btn btn-primary" style={{ background: `linear-gradient(180deg, ${ACCENT}cc, ${ACCENT}99)` }}>
            <Icons.Plus size={16} />
            Add Item
          </button>
        </div>
      )}

      {data.magicItemsStock.length === 0 ? (
        <div className="card p-12 text-center">
          <Icons.Wand size={32} className="mx-auto mb-3 opacity-30" style={{ color: ACCENT }} />
          <p className="text-ink-100/50">No magic items in the lance armoury yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gold-500/10">
              <tr>
                <Th>Item</Th>
                <Th>Tier</Th>
                <Th>Form</Th>
                <Th>Bonded To</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                {isAdmin && <Th center>Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {data.magicItemsStock.map((item, idx) => {
                const tier = item.tier as ItemTier;
                const tc = TIER_PILL_COLORS[tier] ?? TIER_PILL_COLORS.apprentice;
                const sc = STATUS_PILL_COLORS[item.status];
                const memberName = item.bonded_to ? (memberMap[item.bonded_to] ?? 'Unknown') : null;
                return (
                  <tr key={item.id} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                    <td className="px-4 py-3 font-semibold text-sm">{item.item_name}</td>
                    <td className="px-4 py-3">
                      <span className="pill" style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                        {TIER_LABELS[tier] ?? tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-100/70">{formatForm(item.form)}</td>
                    <td className="px-4 py-3 text-sm">
                      {memberName ? (
                        <span className="font-medium">{memberName}</span>
                      ) : (
                        <span className="pill pill-active">Available</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="pill" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-100/60">{item.created_at_event ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-ink-100/60">{item.expires_after_event ?? '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => onEdit(item)} className="btn btn-ghost btn-sm">
                            <Icons.Edit size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirm({ title: `Remove "${item.item_name}" from the armoury?`, danger: true })) await onDelete(item.id);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            <Icons.Trash size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

// ============================================================
// QUEUE VIEW
// ============================================================
function QueueView({
  data,
  isAdmin,
  onAdd,
  onEdit,
  onDelete
}: {
  data: LanceData;
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: (item: CraftingQueueItem) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const memberMap = useMemo(() => Object.fromEntries(data.members.map(m => [m.id, m.name])), [data.members]);
  const invMap = useMemo(() => Object.fromEntries(data.inventory.map(i => [i.item, i.current_qty])), [data.inventory]);

  const activeQueue = data.craftingQueue.filter(q => !['complete', 'cancelled'].includes(q.status));

  const aggregateMaterials = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of activeQueue) {
      for (const [mat, qty] of Object.entries(item.materials_required)) {
        totals[mat] = (totals[mat] ?? 0) + (qty as number);
      }
    }
    return totals;
  }, [activeQueue]);

  const matKeyToInventoryName: Record<string, string> = {
    gi: 'Green Iron',
    or: 'Orichalcum',
    tj: 'Tempest Jade',
    ws: 'Weltsilver',
    am: 'Ambergelt',
    bl: "Beggar's Lye",
    db: 'Dragonbone',
    ig: 'Iridescent Gloaming',
    ilium: 'Ilium'
  };

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={onAdd} className="btn btn-primary" style={{ background: `linear-gradient(180deg, ${ACCENT}cc, ${ACCENT}99)` }}>
            <Icons.Plus size={16} />
            Add to Queue
          </button>
        </div>
      )}

      {/* Materials Summary */}
      <div className="card p-5 mb-6" style={{ borderLeft: `3px solid ${ACCENT}` }}>
        <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT }}>Materials Summary (Active Queue)</h3>
        {Object.keys(aggregateMaterials).length === 0 ? (
          <p className="text-xs text-ink-100/50">No materials required — queue is empty or all jobs complete.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(aggregateMaterials).map(([matKey, needed]) => {
              const invName = matKeyToInventoryName[matKey] ?? matKey;
              const inStock = invMap[invName] ?? 0;
              const shortfall = needed - inStock;
              const ok = shortfall <= 0;
              return (
                <div
                  key={matKey}
                  className="flex flex-col items-center px-3 py-2 rounded-lg border text-xs font-bold"
                  style={{
                    background: ok ? 'rgba(109,212,126,0.1)' : 'rgba(180,50,50,0.1)',
                    borderColor: ok ? 'rgba(109,212,126,0.3)' : 'rgba(180,50,50,0.3)',
                    color: ok ? '#6dd47e' : '#f87171'
                  }}
                >
                  <span className="uppercase tracking-wider text-[10px] opacity-70">{MATERIAL_NAMES[matKey as keyof MaterialCost] ?? matKey}</span>
                  <span>{needed}× needed</span>
                  <span className="opacity-70">{inStock} in stock</span>
                  {!ok && <span className="text-red-400">−{shortfall} short</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.craftingQueue.length === 0 ? (
        <div className="card p-12 text-center">
          <Icons.Sparkles size={32} className="mx-auto mb-3 opacity-30" style={{ color: ACCENT }} />
          <p className="text-ink-100/50">No crafting jobs queued.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {QUEUE_STATUS_ORDER.map(status => {
            const items = data.craftingQueue.filter(q => q.status === status);
            if (items.length === 0) return null;
            const sc = QUEUE_STATUS_COLORS[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs uppercase tracking-widest font-bold" style={{ color: sc.text }}>
                    {QUEUE_STATUS_LABELS[status]}
                  </h3>
                  <span className="pill" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{items.length}</span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${sc.border}, transparent)` }} />
                </div>
                <div className="space-y-3">
                  {items.map(item => (
                    <QueueCard
                      key={item.id}
                      item={item}
                      memberMap={memberMap}
                      invMap={invMap}
                      matKeyToInventoryName={matKeyToInventoryName}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QueueCard({
  item,
  memberMap,
  invMap,
  matKeyToInventoryName,
  isAdmin,
  onEdit,
  onDelete
}: {
  item: CraftingQueueItem;
  memberMap: Record<string, string>;
  invMap: Record<string, number>;
  matKeyToInventoryName: Record<string, string>;
  isAdmin: boolean;
  onEdit: (item: CraftingQueueItem) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const tier = item.tier as ItemTier;
  const tc = TIER_PILL_COLORS[tier] ?? TIER_PILL_COLORS.apprentice;
  const sc = QUEUE_STATUS_COLORS[item.status];
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  return (
    <>
    <div className="card card-lift p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-semibold text-sm">{item.item_name}</span>
          <span className="pill" style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
            {TIER_LABELS[tier] ?? tier}
          </span>
          <span className="pill" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
            {QUEUE_STATUS_LABELS[item.status]}
          </span>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(item)} className="btn btn-ghost btn-sm"><Icons.Edit size={13} /></button>
            <button
              onClick={async () => {
                if (await confirm({ title: `Remove "${item.item_name}" from the queue?`, danger: true })) await onDelete(item.id);
              }}
              className="btn btn-danger btn-sm"
            >
              <Icons.Trash size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-sm text-ink-100/70 flex-wrap">
        <span>{item.crafter_id ? memberMap[item.crafter_id] ?? 'Unknown' : 'No crafter'}</span>
        <span className="text-ink-100/30">→</span>
        <span>{item.recipient_id ? memberMap[item.recipient_id] ?? 'Unknown' : 'Unassigned'}</span>
        {item.target_event && (
          <>
            <span className="text-ink-100/30">·</span>
            <span className="text-xs">Target: {item.target_event}</span>
          </>
        )}
      </div>

      {Object.keys(item.materials_required).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(item.materials_required).map(([matKey, qty]) => {
            const invName = matKeyToInventoryName[matKey] ?? matKey;
            const inStock = invMap[invName] ?? 0;
            const shortfall = (qty as number) - inStock;
            const ok = shortfall <= 0;
            return (
              <span
                key={matKey}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border"
                style={{
                  background: ok ? 'rgba(109,212,126,0.1)' : 'rgba(180,50,50,0.1)',
                  borderColor: ok ? 'rgba(109,212,126,0.3)' : 'rgba(180,50,50,0.3)',
                  color: ok ? '#6dd47e' : '#f87171'
                }}
              >
                {qty as number}× {matKey.toUpperCase()}
                {!ok && ` −${shortfall}`}
              </span>
            );
          })}
        </div>
      )}

      {item.notes && <p className="text-xs text-ink-100/50 mt-2 italic">{item.notes}</p>}
    </div>
    {ConfirmDialog}
    </>
  );
}

// ============================================================
// CATALOGUE VIEW
// ============================================================
function CatalogueView({
  isAdmin,
  onAddToStock,
  onAddToQueue
}: {
  isAdmin: boolean;
  onAddToStock: (item: CatalogueItem) => void;
  onAddToQueue: (item: CatalogueItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | ItemTier>('all');
  const [formGroup, setFormGroup] = useState<'all' | 'weapon' | 'armour' | 'talisman'>('all');
  const [nationFilter, setNationFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const nations = useMemo(() => {
    const set = new Set<string>();
    for (const item of MAGIC_ITEMS_CATALOGUE) {
      if (item.nations !== 'all') {
        for (const n of item.nations) set.add(n);
      }
    }
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MAGIC_ITEMS_CATALOGUE.filter(item => {
      if (tierFilter !== 'all' && item.tier !== tierFilter) return false;
      if (formGroup === 'weapon' && !item.form.startsWith('weapon')) return false;
      if (formGroup === 'armour' && item.form !== 'armour') return false;
      if (formGroup === 'talisman' && !item.form.startsWith('talisman') && item.form !== 'standard') return false;
      if (nationFilter !== 'all') {
        if (item.nations === 'all') return false;
        if (!item.nations.includes(nationFilter)) return false;
      }
      if (q && !item.name.toLowerCase().includes(q) && !item.effect.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, tierFilter, formGroup, nationFilter]);

  const byTier = useMemo(() => {
    const map = new Map<ItemTier, CatalogueItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.tier) ?? [];
      arr.push(item);
      map.set(item.tier, arr);
    }
    return map;
  }, [filtered]);

  const tierOrder: ItemTier[] = ['apprentice', 'journeyman', 'adept', 'masterwork'];

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
          <input className="input pl-10" placeholder="Search items, effects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'apprentice', 'journeyman', 'adept', 'masterwork'] as const).map(t => {
            const active = tierFilter === t;
            const c = t === 'all' ? '#d4b46d' : TIER_PILL_COLORS[t].text;
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className="px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: active ? `${c}22` : 'transparent',
                  color: active ? c : 'rgba(232,230,227,0.5)',
                  borderColor: active ? `${c}50` : 'rgba(201,169,97,0.15)',
                  fontWeight: active ? 600 : 500
                }}
              >
                {t === 'all' ? 'All Tiers' : TIER_LABELS[t]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1">
          {(['all', 'weapon', 'armour', 'talisman'] as const).map(fg => {
            const active = formGroup === fg;
            return (
              <button
                key={fg}
                onClick={() => setFormGroup(fg)}
                className="px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: active ? `${ACCENT}22` : 'transparent',
                  color: active ? ACCENT : 'rgba(232,230,227,0.5)',
                  borderColor: active ? `${ACCENT}50` : 'rgba(201,169,97,0.15)',
                  fontWeight: active ? 600 : 500
                }}
              >
                {fg === 'all' ? 'All Forms' : fg.charAt(0).toUpperCase() + fg.slice(1)}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 flex-wrap">
          {nations.map(n => {
            const active = nationFilter === n;
            return (
              <button
                key={n}
                onClick={() => setNationFilter(n)}
                className="px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: active ? `${ACCENT}22` : 'transparent',
                  color: active ? ACCENT : 'rgba(232,230,227,0.5)',
                  borderColor: active ? `${ACCENT}50` : 'rgba(201,169,97,0.15)',
                  fontWeight: active ? 600 : 500
                }}
              >
                {n === 'all' ? 'All Nations' : n}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-ink-100/50">No items match your filters.</p>
      ) : (
        <div className="space-y-8">
          {tierOrder.map(tier => {
            const items = byTier.get(tier);
            if (!items || items.length === 0) return null;
            const tc = TIER_PILL_COLORS[tier];
            return (
              <div key={tier}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg grid place-items-center border" style={{ color: tc.text, background: tc.bg, borderColor: tc.border }}>
                    <Icons.Gem size={14} />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-bold" style={{ color: tc.text }}>{TIER_LABELS[tier]}</h3>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${tc.border}, transparent)` }} />
                  <span className="text-xs text-ink-100/50">{items.length}</span>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gold-500/10">
                      <tr>
                        <Th>Name</Th>
                        <Th>Form</Th>
                        <Th>Effect</Th>
                        <Th>Materials</Th>
                        <Th center>Total</Th>
                        <Th>Nations</Th>
                        {isAdmin && <Th center>Actions</Th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                          <td className="px-4 py-3 font-semibold text-sm align-top whitespace-nowrap">{item.name}</td>
                          <td className="px-4 py-3 text-xs text-ink-100/60 align-top whitespace-nowrap">{formatForm(item.form)}</td>
                          <td className="px-4 py-3 text-sm align-top">
                            {expanded === item.id ? (
                              <span
                                className="cursor-pointer"
                                onClick={() => setExpanded(null)}
                                title="Click to collapse"
                              >
                                {item.effect}
                              </span>
                            ) : (
                              <span
                                className="cursor-pointer text-ink-100/80 hover:text-ink-100"
                                onClick={() => setExpanded(item.id)}
                                title="Click to expand"
                              >
                                {item.effect.length > 80 ? `${item.effect.slice(0, 80)}…` : item.effect}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {Object.keys(item.materials).length === 0 ? (
                              <span className="text-xs text-ink-100/40">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.materials).map(([mat, qty]) => (
                                  <span
                                    key={mat}
                                    className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border"
                                    style={{
                                      background: 'rgba(201,169,97,0.1)',
                                      borderColor: 'rgba(201,169,97,0.25)',
                                      color: '#d4b46d'
                                    }}
                                    title={MATERIAL_NAMES[mat as keyof MaterialCost] ?? mat}
                                  >
                                    {qty}× {mat.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-ink-100/70 align-top">{item.totalMaterials || '—'}</td>
                          <td className="px-4 py-3 align-top">
                            {item.nations !== 'all' && (
                              <span className="pill" style={{ background: 'rgba(231,110,181,0.15)', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                                {Array.isArray(item.nations) ? item.nations.join(', ') : item.nations}
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 align-top">
                              <div className="flex gap-1 justify-center flex-wrap">
                                <button
                                  onClick={() => onAddToQueue(item)}
                                  className="btn btn-ghost btn-sm text-[11px] whitespace-nowrap"
                                >
                                  + Queue
                                </button>
                                <button
                                  onClick={() => onAddToStock(item)}
                                  className="btn btn-ghost btn-sm text-[11px] whitespace-nowrap"
                                >
                                  + Stock
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Materials key legend */}
      <div className="mt-8 card p-4">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold-300 mb-2">Materials Key</h4>
        <div className="flex flex-wrap gap-3 text-xs text-ink-100/60">
          {(Object.entries(MATERIAL_NAMES) as [keyof MaterialCost, string][]).map(([key, name]) => (
            <span key={key}><span className="font-bold text-gold-300/70">{key.toUpperCase()}</span> = {name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QUEUE MODAL
// ============================================================
function QueueModal({
  data,
  initial,
  prefill,
  onClose,
  onSave
}: {
  data: LanceData;
  initial?: Partial<CraftingQueueItem>;
  prefill?: CatalogueItem;
  onClose: () => void;
  onSave: (item: Partial<CraftingQueueItem> & { item_name: string; tier: string }) => Promise<void>;
}) {
  const [search, setSearch] = useState(prefill?.name ?? initial?.item_name ?? '');
  const [selectedCatalogue, setSelectedCatalogue] = useState<CatalogueItem | null>(prefill ?? null);
  const [form, setForm] = useState<Partial<CraftingQueueItem>>({
    item_name: prefill?.name ?? initial?.item_name ?? '',
    tier: prefill?.tier ?? initial?.tier ?? 'apprentice',
    crafter_id: initial?.crafter_id ?? null,
    recipient_id: initial?.recipient_id ?? null,
    status: initial?.status ?? 'planned',
    materials_required: (prefill?.materials ?? initial?.materials_required ?? {}) as Record<string, number>,
    notes: initial?.notes ?? null,
    target_event: initial?.target_event ?? null,
    ...(initial?.id ? { id: initial.id } : {})
  });
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    if (!search || search === selectedCatalogue?.name) return [];
    const q = search.toLowerCase();
    return MAGIC_ITEMS_CATALOGUE.filter(i => i.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, selectedCatalogue]);

  function selectItem(item: CatalogueItem) {
    setSelectedCatalogue(item);
    setSearch(item.name);
    setForm(f => ({
      ...f,
      item_name: item.name,
      tier: item.tier,
      materials_required: item.materials as Record<string, number>
    }));
  }

  function set<K extends keyof CraftingQueueItem>(key: K, value: CraftingQueueItem[K] | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.item_name?.trim() || !form.tier || busy) return;
    setBusy(true);
    try {
      await onSave({
        ...form,
        item_name: form.item_name.trim(),
        tier: form.tier,
        materials_required: form.materials_required ?? {}
      } as Partial<CraftingQueueItem> & { item_name: string; tier: string });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initial?.id ? 'Edit Queue Entry' : 'Add to Crafting Queue'}
      subtitle="Crafting Queue"
      icon={<Icons.Sparkles size={20} />}
      accent={ACCENT}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!form.item_name?.trim() || busy} className="btn btn-primary" style={{ background: `linear-gradient(180deg, ${ACCENT}cc, ${ACCENT}99)` }}>
            <Icons.Plus size={15} />
            {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add to Queue'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Item Name (from catalogue)" span="full">
          <div className="relative">
            <input
              className="input"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setForm(f => ({ ...f, item_name: e.target.value }));
                setSelectedCatalogue(null);
              }}
              placeholder="Search catalogue…"
              autoFocus
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-ink-800 border border-gold-500/20 rounded-lg shadow-lift overflow-hidden">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 flex items-center justify-between gap-2"
                    onClick={() => selectItem(item)}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-ink-100/50">{TIER_LABELS[item.tier]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>

        <Field label="Tier">
          <select className="input" value={form.tier ?? 'apprentice'} onChange={e => set('tier', e.target.value)}>
            <option value="apprentice">Apprentice</option>
            <option value="journeyman">Journeyman</option>
            <option value="adept">Adept</option>
            <option value="masterwork">Masterwork</option>
          </select>
        </Field>

        <Field label="Status">
          <select className="input" value={form.status ?? 'planned'} onChange={e => set('status', e.target.value as CraftingQueueItem['status'])}>
            <option value="planned">Planned</option>
            <option value="materials-sourced">Materials Sourced</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>

        <Field label="Crafter">
          <select className="input" value={form.crafter_id ?? ''} onChange={e => set('crafter_id', e.target.value || null)}>
            <option value="">— No crafter —</option>
            {data.members.filter(m => m.status === 'active').map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Recipient" optional>
          <select className="input" value={form.recipient_id ?? ''} onChange={e => set('recipient_id', e.target.value || null)}>
            <option value="">— Unassigned —</option>
            {data.members.filter(m => m.status === 'active').map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Target Event" optional>
          <input className="input" placeholder="E3 386YE" value={form.target_event ?? ''} onChange={e => set('target_event', e.target.value || null)} />
        </Field>

        <Field label="Materials Required (auto-filled from catalogue)" span="full">
          <div className="flex flex-wrap gap-1.5 min-h-[2rem] p-2 bg-black/20 rounded-lg border border-gold-500/10">
            {Object.keys(form.materials_required ?? {}).length === 0 ? (
              <span className="text-xs text-ink-100/40">No materials — select an item from the catalogue above</span>
            ) : (
              Object.entries(form.materials_required ?? {}).map(([mat, qty]) => (
                <span
                  key={mat}
                  className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold border"
                  style={{ background: 'rgba(201,169,97,0.1)', borderColor: 'rgba(201,169,97,0.25)', color: '#d4b46d' }}
                >
                  {qty as number}× {mat.toUpperCase()}
                </span>
              ))
            )}
          </div>
        </Field>

        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>
    </Modal>
  );
}

// ============================================================
// SPELLS VIEW
// ============================================================
function SpellsView() {
  const regular = SPELLS_CATALOGUE.filter(s => s.type === 'Regular');
  const offensive = SPELLS_CATALOGUE.filter(s => s.type === 'Offensive');

  return (
    <div>
      <p className="text-xs text-ink-100/50 mb-5 leading-relaxed">
        All spells cost 1 personal mana unless stated. Offensive spells require an implement (wand/rod/staff).
        Regular spells require 30s roleplay + touch. Swift casting costs +1 mana.
      </p>
      {[{ label: 'Regular Spells', items: regular }, { label: 'Offensive Spells', items: offensive }].map(({ label, items }) => (
        <div key={label} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg grid place-items-center border" style={{ color: ACCENT, background: `${ACCENT}20`, borderColor: `${ACCENT}40` }}>
              <Icons.Wand size={14} />
            </div>
            <h3 className="text-xs uppercase tracking-widest font-bold" style={{ color: ACCENT }}>{label}</h3>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${ACCENT}50, transparent)` }} />
            <span className="text-xs text-ink-100/50">{items.length}</span>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gold-500/10">
                <tr>
                  <Th>Spell</Th>
                  <Th center>Mana</Th>
                  <Th>Requires</Th>
                  <Th>Effect</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((spell, idx) => (
                  <tr key={spell.name} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                    <td className="px-4 py-3 font-semibold text-sm whitespace-nowrap">{spell.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="pill" style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>{spell.manaCost}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-100/60 whitespace-nowrap">{spell.skillRequired}</td>
                    <td className="px-4 py-3 text-sm text-ink-100/80">{spell.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// RITUALS VIEW
// ============================================================
function RitualsView() {
  const [search, setSearch] = useState('');
  const [realmFilter, setRealmFilter] = useState<'all' | RitualRealm>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return RITUALS_CATALOGUE.filter(r => {
      if (realmFilter !== 'all' && r.realm !== realmFilter) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.effect.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, realmFilter]);

  const byRealm = useMemo(() => {
    const map = new Map<RitualRealm, typeof RITUALS_CATALOGUE>();
    for (const r of filtered) {
      const arr = map.get(r.realm) ?? [];
      arr.push(r);
      map.set(r.realm, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
          <input className="input pl-10" placeholder="Search rituals, effects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', ...RITUAL_REALM_ORDER] as const).map(r => {
            const active = realmFilter === r;
            const c = r === 'all' ? '#d4b46d' : REALM_COLORS[r].text;
            return (
              <button
                key={r}
                onClick={() => setRealmFilter(r)}
                className="px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                style={{
                  background: active ? `${c}22` : 'transparent',
                  color: active ? c : 'rgba(232,230,227,0.5)',
                  borderColor: active ? `${c}50` : 'rgba(201,169,97,0.15)',
                  fontWeight: active ? 600 : 500
                }}
              >
                {r === 'all' ? 'All Realms' : r}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-ink-100/50">No rituals match your filters.</p>
      ) : (
        <div className="space-y-8">
          {RITUAL_REALM_ORDER.map(realm => {
            const items = byRealm.get(realm);
            if (!items || items.length === 0) return null;
            const c = REALM_COLORS[realm];
            return (
              <div key={realm}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg grid place-items-center border" style={{ color: c.text, background: c.bg, borderColor: c.border }}>
                    <Icons.Gem size={14} />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-bold" style={{ color: c.text }}>{realm}</h3>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${c.border}, transparent)` }} />
                  <span className="text-xs text-ink-100/50">{items.length}</span>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gold-500/10">
                      <tr>
                        <Th>Ritual</Th>
                        <Th>Effect</Th>
                        <Th>Mastered Via</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((ritual, idx) => (
                        <tr key={ritual.name} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                          <td className="px-4 py-3 font-semibold text-sm whitespace-nowrap align-top">{ritual.name}</td>
                          <td className="px-4 py-3 text-sm text-ink-100/80 align-top">{ritual.effect}</td>
                          <td className="px-4 py-3 text-xs text-ink-100/50 whitespace-nowrap align-top">{ritual.mastered}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th className={`px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-ink-100 ${center ? 'text-center' : 'text-left'}`}>
      {children}
    </th>
  );
}

function formatForm(form: string): string {
  return form
    .replace('weapon-', 'Weapon · ')
    .replace('talisman-', 'Talisman · ')
    .replace('armour', 'Armour')
    .replace('standard', 'Standard')
    .replace('1h', '1H')
    .replace('great', 'Great')
    .replace('polearm', 'Polearm')
    .replace('spear', 'Spear')
    .replace('implement', 'Implement')
    .replace('paired', 'Paired')
    .replace('icon', 'Icon')
    .replace('reliquary', 'Reliquary')
    .replace('paraphernalia', 'Paraphernalia');
}
