import { useMemo, useState } from 'react';
import type { LanceData, MagicItemStock } from '@/lib/types';
import { MAGIC_ITEMS_CATALOGUE, TIER_LABELS } from '@/lib/magicItemsCatalogue';
import type { CatalogueItem, ItemForm } from '@/lib/magicItemsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      await onSave({
        ...form,
        item_name: form.item_name.trim(),
        tier: form.tier,
        form: form.form
      } as Partial<MagicItemStock> & { item_name: string; tier: string; form: string });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
      {error && <p className="text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">{error}</p>}
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
          <CustomSelect
            value={form.tier ?? 'apprentice'}
            onChange={v => set('tier', v)}
            options={[{ value: 'apprentice', label: 'Apprentice' }, { value: 'journeyman', label: 'Journeyman' }, { value: 'adept', label: 'Adept' }, { value: 'masterwork', label: 'Masterwork' }]}
            placeholder=""
          />
        </Field>

        <Field label="Form">
          <CustomSelect
            value={form.form ?? 'talisman'}
            onChange={v => set('form', v as ItemForm)}
            options={[
              { value: 'weapon-1h', label: 'Weapon (1H)' },
              { value: 'weapon-great', label: 'Weapon (Great)' },
              { value: 'weapon-polearm', label: 'Weapon (Polearm)' },
              { value: 'weapon-spear', label: 'Weapon (Spear)' },
              { value: 'weapon-implement', label: 'Weapon (Implement)' },
              { value: 'weapon-paired', label: 'Weapon (Paired)' },
              { value: 'armour', label: 'Armour' },
              { value: 'talisman', label: 'Talisman' },
              { value: 'talisman-icon', label: 'Talisman (Icon)' },
              { value: 'talisman-reliquary', label: 'Talisman (Reliquary)' },
              { value: 'talisman-paraphernalia', label: 'Talisman (Paraphernalia)' },
              { value: 'standard', label: 'Standard' },
            ]}
            placeholder=""
          />
        </Field>

        <Field label="Bonded To">
          <CustomSelect
            value={form.bonded_to ?? ''}
            onChange={v => set('bonded_to', v || null)}
            options={data.members.filter(m => m.status === 'active').map(m => ({ value: m.id, label: m.name }))}
            placeholder="— Unassigned —"
          />
        </Field>

        <Field label="Status">
          <CustomSelect
            value={form.status ?? 'available'}
            onChange={v => set('status', v as MagicItemStock['status'])}
            options={[{ value: 'available', label: 'Available' }, { value: 'bonded', label: 'Bonded' }, { value: 'reserved', label: 'Reserved' }, { value: 'expired', label: 'Expired' }]}
            placeholder=""
          />
        </Field>

        <Field label="Created at Event" optional>
          <CustomSelect
            value={form.created_at_event ?? ''}
            onChange={v => set('created_at_event', v || null)}
            options={[...data.events].sort((a, b) => b.sort_order - a.sort_order).map(ev => ({ value: ev.id, label: ev.name }))}
            placeholder="— None —"
          />
        </Field>

        <Field label="Expires After Event" optional>
          <CustomSelect
            value={form.expires_after_event ?? ''}
            onChange={v => set('expires_after_event', v || null)}
            options={[...data.events].sort((a, b) => b.sort_order - a.sort_order).map(ev => ({ value: ev.id, label: ev.name }))}
            placeholder="— None —"
          />
        </Field>

        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>
    </Modal>
  );
}
