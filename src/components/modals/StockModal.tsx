import { useMemo, useState } from 'react';
import type { LanceData, MagicItemStock } from '@/lib/types';
import { MAGIC_ITEMS_CATALOGUE, TIER_LABELS } from '@/lib/magicItemsCatalogue';
import type { CatalogueItem, ItemForm } from '@/lib/magicItemsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';

const ACCENT = '#e76eb5';

interface Props {
  data: LanceData;
  initial?: Partial<MagicItemStock>;
  prefill?: CatalogueItem;
  onClose: () => void;
  onSave: (item: Partial<MagicItemStock> & { item_name: string; tier: string; form: string }) => Promise<void>;
}

export function StockModal({ data, initial, prefill, onClose, onSave }: Props) {
  const [search, setSearch] = useState(prefill?.name ?? initial?.item_name ?? '');
  const [selectedCatalogue, setSelectedCatalogue] = useState<CatalogueItem | null>(prefill ?? null);
  const [form, setForm] = useState<Partial<MagicItemStock>>({
    item_name: prefill?.name ?? initial?.item_name ?? '',
    tier: prefill?.tier ?? initial?.tier ?? 'apprentice',
    form: prefill?.form ?? initial?.form ?? 'talisman',
    bonded_to: initial?.bonded_to ?? null,
    status: initial?.status ?? 'available',
    created_at_event: initial?.created_at_event ?? null,
    expires_after_event: initial?.expires_after_event ?? null,
    notes: initial?.notes ?? null,
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
    setForm(f => ({ ...f, item_name: item.name, tier: item.tier, form: item.form }));
  }

  function set<K extends keyof MagicItemStock>(key: K, value: MagicItemStock[K] | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.item_name?.trim() || !form.tier || !form.form || busy) return;
    setBusy(true);
    try {
      await onSave({
        ...form,
        item_name: form.item_name.trim(),
        tier: form.tier,
        form: form.form
      } as Partial<MagicItemStock> & { item_name: string; tier: string; form: string });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initial?.id ? 'Edit Item' : 'Add Item to Armoury'}
      subtitle="Magic Items Stock"
      icon={<Icons.Wand size={20} />}
      accent={ACCENT}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!form.item_name?.trim() || busy} className="btn btn-primary" style={{ background: `linear-gradient(180deg, ${ACCENT}cc, ${ACCENT}99)` }}>
            <Icons.Plus size={15} />
            {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add Item'}
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

        <Field label="Form">
          <select className="input" value={form.form ?? 'talisman'} onChange={e => set('form', e.target.value as ItemForm)}>
            <option value="weapon-1h">Weapon (1H)</option>
            <option value="weapon-great">Weapon (Great)</option>
            <option value="weapon-polearm">Weapon (Polearm)</option>
            <option value="weapon-spear">Weapon (Spear)</option>
            <option value="weapon-implement">Weapon (Implement)</option>
            <option value="weapon-paired">Weapon (Paired)</option>
            <option value="armour">Armour</option>
            <option value="talisman">Talisman</option>
            <option value="talisman-icon">Talisman (Icon)</option>
            <option value="talisman-reliquary">Talisman (Reliquary)</option>
            <option value="talisman-paraphernalia">Talisman (Paraphernalia)</option>
            <option value="standard">Standard</option>
          </select>
        </Field>

        <Field label="Bonded To">
          <select className="input" value={form.bonded_to ?? ''} onChange={e => set('bonded_to', e.target.value || null)}>
            <option value="">— Unassigned —</option>
            {data.members.filter(m => m.status === 'active').map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select className="input" value={form.status ?? 'available'} onChange={e => set('status', e.target.value as MagicItemStock['status'])}>
            <option value="available">Available</option>
            <option value="bonded">Bonded</option>
            <option value="reserved">Reserved</option>
            <option value="expired">Expired</option>
          </select>
        </Field>

        <Field label="Created at Event" optional>
          <input className="input" placeholder="E2 386YE" value={form.created_at_event ?? ''} onChange={e => set('created_at_event', e.target.value || null)} />
        </Field>

        <Field label="Expires After Event" optional>
          <input className="input" placeholder="E1 387YE" value={form.expires_after_event ?? ''} onChange={e => set('expires_after_event', e.target.value || null)} />
        </Field>

        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>
    </Modal>
  );
}
