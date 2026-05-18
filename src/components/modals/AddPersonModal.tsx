import { useState } from 'react';
import type { Member, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';

interface Props {
  data: LanceData;
  initial?: Partial<Member>;
  onClose: () => void;
  onSave: (member: Partial<Member> & { name: string }) => Promise<void>;
}

export function AddPersonModal({ data, initial, onClose, onSave }: Props) {
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
        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>
    </Modal>
  );
}
