import { useState } from 'react';
import type { Func, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  canManageFunction: (id: string) => boolean;
  onUpsert: (f: Partial<Func> & { id: string; name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const A = '#d4b46d';

export function FunctionsTab({ data, isAdmin, canManageFunction, onUpsert, onDelete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailForm, setDetailForm] = useState<Partial<Func>>({});
  const [saving, setSaving] = useState(false);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const fn = selected ? data.functions.find(f => f.id === selected) ?? null : null;

  function goTo(id: string) {
    const f = data.functions.find(fn => fn.id === id);
    setDetailForm(f ? { ...f } : {});
    setSelected(id);
  }

  const canEdit = fn ? canManageFunction(fn.id) : false;
  const dirty = fn && (
    detailForm.name !== fn.name ||
    (detailForm.leader ?? null) !== (fn.leader ?? null) ||
    (detailForm.description ?? null) !== (fn.description ?? null)
  );

  async function saveDetail() {
    if (!fn || !dirty || !detailForm.name?.trim()) return;
    setSaving(true);
    try { await onUpsert({ ...detailForm, id: fn.id, name: detailForm.name }); }
    finally { setSaving(false); }
  }

  if (fn) {
    const members = data.members.filter(m => m.function === fn.id);
    const activeMembers = data.members.filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">← Back to Functions</button>
          <div className="flex gap-2">
            {canEdit && dirty && (
              <button onClick={saveDetail} disabled={saving || !detailForm.name?.trim()} className="btn btn-primary btn-sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {isAdmin && (
              <button onClick={async () => { if (await confirm({ title: `Delete ${fn.name}?`, danger: true })) { await onDelete(fn.id); setSelected(null); } }} className="btn btn-danger btn-sm">
                <Icons.Trash size={13} /> Delete
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Swords size={26} />
          </div>
          <div className="flex-1 min-w-0">
            {canEdit ? (
              <input
                className="font-display font-bold text-3xl text-ink-100 bg-transparent border border-transparent hover:border-gold-500/30 focus:border-gold-500/50 rounded-lg px-2 -mx-2 outline-none w-full transition-colors"
                value={detailForm.name ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, name: e.target.value }))}
              />
            ) : (
              <h2 className="font-display font-bold text-3xl text-ink-100 m-0">{fn.name}</h2>
            )}
            {canEdit ? (
              <select
                className="mt-1 text-sm bg-transparent border border-transparent hover:border-gold-500/30 focus:border-gold-500/50 rounded px-1 -mx-1 outline-none transition-colors"
                style={{ color: detailForm.leader ? A : 'rgba(255,255,255,0.4)' }}
                value={detailForm.leader ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, leader: e.target.value || null }))}
              >
                <option value="">— No leader —</option>
                {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            ) : (
              fn.leader && <p className="text-sm m-0 mt-0.5" style={{ color: A }}>Led by {data.members.find(m => m.id === fn.leader)?.name ?? '—'}</p>
            )}
          </div>
        </div>

        {(canEdit || fn.description) && (
          <div className="card p-5 mb-6">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Description</div>
            {canEdit ? (
              <textarea
                rows={3}
                className="w-full bg-transparent border border-transparent hover:border-gold-500/30 focus:border-gold-500/50 rounded-lg p-0 outline-none text-ink-100/70 leading-relaxed resize-y text-sm transition-colors"
                placeholder="Add a description…"
                value={detailForm.description ?? ''}
                onChange={e => setDetailForm(f => ({ ...f, description: e.target.value || null }))}
              />
            ) : (
              <p className="text-ink-100/70 leading-relaxed m-0">{fn.description}</p>
            )}
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
                  <div className="text-xs text-ink-100/50">
                    {house?.name ?? 'Unassigned'}{m.rank ? ` · ${m.rank}` : ''}{m.military_function ? ` · ${m.military_function}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
          {members.length === 0 && <p className="text-ink-100/40 text-sm py-8 col-span-full">No members assigned to this function.</p>}
        </div>

        {ConfirmDialog}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icons.Swords size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Functions</h2>
            <p className="text-sm text-ink-100/60 m-0">{data.functions.length} roles across the lance</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="btn btn-secondary">
            <Icons.Plus size={15} /> New Function
          </button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {data.functions.map(f => {
          const members = data.members.filter(m => m.function === f.id);
          return (
            <button key={f.id} onClick={() => goTo(f.id)} className="card card-lift p-5 text-left w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
                  <Icons.Swords size={18} />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-100 leading-tight m-0">{f.name}</h3>
              </div>
              {f.leader && <p className="text-xs mb-2 m-0" style={{ color: A }}>Led by {data.members.find(m => m.id === f.leader)?.name ?? '—'}</p>}
              {f.description && <p className="text-sm text-ink-100/60 mb-3 m-0" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gold-500/10">
                <span className="text-xs text-ink-100/50">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                <span className="text-xs" style={{ color: A }}>View →</span>
              </div>
            </button>
          );
        })}
        {data.functions.length === 0 && (
          <p className="text-ink-100/40 text-sm py-16 text-center col-span-full">No functions yet.{isAdmin ? ' Click "New Function" to add one.' : ''}</p>
        )}
      </div>

      {creating && (
        <FnModal
          members={data.members}
          onClose={() => setCreating(false)}
          onSave={async f => {
            const id = f.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `fn-${Date.now()}`;
            await onUpsert({ ...f, id, name: f.name! });
            setCreating(false);
            goTo(id);
          }}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}

function FnModal({ members, onClose, onSave }: { members: LanceData['members']; onClose: () => void; onSave: (f: Partial<Func>) => Promise<void> }) {
  const [form, setForm] = useState<Partial<Func>>({ name: '' });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }

  const activeMembers = members.filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal onClose={onClose} title="New Function" icon={<Icons.Swords size={20} />}
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={busy || !form.name?.trim()} className="btn btn-primary">{busy ? 'Saving…' : 'Create'}</button></>}>
      <Field label="Name"><input className="input" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
      <Field label="Leader" optional>
        <select className="input" value={form.leader ?? ''} onChange={e => setForm({ ...form, leader: e.target.value || null })}>
          <option value="">— None —</option>
          {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <Field label="Description" optional><textarea rows={3} className="input resize-y" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value || null })} /></Field>
    </Modal>
  );
}
