import { useState } from 'react';
import type { Coven, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { initials } from '@/lib/utils';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  onUpsert: (c: Partial<Coven> & { id: string; name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const A = '#b56eb5';

export function CovensTab({ data, isAdmin, onUpsert, onDelete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Coven> | null>(null);

  const coven = selected ? data.covens.find(c => c.id === selected) : null;

  if (coven) {
    const members = data.members.filter(m => m.coven === coven.id);
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">← Back to Covens</button>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(coven)} className="btn btn-secondary btn-sm"><Icons.Edit size={13} /> Edit</button>
              <button onClick={async () => { if (confirm(`Delete ${coven.name}?`)) { await onDelete(coven.id); setSelected(null); } }} className="btn btn-danger btn-sm">
                <Icons.Trash size={13} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Sparkles size={26} />
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl text-ink-100 m-0">{coven.name}</h2>
            {coven.leader && <p className="text-sm m-0 mt-0.5" style={{ color: A }}>Led by {coven.leader}</p>}
          </div>
        </div>

        {coven.description && (
          <div className="card p-5 mb-6">
            <p className="text-ink-100/70 leading-relaxed m-0">{coven.description}</p>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-4">
          <Icons.Users size={15} style={{ color: A }} />
          <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color: A }}>Members · {members.length}</h3>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${A}40, transparent)` }} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {members.map(m => {
            const house = data.houses.find(h => h.id === m.house_id);
            return (
              <div key={m.id} className="card card-lift p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm flex-shrink-0"
                     style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                  {initials(m.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-100 truncate">{m.name}</div>
                  <div className="text-xs text-ink-100/50">{house?.name ?? 'Unassigned'}{m.rank ? ` · ${m.rank}` : ''}</div>
                </div>
              </div>
            );
          })}
          {members.length === 0 && <p className="text-ink-100/40 text-sm py-8 col-span-full">No members assigned to this coven yet.</p>}
        </div>

        {editing && <CovenModal initial={editing} onClose={() => setEditing(null)} onSave={async f => { await onUpsert({ ...f, id: coven.id, name: f.name! }); setEditing(null); }} />}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Covens</h2>
            <p className="text-sm text-ink-100/60 m-0">{data.covens.length} circles · {data.members.filter(m => m.coven).length} members</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing({ name: '' })} className="btn btn-secondary">
            <Icons.Plus size={15} /> New Coven
          </button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {data.covens.map(c => {
          const members = data.members.filter(m => m.coven === c.id);
          return (
            <button key={c.id} onClick={() => setSelected(c.id)} className="card card-lift p-5 text-left w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                  <Icons.Sparkles size={18} />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-100 leading-tight m-0">{c.name}</h3>
              </div>
              {c.leader && <p className="text-xs mb-2 m-0" style={{ color: A }}>Led by {c.leader}</p>}
              {c.description && <p className="text-sm text-ink-100/60 mb-3 m-0" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gold-500/10">
                <span className="text-xs text-ink-100/50">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                <span className="text-xs" style={{ color: A }}>View →</span>
              </div>
            </button>
          );
        })}
        {data.covens.length === 0 && (
          <p className="text-ink-100/40 text-sm py-16 text-center col-span-full">No covens yet.{isAdmin ? ' Click "New Coven" to add one.' : ''}</p>
        )}
      </div>

      {editing !== null && (
        <CovenModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async f => {
            const id = f.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `coven-${Date.now()}`;
            await onUpsert({ ...f, id, name: f.name! });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CovenModal({ initial, onClose, onSave }: { initial: Partial<Coven>; onClose: () => void; onSave: (c: Partial<Coven>) => Promise<void> }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title={initial.id ? 'Edit Coven' : 'New Coven'} icon={<Icons.Sparkles size={20} />} accent="#b56eb5"
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={busy || !form.name?.trim()} className="btn btn-primary">{busy ? 'Saving…' : initial.id ? 'Save' : 'Create'}</button></>}>
      <Field label="Name"><input className="input" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
      <Field label="Leader" optional><input className="input" value={form.leader ?? ''} onChange={e => setForm({ ...form, leader: e.target.value || null })} /></Field>
      <Field label="Description" optional><textarea rows={3} className="input resize-y" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value || null })} /></Field>
    </Modal>
  );
}
