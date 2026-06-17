import { useState } from 'react';
import type { House } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { houseIdFromName } from '@/lib/utils';
import { NATIONS, nationConfig, type Nation } from '@/lib/nations';

interface Props {
  onClose: () => void;
  onSave: (house: Pick<House, 'id' | 'name' | 'motto' | 'description' | 'primary_color' | 'sort_order' | 'nation'>) => Promise<void>;
  initial?: House;
}

export function AddHouseModal({ onClose, onSave, initial }: Props) {
  const initNation = (initial?.nation ?? 'Dawn') as Nation;
  const initCfg = nationConfig(initNation);

  const [nation, setNation] = useState<Nation>(initNation);
  const [name, setName] = useState(initial?.name ?? '');
  const [motto, setMotto] = useState(initial?.motto ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.primary_color ?? initCfg.colors[0]);
  const [busy, setBusy] = useState(false);

  const cfg = nationConfig(nation);

  function selectNation(n: Nation) {
    const c = nationConfig(n);
    setNation(n);
    setColor(c.colors[0]);
  }

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({
        id: initial?.id ?? houseIdFromName(name),
        name: name.trim(),
        motto: motto.trim() || null,
        description: description.trim() || null,
        primary_color: color,
        sort_order: initial?.sort_order ?? 99,
        nation,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initial ? `Edit ${cfg.groupTerm}` : `Found a New ${cfg.groupTerm}`}
      subtitle={`${nation} · ${cfg.groupTerm}`}
      accent={color}
      icon={<Icons.Shield size={22} />}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!name.trim() || busy} className="btn btn-primary" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)` }}>
            <Icons.Shield size={15} />
            {busy ? 'Saving…' : initial ? `Save ${cfg.groupTerm}` : `Found ${cfg.groupTerm}`}
          </button>
        </>
      }
    >
      {/* Nation picker */}
      <Field label="Nation">
        <div className="grid grid-cols-2 gap-1.5">
          {NATIONS.map(n => {
            const active = nation === n.nation;
            return (
              <button
                key={n.nation}
                type="button"
                onClick={() => selectNation(n.nation as Nation)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all"
                style={{
                  background: active ? `${n.colors[0]}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? n.colors[0] + '80' : 'rgba(201,169,97,0.12)'}`,
                  color: active ? n.colors[0] : 'rgb(var(--ink-300))',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{n.icon}</span>
                <span className="truncate">{n.nation}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={`${cfg.groupTerm} Name`}>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={nation === 'Dawn' ? 'House Ashmark' : nation === 'Wintermark' ? 'The Iron Hall' : nation === 'Urizen' ? 'Spire of the Silver Path' : `${cfg.groupTerm} name…`}
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

      <Field label="Colour">
        <div className="flex gap-2 flex-wrap">
          {cfg.colors.map(c => (
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
                boxShadow: color === c ? `0 0 16px ${c}80` : 'none',
              }}
            />
          ))}
        </div>
      </Field>
    </Modal>
  );
}
