import { useState } from 'react';
import type { CharInventoryItem, Member, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';

interface Props {
  data: LanceData;
  initial?: Partial<Member>;
  onClose: () => void;
  onSave: (member: Partial<Member> & { name: string }) => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
}

export function AddPersonModal({ data, initial, onClose, onSave, onUpsertCharInventory, onDeleteCharInventory }: Props) {
  const [form, setForm] = useState<Partial<Member>>({
    name: '',
    player_name: null,
    pid: null,
    rank: 'Member',
    function: null,
    military_function: null,
    is_noble: false,
    status: 'active',
    hp: null,
    mp: null,
    resource: null,
    coin_per_event: null,
    attending_event: false,
    coven: null,
    notes: null,
    house_id: data.houses[0]?.id ?? null,
    ...initial
  });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Member>(key: K, value: Member[K] | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({ ...form, name: form.name.trim() } as Partial<Member> & { name: string });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initial?.id ? 'Edit Member' : 'Add Member'}
      subtitle={initial?.id ? 'Update roster entry' : 'Sworn to a house'}
      icon={<Icons.Users size={22} />}
      width="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!form.name?.trim() || busy} className="btn btn-primary">
            <Icons.Plus size={15} />
            {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add Member'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Character Name (IC)" span="full">
          <input className="input font-display font-semibold" autoFocus value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Player Name (OC)">
          <input className="input" value={form.player_name ?? ''} onChange={e => set('player_name', e.target.value || null)} />
        </Field>
        <Field label="PID" optional>
          <input className="input font-mono" value={form.pid ?? ''} onChange={e => set('pid', e.target.value || null)} />
        </Field>
        <Field label="House">
          <select className="input" value={form.house_id ?? ''} onChange={e => set('house_id', e.target.value || null)}>
            <option value="">Unassigned</option>
            {data.houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Rank">
          <input className="input" value={form.rank ?? ''} onChange={e => set('rank', e.target.value || null)} />
        </Field>
        <Field label="Claw">
          <select className="input" value={form.function ?? ''} onChange={e => set('function', e.target.value || null)}>
            <option value="">None</option>
            {data.functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Field>
        <Field label="Military Role">
          <input className="input" placeholder="Shield Wall, Battle Mage…" value={form.military_function ?? ''} onChange={e => set('military_function', e.target.value || null)} />
        </Field>
        <Field label="HP">
          <input type="number" className="input" value={form.hp ?? ''} onChange={e => set('hp', e.target.value ? parseInt(e.target.value, 10) : null)} />
        </Field>
        <Field label="MP">
          <input type="number" className="input" value={form.mp ?? ''} onChange={e => set('mp', e.target.value ? parseInt(e.target.value, 10) : null)} />
        </Field>
        <Field label="Resource">
          <input className="input" placeholder="Military Unit, Mana Site…" value={form.resource ?? ''} onChange={e => set('resource', e.target.value || null)} />
        </Field>
        <Field label="Coin per Event">
          <input className="input" placeholder="18 r, 4 crowns" value={form.coin_per_event ?? ''} onChange={e => set('coin_per_event', e.target.value || null)} />
        </Field>
        <Field label="Coven">
          <select className="input" value={form.coven ?? ''} onChange={e => set('coven', e.target.value || null)}>
            <option value="">None</option>
            {data.covens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status ?? 'active'} onChange={e => set('status', e.target.value as Member['status'])}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="KIA">KIA</option>
          </select>
        </Field>
        <Field label="Noble">
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer">
            <input type="checkbox" checked={!!form.is_noble} onChange={e => set('is_noble', e.target.checked)} className="w-5 h-5 accent-gold-300" />
            <span className="text-sm">Member of the nobility</span>
          </label>
        </Field>
        <Field label="Attending Next Event">
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer">
            <input type="checkbox" checked={!!form.attending_event} onChange={e => set('attending_event', e.target.checked)} className="w-5 h-5 accent-gold-300" />
            <span className="text-sm">Will be at the next event</span>
          </label>
        </Field>
        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>

      {initial?.id && onUpsertCharInventory && onDeleteCharInventory && (
        <CharInventorySection
          memberId={initial.id}
          items={data.characterInventory.filter(ci => ci.member_id === initial.id)}
          onUpsert={onUpsertCharInventory}
          onDelete={onDeleteCharInventory}
        />
      )}
    </Modal>
  );
}

function CharInventorySection({
  memberId,
  items,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  items: CharInventoryItem[];
  onUpsert: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ item: '', qty: 1, category: '', notes: '', include_in_lance: false });
  const [busy, setBusy] = useState(false);

  async function addItem() {
    if (!newItem.item.trim() || busy) return;
    setBusy(true);
    try {
      await onUpsert({
        member_id: memberId,
        item: newItem.item.trim(),
        qty: newItem.qty,
        category: newItem.category.trim() || null,
        notes: newItem.notes.trim() || null,
        include_in_lance: newItem.include_in_lance,
      });
      setNewItem({ item: '', qty: 1, category: '', notes: '', include_in_lance: false });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-gold-500/15">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Character Inventory</span>
        <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs">
          <Icons.Plus size={13} />
          Add Item
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map(ci => (
            <div key={ci.id} className="flex items-center gap-2 px-3 py-2 bg-ink-800/40 rounded-lg">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ink-100">{ci.item}</span>
                {ci.category && <span className="text-xs text-ink-100/50 ml-2">[{ci.category}]</span>}
                {ci.notes && <span className="text-xs text-ink-100/40 ml-2 italic">{ci.notes}</span>}
              </div>
              <span className="text-sm font-mono text-gold-300 flex-shrink-0">×{ci.qty}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink-100/60 cursor-pointer flex-shrink-0 select-none" title="Include in lance inventory roll-up">
                <input
                  type="checkbox"
                  checked={ci.include_in_lance}
                  onChange={e => onUpsert({ ...ci, include_in_lance: e.target.checked })}
                  className="w-3.5 h-3.5 accent-gold-300"
                />
                Lance
              </label>
              <button onClick={() => onDelete(ci.id)} className="btn btn-ghost btn-sm text-red-400/60 hover:text-red-400 flex-shrink-0 px-1.5">
                <Icons.Trash size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border border-gold-500/10">
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <input
              autoFocus
              className="input text-sm"
              placeholder="Item name"
              value={newItem.item}
              onChange={e => setNewItem(n => ({ ...n, item: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <input
              type="number"
              className="input text-sm"
              min={1}
              value={newItem.qty}
              onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <input
            className="input text-sm w-full"
            placeholder="Category (optional)"
            value={newItem.category}
            onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
          />
          <input
            className="input text-sm w-full"
            placeholder="Notes (optional)"
            value={newItem.notes}
            onChange={e => setNewItem(n => ({ ...n, notes: e.target.value }))}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ink-100/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newItem.include_in_lance}
                onChange={e => setNewItem(n => ({ ...n, include_in_lance: e.target.checked }))}
                className="w-4 h-4 accent-gold-300"
              />
              Include in lance inventory
            </label>
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
              <button onClick={addItem} disabled={!newItem.item.trim() || busy} className="btn btn-primary btn-sm text-xs">
                {busy ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-2">No items · click Add Item to begin</p>
      )}
    </div>
  );
}
