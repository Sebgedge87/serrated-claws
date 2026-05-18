import { useState } from 'react';
import type { House } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { houseIdFromName } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onSave: (house: Pick<House, 'id' | 'name' | 'motto' | 'description' | 'primary_color' | 'sort_order'>) => Promise<void>;
}

const SWATCHES = ['#d4b46d', '#a8413f', '#7eb0d4', '#9c7eb0', '#7ea88e', '#e0c66d', '#b56eb5', '#ff8a6b'];

export function AddHouseModal({ onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({
        id: houseIdFromName(name),
        name: name.trim(),
        motto: motto.trim() || null,
        description: description.trim() || null,
        primary_color: color,
        sort_order: 99
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title="Found a New House"
      subtitle="Add a banner to the lance"
      accent={color}
      icon={<Icons.Shield size={22} />}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!name.trim() || busy} className="btn btn-primary">
            <Icons.Shield size={15} />
            {busy ? 'Founding…' : 'Found House'}
          </button>
        </>
      }
    >
      <Field label="House Name">
        <input
          type="text"
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="House Ashmark"
          className="input font-display font-semibold text-base"
        />
      </Field>
      <Field label="Motto" optional>
        <input
          type="text"
          value={motto}
          onChange={e => setMotto(e.target.value)}
          placeholder="By Fire and Iron"
          className="input italic"
        />
      </Field>
      <Field label="Description" optional>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief history, heraldry, traditions…"
          rows={3}
          className="input resize-y"
        />
      </Field>
      <Field label="House Colour">
        <div className="flex gap-2 flex-wrap">
          {SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-lg cursor-pointer transition-all"
              style={{
                background: `linear-gradient(180deg, ${c}, ${c}cc)`,
                border: `2px solid ${color === c ? c : 'transparent'}`,
                outline: color === c ? '1px solid rgba(255,255,255,0.4)' : 'none',
                outlineOffset: '2px',
                boxShadow: color === c ? `0 0 16px ${c}80` : 'none'
              }}
            />
          ))}
        </div>
      </Field>
    </Modal>
  );
}
