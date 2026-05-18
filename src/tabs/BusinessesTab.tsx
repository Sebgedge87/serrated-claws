import { useState } from 'react';
import type { Business, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  onUpsert: (b: Partial<Business> & { id: string; name: string }) => Promise<void>;
}

export function BusinessesTab({ data, isAdmin, onUpsert }: Props) {
  const [editing, setEditing] = useState<Business | null>(null);

  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center border border-sky-500/40 text-sky-500" style={{ background: 'linear-gradient(180deg, rgba(126,176,212,0.3), rgba(126,176,212,0.1))' }}>
          <Icons.Briefcase size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Businesses</h2>
          <p className="text-sm text-ink-100/60 m-0">Holdings of the lance</p>
        </div>
      </div>

      <div className="grid gap-3.5">
        {data.businesses.map(biz => {
          const owners = biz.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean);
          return (
            <div key={biz.id} className="card card-lift p-5">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-display font-bold text-ink-100 m-0">{biz.name}</h3>
                  <p className="text-xs text-ink-100/60 uppercase tracking-widest mt-0.5">{biz.type}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => setEditing(biz)} className="btn btn-secondary btn-sm">
                    <Icons.Edit size={13} />
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-1">Owners</div>
                  {owners.length === 0 ? (
                    <div className="text-sm text-ink-100/40 italic">Unclaimed</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {owners.map(o => o && (
                        <span key={o.id} className="text-xs bg-black/30 border border-gold-500/20 rounded-md px-2 py-1">{o.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                {biz.resources && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-1">Resources</div>
                    <div className="text-sm">{biz.resources}</div>
                  </div>
                )}
                {biz.notes && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-1">Notes</div>
                    <div className="text-sm">{biz.notes}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EditBusinessModal data={data} business={editing} onClose={() => setEditing(null)} onSave={async b => {
          await onUpsert(b);
          setEditing(null);
        }} />
      )}
    </div>
  );
}

function EditBusinessModal({ data, business, onClose, onSave }: { data: LanceData; business: Business; onClose: () => void; onSave: (b: Partial<Business> & { id: string; name: string }) => Promise<void> }) {
  const [form, setForm] = useState(business);
  const [busy, setBusy] = useState(false);

  function toggleOwner(id: string) {
    setForm(f => ({
      ...f,
      owners: f.owners.includes(id) ? f.owners.filter(o => o !== id) : [...f.owners, id]
    }));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }

  return (
    <Modal
      onClose={onClose}
      title="Edit Business"
      icon={<Icons.Briefcase size={22} />}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }
    >
      <Field label="Name">
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Type">
        <input className="input" value={form.type ?? ''} onChange={e => setForm({ ...form, type: e.target.value || null })} />
      </Field>
      <Field label="Resources" optional>
        <textarea rows={2} className="input resize-y" value={form.resources ?? ''} onChange={e => setForm({ ...form, resources: e.target.value || null })} />
      </Field>
      <Field label="Notes" optional>
        <textarea rows={3} className="input resize-y" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value || null })} />
      </Field>
      <Field label="Owners">
        <div className="max-h-48 overflow-auto bg-black/30 border border-gold-500/15 rounded-lg p-2 space-y-1">
          {data.members.map(m => (
            <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gold-500/5">
              <input type="checkbox" checked={form.owners.includes(m.id)} onChange={() => toggleOwner(m.id)} className="w-4 h-4 accent-gold-300" />
              <span className="text-sm">{m.name}</span>
              <span className="text-xs text-ink-100/50">· {data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned'}</span>
            </label>
          ))}
        </div>
      </Field>
    </Modal>
  );
}
