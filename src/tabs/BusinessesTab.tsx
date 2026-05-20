import { useState } from 'react';
import type { Business, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  canManageBusiness: (id: string) => boolean;
  onUpsert: (b: Partial<Business> & { id: string; name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const A = '#7eb0d4';

export function BusinessesTab({ data, isAdmin, canManageBusiness, onUpsert, onDelete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Business> | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const biz = selected ? data.businesses.find(b => b.id === selected) : null;

  if (biz) {
    const owners = biz.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean);
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">← Back to Businesses</button>
          {canManageBusiness(biz.id) && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(biz)} className="btn btn-secondary btn-sm"><Icons.Edit size={13} /> Edit</button>
              {isAdmin && (
                <button onClick={async () => { if (await confirm({ title: `Delete ${biz.name}?`, danger: true })) { await onDelete(biz.id); setSelected(null); } }} className="btn btn-danger btn-sm">
                  <Icons.Trash size={13} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Briefcase size={26} />
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl text-ink-100 m-0">{biz.name}</h2>
            {biz.type && <p className="text-xs uppercase tracking-widest text-ink-100/50 m-0 mt-0.5">{biz.type}</p>}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-6">
          {biz.resources && (
            <div className="card p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Resources</div>
              <p className="text-ink-100/80 m-0">{biz.resources}</p>
            </div>
          )}
          {biz.notes && (
            <div className="card p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Notes</div>
              <p className="text-ink-100/80 m-0">{biz.notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <Icons.Users size={15} style={{ color: A }} />
          <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color: A }}>Owners · {owners.length}</h3>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${A}40, transparent)` }} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {owners.map(o => o && (
            <div key={o.id} className="card card-lift p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm flex-shrink-0"
                   style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                {initials(o.name)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink-100 truncate">{o.name}</div>
                <div className="text-xs text-ink-100/50">{data.houses.find(h => h.id === o.house_id)?.name ?? 'Unassigned'}</div>
              </div>
            </div>
          ))}
          {owners.length === 0 && <p className="text-ink-100/40 text-sm py-4">Unclaimed — no owners assigned.</p>}
        </div>

        {editing && <BizModal data={data} initial={editing} onClose={() => setEditing(null)} onSave={async b => { await onUpsert(b); setEditing(null); }} />}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Businesses</h2>
            <p className="text-sm text-ink-100/60 m-0">{data.businesses.length} holdings of the lance</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing({ name: '', owners: [] })} className="btn btn-secondary">
            <Icons.Plus size={15} /> New Business
          </button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {data.businesses.map(b => {
          const owners = b.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean);
          return (
            <button key={b.id} onClick={() => setSelected(b.id)} className="card card-lift p-5 text-left w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                  <Icons.Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg text-ink-100 leading-tight m-0 truncate">{b.name}</h3>
                  {b.type && <p className="text-[11px] uppercase tracking-widest text-ink-100/50 m-0">{b.type}</p>}
                </div>
              </div>
              {b.resources && <p className="text-sm text-ink-100/60 mb-3 m-0" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.resources}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gold-500/10">
                <span className="text-xs text-ink-100/50">{owners.length} owner{owners.length !== 1 ? 's' : ''}</span>
                <span className="text-xs" style={{ color: A }}>View →</span>
              </div>
            </button>
          );
        })}
        {data.businesses.length === 0 && (
          <p className="text-ink-100/40 text-sm py-16 text-center col-span-full">No businesses yet.{isAdmin ? ' Click "New Business" to add one.' : ''}</p>
        )}
      </div>

      {editing !== null && (
        <BizModal
          data={data}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async b => { await onUpsert(b); setEditing(null); }}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}

function BizModal({ data, initial, onClose, onSave }: { data: LanceData; initial: Partial<Business>; onClose: () => void; onSave: (b: Partial<Business> & { id: string; name: string }) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Business> & { owners: string[] }>({ owners: [], ...initial });
  const [busy, setBusy] = useState(false);

  const sortedMembers = [...data.members].filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
  const selectedOwners = form.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean);
  const unselected = sortedMembers.filter(m => !form.owners.includes(m.id));

  function addOwner(id: string) {
    if (id) setForm(f => ({ ...f, owners: [...f.owners, id] }));
  }
  function removeOwner(id: string) {
    setForm(f => ({ ...f, owners: f.owners.filter(o => o !== id) }));
  }

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    const id = form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `biz-${Date.now()}`;
    try { await onSave({ ...form, id, name: form.name }); } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title={initial.id ? 'Edit Business' : 'New Business'} icon={<Icons.Briefcase size={20} />} accent="#7eb0d4" width="lg"
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={busy || !form.name?.trim()} className="btn btn-primary">{busy ? 'Saving…' : initial.id ? 'Save' : 'Create'}</button></>}>
      <Field label="Name"><input className="input" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
      <Field label="Type" optional><input className="input" value={form.type ?? ''} onChange={e => setForm({ ...form, type: e.target.value || null })} /></Field>
      <Field label="Resources" optional><textarea rows={2} className="input resize-y" value={form.resources ?? ''} onChange={e => setForm({ ...form, resources: e.target.value || null })} /></Field>
      <Field label="Notes" optional><textarea rows={2} className="input resize-y" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value || null })} /></Field>
      <Field label="Owners">
        {selectedOwners.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedOwners.map(o => o && (
              <span key={o.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                {o.name}
                <button type="button" onClick={() => removeOwner(o.id)} className="hover:text-red-400 transition-colors ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
        <select
          className="input"
          value=""
          onChange={e => { addOwner(e.target.value); e.target.value = ''; }}
          disabled={unselected.length === 0}
        >
          <option value="">{unselected.length === 0 ? 'All members added' : '+ Add owner…'}</option>
          {unselected.map(m => (
            <option key={m.id} value={m.id}>{m.name} · {data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned'}</option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}
