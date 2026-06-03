import { useState } from 'react';
import type { Business, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DataRow } from '@/components/ui/DataRow';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  canManageBusiness: (id: string) => boolean;
  onUpsert: (b: Partial<Business> & { id: string; name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const A = '#7eb0d4';

type DetailForm = Partial<Business> & { owners: string[] };

export function BusinessesTab({ data, isAdmin, canManageBusiness, onUpsert, onDelete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailForm, setDetailForm] = useState<DetailForm>({ owners: [] });
  const [saving, setSaving] = useState(false);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const biz = selected ? data.businesses.find(b => b.id === selected) ?? null : null;

  function goTo(id: string) {
    const b = data.businesses.find(b => b.id === id);
    setDetailForm(b ? { ...b, owners: [...b.owners] } : { owners: [] });
    setSelected(id);
  }

  const canEdit = biz ? canManageBusiness(biz.id) : false;
  const dirty = biz && (
    detailForm.name !== biz.name ||
    (detailForm.type ?? null) !== (biz.type ?? null) ||
    (detailForm.resources ?? null) !== (biz.resources ?? null) ||
    (detailForm.notes ?? null) !== (biz.notes ?? null) ||
    JSON.stringify([...detailForm.owners].sort()) !== JSON.stringify([...biz.owners].sort())
  );

  async function saveDetail() {
    if (!biz || !dirty || !detailForm.name?.trim()) return;
    setSaving(true);
    try { await onUpsert({ ...detailForm, id: biz.id, name: detailForm.name }); }
    finally { setSaving(false); }
  }

  if (biz) {
    const sortedMembers = [...data.members].filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
    const selectedOwners = detailForm.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean) as LanceData['members'];
    const unselected = sortedMembers.filter(m => !detailForm.owners.includes(m.id));

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">← Back to Businesses</button>
          <div className="flex gap-2">
            {canEdit && dirty && (
              <button onClick={saveDetail} disabled={saving || !detailForm.name?.trim()} className="btn btn-primary btn-sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {isAdmin && (
              <button onClick={async () => { if (await confirm({ title: `Delete ${biz.name}?`, danger: true })) { await onDelete(biz.id); setSelected(null); } }} className="btn btn-danger btn-sm">
                <Icons.Trash size={13} /> Delete
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Briefcase size={26} />
          </div>
          <div className="flex-1 min-w-0">
            {canEdit ? (
              <input
                className="font-display font-bold text-3xl text-ink-100 bg-transparent border border-transparent hover:border-blue-400/30 focus:border-blue-400/50 rounded-lg px-2 -mx-2 outline-none w-full transition-colors"
                value={detailForm.name ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, name: e.target.value }))}
              />
            ) : (
              <h2 className="font-display font-bold text-3xl text-ink-100 m-0">{biz.name}</h2>
            )}
            {canEdit ? (
              <input
                className="mt-1 text-xs uppercase tracking-widest text-ink-100/50 bg-transparent border border-transparent hover:border-blue-400/30 focus:border-blue-400/50 rounded px-1 -mx-1 outline-none w-full transition-colors"
                placeholder="Type (optional)"
                value={detailForm.type ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, type: e.target.value || null }))}
              />
            ) : (
              biz.type && <p className="text-xs uppercase tracking-widest text-ink-100/50 m-0 mt-0.5">{biz.type}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-6">
          <div className="card p-5">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Resources</div>
            {canEdit ? (
              <textarea
                rows={3}
                className="w-full bg-transparent border border-transparent hover:border-blue-400/30 focus:border-blue-400/50 rounded-lg p-0 outline-none text-ink-100/80 resize-y text-sm transition-colors"
                placeholder="Describe resources…"
                value={detailForm.resources ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, resources: e.target.value || null }))}
              />
            ) : (
              <p className="text-ink-100/80 m-0">{biz.resources ?? <span className="text-ink-100/30 italic">None recorded</span>}</p>
            )}
          </div>
          <div className="card p-5">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Notes</div>
            {canEdit ? (
              <textarea
                rows={3}
                className="w-full bg-transparent border border-transparent hover:border-blue-400/30 focus:border-blue-400/50 rounded-lg p-0 outline-none text-ink-100/80 resize-y text-sm transition-colors"
                placeholder="Add notes…"
                value={detailForm.notes ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, notes: e.target.value || null }))}
              />
            ) : (
              <p className="text-ink-100/80 m-0">{biz.notes ?? <span className="text-ink-100/30 italic">None</span>}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <Icons.Users size={15} style={{ color: A }} />
          <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color: A }}>Owners · {selectedOwners.length}</h3>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${A}40, transparent)` }} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-4">
          {selectedOwners.map(o => (
            <div key={o.id} className="card card-lift p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm flex-shrink-0"
                   style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                {initials(o.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink-100 truncate">{o.name}</div>
                <div className="text-xs text-ink-100/50">{data.houses.find(h => h.id === o.house_id)?.name ?? 'Unassigned'}</div>
              </div>
              {canEdit && (
                <button
                  onClick={() => setDetailForm(f => ({ ...f, owners: f.owners.filter(id => id !== o.id) }))}
                  className="text-ink-100/30 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  title="Remove owner"
                >
                  <Icons.Trash size={13} />
                </button>
              )}
            </div>
          ))}
          {selectedOwners.length === 0 && <p className="text-ink-100/40 text-sm py-4 col-span-full">No owners assigned.</p>}
        </div>

        {canEdit && unselected.length > 0 && (
          <select
            className="input max-w-xs"
            value=""
            onChange={e => { if (e.target.value) { setDetailForm(f => ({ ...f, owners: [...f.owners, e.target.value] })); e.currentTarget.value = ''; } }}
          >
            <option value="">+ Add owner…</option>
            {unselected.map(m => (
              <option key={m.id} value={m.id}>{m.name} · {data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned'}</option>
            ))}
          </select>
        )}

        {ConfirmDialog}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Businesses</h2>
          <p className="text-sm text-ink-100/60 italic m-0">{data.businesses.length} holdings of the lance</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="btn btn-primary">
            <Icons.Plus size={15} /> + Add Business
          </button>
        )}
      </div>

      <SectionHeader title="Ventures" count={data.businesses.length} />

      <div>
        {/* Header row */}
        <div className="flex items-center gap-3 py-1.5 mb-1 text-[11px] uppercase tracking-widest text-ink-300 font-semibold border-b border-[color:var(--line)]">
          <span className="w-[3px] flex-shrink-0" />
          <span className="flex-1 min-w-0">Venture</span>
          <span className="w-28 hidden sm:block">Kind</span>
          <span className="w-36 hidden md:block">Proprietor</span>
          <span className="w-20 text-right hidden sm:block">Income</span>
          <span className="w-20 text-right">Status</span>
        </div>

        {data.businesses.map(b => {
          const owners = b.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean);
          const firstOwner = owners[0];
          return (
            <DataRow key={b.id} accent="var(--gold)" onClick={() => goTo(b.id)}>
              <span className="flex-1 min-w-0 font-display text-[17px] font-semibold text-ink-100 truncate">{b.name}</span>
              <span className="w-28 text-xs text-ink-300 hidden sm:block truncate">{b.type ?? '—'}</span>
              <span className="w-36 text-xs text-ink-300 hidden md:block truncate">{firstOwner ? firstOwner.name : '—'}</span>
              <span className="w-20 text-right num text-[var(--gold)] hidden sm:block">—</span>
              <span className="w-20 text-right">
                <span className="inline-flex items-center gap-1 text-xs text-ink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--ok)] flex-shrink-0" />
                  Active
                </span>
              </span>
            </DataRow>
          );
        })}
        {data.businesses.length === 0 && (
          <p className="text-ink-100/40 text-sm py-10 text-center">No businesses yet.{isAdmin ? ' Click "+ Add Business" to add one.' : ''}</p>
        )}
      </div>

      {creating && (
        <BizModal
          data={data}
          onClose={() => setCreating(false)}
          onSave={async b => {
            await onUpsert(b);
            setCreating(false);
            goTo(b.id);
          }}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}

function BizModal({ data, onClose, onSave }: { data: LanceData; onClose: () => void; onSave: (b: Partial<Business> & { id: string; name: string }) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Business> & { owners: string[] }>({ name: '', owners: [] });
  const [busy, setBusy] = useState(false);

  const sortedMembers = [...data.members].filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
  const selectedOwners = form.owners.map(id => data.members.find(m => m.id === id)).filter(Boolean) as LanceData['members'];
  const unselected = sortedMembers.filter(m => !form.owners.includes(m.id));

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `biz-${Date.now()}`;
    try { await onSave({ ...form, id, name: form.name }); } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title="New Business" icon={<Icons.Briefcase size={20} />} accent="#7eb0d4" width="lg"
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={busy || !form.name?.trim()} className="btn btn-primary">{busy ? 'Saving…' : 'Create'}</button></>}>
      <Field label="Name"><input className="input" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
      <Field label="Type" optional><input className="input" value={form.type ?? ''} onChange={e => setForm({ ...form, type: e.target.value || null })} /></Field>
      <Field label="Resources" optional><textarea rows={2} className="input resize-y" value={form.resources ?? ''} onChange={e => setForm({ ...form, resources: e.target.value || null })} /></Field>
      <Field label="Notes" optional><textarea rows={2} className="input resize-y" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value || null })} /></Field>
      <Field label="Owners">
        {selectedOwners.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedOwners.map(o => (
              <span key={o.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                {o.name}
                <button type="button" onClick={() => setForm(f => ({ ...f, owners: f.owners.filter(id => id !== o.id) }))} className="hover:text-red-400 transition-colors ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
        <select className="input" value="" onChange={e => { if (e.target.value) { setForm(f => ({ ...f, owners: [...f.owners, e.target.value] })); e.currentTarget.value = ''; } }} disabled={unselected.length === 0}>
          <option value="">{unselected.length === 0 ? 'All members added' : '+ Add owner…'}</option>
          {unselected.map(m => <option key={m.id} value={m.id}>{m.name} · {data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned'}</option>)}
        </select>
      </Field>
    </Modal>
  );
}
