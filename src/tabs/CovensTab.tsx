import { useMemo, useState } from 'react';
import type { Coven, CovenRitual, LanceData } from '@/lib/types';
import { RITUALS_CATALOGUE, REALM_COLORS } from '@/lib/ritualsCatalogue';
import type { RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { exportRitualsPdf } from '@/lib/parchmentPdf';
import { initials } from '@/lib/utils';

interface Props {
  data: LanceData;
  isAdmin: boolean;
  canManageCoven: (id: string) => boolean;
  onUpsert: (c: Partial<Coven> & { id: string; name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpsertRitual: (r: Omit<CovenRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual: (id: string) => Promise<void>;
}

const A = '#b56eb5';
const DOMAINS: RitualRealm[] = ['Spring', 'Summer', 'Autumn', 'Winter', 'Day', 'Night'];


export function CovensTab({ data, isAdmin, canManageCoven, onUpsert, onDelete, onUpsertRitual, onDeleteRitual }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Coven> | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  const coven = selected ? data.covens.find(c => c.id === selected) : null;

  if (coven) {
    return (
      <>
        <CovenDetail
          coven={coven}
          data={data}
          isAdmin={isAdmin}
          canManage={canManageCoven(coven.id)}
          onBack={() => setSelected(null)}
          onUpsert={onUpsert}
          onDelete={async () => {
            if (await confirm({ title: `Delete ${coven.name}?`, body: 'This will remove the coven and all its rituals.', danger: true })) {
              await onDelete(coven.id);
              setSelected(null);
            }
          }}
          onUpsertRitual={onUpsertRitual}
          onDeleteRitual={onDeleteRitual}
          confirm={confirm}
        />
        {ConfirmDialog}
      </>
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
          const rituals = data.covenRituals.filter(r => r.coven_id === c.id);
          const totalMagnitude = rituals.reduce((s, r) => s + r.magnitude, 0);
          const dc = c.domain ? REALM_COLORS[c.domain as RitualRealm] : null;
          return (
            <button key={c.id} onClick={() => setSelected(c.id)} className="card card-lift p-5 text-left w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: dc ? `${dc.text}20` : `${A}20`, border: `1px solid ${dc ? dc.text : A}40`, color: dc?.text ?? A }}>
                  <Icons.Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink-100 leading-tight m-0">{c.name}</h3>
                  {c.domain && <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: dc?.text ?? A }}>{c.domain}</span>}
                </div>
              </div>
              {c.leader && <p className="text-xs mb-2 m-0" style={{ color: A }}>Led by {c.leader}</p>}
              {c.description && <p className="text-sm text-ink-100/60 mb-3 m-0" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-gold-500/10">
                <span className="text-xs text-ink-100/50">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                {rituals.length > 0 && <span className="text-xs" style={{ color: dc?.text ?? A }}>{rituals.length} ritual{rituals.length !== 1 ? 's' : ''} · {totalMagnitude} mag</span>}
                <span className="text-xs" style={{ color: dc?.text ?? A }}>View →</span>
              </div>
            </button>
          );
        })}
        {data.covens.length === 0 && (
          <p className="text-ink-100/40 text-sm py-16 text-center col-span-full">No covens yet.{isAdmin ? ' Click "New Coven" to add one.' : ''}</p>
        )}
        {/* Coven leaders see a hint to click their coven */}
        {data.covens.length > 0 && !isAdmin && data.covens.some(c => canManageCoven(c.id)) && (
          <p className="text-ink-100/40 text-xs col-span-full">You can edit covens you lead.</p>
        )}
      </div>

      {editing !== null && (
        <CovenModal
          members={data.members}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async f => {
            const id = f.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `coven-${Date.now()}`;
            await onUpsert({ ...f, id, name: f.name! });
            setEditing(null);
          }}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}

// ── Coven Detail ──────────────────────────────────────────────────────────────

function CovenDetail({
  coven, data, isAdmin, canManage, onBack, onUpsert, onDelete, onUpsertRitual, onDeleteRitual, confirm
}: {
  coven: Coven;
  data: LanceData;
  isAdmin: boolean;
  canManage: boolean;
  onBack: () => void;
  onUpsert: (c: Partial<Coven> & { id: string; name: string }) => Promise<void>;
  onDelete: () => void;
  onUpsertRitual: (r: Omit<CovenRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual: (id: string) => Promise<void>;
  confirm: (opts: { title: string; body?: string; danger?: boolean; confirmLabel?: string }) => Promise<boolean>;
}) {
  const [addingRitual, setAddingRitual] = useState(false);
  const [editingRitual, setEditingRitual] = useState<CovenRitual | null>(null);
  const [editingCoven, setEditingCoven] = useState(false);

  const members = data.members.filter(m => m.coven === coven.id);
  const rituals = data.covenRituals.filter(r => r.coven_id === coven.id);
  const totalRequired = rituals.reduce((s, r) => s + r.magnitude, 0);
  const manaHave = members.reduce((sum, m) => sum + (m.mp ?? 0), 0);
  const manaNeeded = Math.max(0, totalRequired - manaHave);
  const surplus = manaHave - totalRequired;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Back to Covens</button>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setEditingCoven(true)} className="btn btn-secondary btn-sm"><Icons.Edit size={13} /> Edit</button>
            {isAdmin && <button onClick={onDelete} className="btn btn-danger btn-sm"><Icons.Trash size={13} /> Delete</button>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        {(() => {
          const dc = coven.domain ? REALM_COLORS[coven.domain as RitualRealm] : null;
          const c = dc?.text ?? A;
          return (
            <>
              <div className="w-14 h-14 rounded-xl grid place-items-center" style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>
                <Icons.Sparkles size={26} />
              </div>
              <div>
                <h2 className="font-display font-bold text-3xl text-ink-100 m-0">{coven.name}</h2>
                {coven.domain && <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: c }}>{coven.domain}</span>}
                {coven.leader && <p className="text-sm m-0 mt-0.5" style={{ color: A }}>Led by {coven.leader}</p>}
              </div>
            </>
          );
        })()}
      </div>

      {coven.description && (
        <div className="card p-5 mb-6">
          <p className="text-ink-100/70 leading-relaxed m-0">{coven.description}</p>
        </div>
      )}

      {/* Mana Dashboard */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icons.Zap size={15} style={{ color: A }} />
          <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color: A }}>Mana</h3>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <ManaStatBox label="Required" value={totalRequired} color="#e8a870" />
          <ManaStatBox label="Have" value={manaHave} color={A} />
          <ManaStatBox label="Needed" value={manaNeeded} color={manaNeeded > 0 ? '#e87070' : '#6ad47e'} />
          <ManaStatBox label="Surplus" value={surplus} color={surplus >= 0 ? '#6ad47e' : '#e87070'} />
        </div>
        {totalRequired > 0 && (
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (manaHave / totalRequired) * 100)}%`,
                background: manaHave >= totalRequired
                  ? 'linear-gradient(90deg, #6ad47e, #4ab85e)'
                  : `linear-gradient(90deg, ${A}, ${A}80)`
              }}
            />
          </div>
        )}
      </div>

      {/* Rituals */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Icons.Sparkles size={15} style={{ color: A }} />
          <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color: A }}>Rituals · {rituals.length}</h3>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${A}40, transparent)` }} />
          {rituals.length > 0 && (
            <button onClick={() => exportRitualsPdf(coven.name, coven.domain, rituals, manaHave)} className="btn btn-ghost btn-sm text-xs" style={{ color: A }}>
              <Icons.Download size={12} /> Export PDF
            </button>
          )}
          {canManage && (
            <button onClick={() => setAddingRitual(true)} className="btn btn-ghost btn-sm text-xs" style={{ color: A }}>
              <Icons.Plus size={12} /> Add Ritual
            </button>
          )}
        </div>

        <div className="space-y-2">
          {rituals.map(r => (
            <div key={r.id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 text-sm font-mono font-bold"
                     style={{ background: `${A}20`, color: A }}>
                  {r.magnitude}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-100 text-sm">{r.ritual_name}</div>
                  <div className="text-xs text-ink-100/50">
                    {r.realm && <span className="mr-2">{r.realm}</span>}
                    {r.notes && <span className="italic">{r.notes}</span>}
                  </div>
                  {r.wording && (
                    <div className="text-xs text-ink-100/40 mt-1 italic truncate">"{r.wording}"</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canManage && (
                  <button onClick={() => setEditingRitual(r)} className="btn btn-ghost btn-sm">
                    <Icons.Edit size={13} />
                  </button>
                )}
                {canManage && (
                  <button onClick={async () => { if (await confirm({ title: `Remove ${r.ritual_name}?`, danger: true, confirmLabel: 'Remove' })) onDeleteRitual(r.id); }} className="btn btn-ghost btn-sm text-red-400/60 hover:text-red-400">
                    <Icons.Trash size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {rituals.length === 0 && (
            <p className="text-ink-100/40 text-sm py-6 text-center">No rituals added yet.{canManage ? ' Click "Add Ritual" to start.' : ''}</p>
          )}
        </div>
      </div>

      {/* Members */}
      <div>
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
                  {m.mp != null && <div className="text-xs" style={{ color: A }}>{m.mp} MP</div>}
                </div>
              </div>
            );
          })}
          {members.length === 0 && <p className="text-ink-100/40 text-sm py-8 col-span-full">No members assigned to this coven yet.</p>}
        </div>
      </div>

      {addingRitual && (
        <RitualModal
          covenId={coven.id}
          domain={coven.domain as RitualRealm | null}
          onClose={() => setAddingRitual(false)}
          onSave={async r => { await onUpsertRitual(r); setAddingRitual(false); }}
        />
      )}
      {editingRitual && (
        <RitualModal
          covenId={coven.id}
          domain={coven.domain as RitualRealm | null}
          initial={editingRitual}
          onClose={() => setEditingRitual(null)}
          onSave={async r => { await onUpsertRitual({ ...r, id: editingRitual.id }); setEditingRitual(null); }}
        />
      )}
      {editingCoven && (
        <CovenModal
          members={data.members}
          initial={coven}
          onClose={() => setEditingCoven(false)}
          onSave={async f => { await onUpsert({ ...f, id: coven.id, name: f.name! }); setEditingCoven(false); }}
        />
      )}
    </div>
  );
}

function ManaStatBox({
  label, value, color, editable, editing, inputValue, onStartEdit, onInput, onSave, onCancel
}: {
  label: string;
  value: number;
  color: string;
  editable?: boolean;
  editing?: boolean;
  inputValue?: string;
  onStartEdit?: () => void;
  onInput?: (v: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: `${color}99` }}>{label}</div>
      {editing ? (
        <div className="flex flex-col items-center gap-1">
          <input
            autoFocus
            type="number"
            min={0}
            className="input text-sm py-0.5 text-center w-16"
            value={inputValue}
            onChange={e => onInput?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave?.(); if (e.key === 'Escape') onCancel?.(); }}
          />
          <div className="flex gap-1">
            <button onClick={onSave} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${color}30`, color }}>✓</button>
            <button onClick={onCancel} className="text-[10px] px-1.5 py-0.5 rounded text-ink-100/40 hover:text-ink-100">✕</button>
          </div>
        </div>
      ) : (
        <div
          className="text-2xl font-display font-bold cursor-default"
          style={{ color }}
          onClick={editable ? onStartEdit : undefined}
          title={editable ? 'Click to edit' : undefined}
        >
          {value}
          {editable && <span className="text-[10px] ml-1 opacity-40">✎</span>}
        </div>
      )}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

function CovenModal({ members, initial, onClose, onSave }: { members: LanceData['members']; initial: Partial<Coven>; onClose: () => void; onSave: (c: Partial<Coven>) => Promise<void> }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const isNew = !initial.id;
  const canSave = !!form.name?.trim() && (!isNew || !!form.domain);

  async function save() {
    if (!canSave || busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }

  const dc = form.domain ? REALM_COLORS[form.domain as RitualRealm] : null;
  const activeMembers = members.filter(m => m.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal onClose={onClose} title={isNew ? 'New Coven' : 'Edit Coven'} icon={<Icons.Sparkles size={20} />} accent="#b56eb5"
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={busy || !canSave} className="btn btn-primary">{busy ? 'Saving…' : isNew ? 'Create' : 'Save'}</button></>}>
      <Field label="Name"><input className="input" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
      <Field label={isNew ? 'Domain *' : 'Domain'}>
        <div className="grid grid-cols-3 gap-2">
          {DOMAINS.map(d => {
            const c = REALM_COLORS[d];
            const active = form.domain === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setForm(f => ({ ...f, domain: f.domain === d ? null : d }))}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition-all"
                style={{
                  background: active ? `${c.text}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? c.text : 'rgba(255,255,255,0.08)'}`,
                  color: active ? c.text : 'rgba(255,255,255,0.5)',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        {dc && <p className="text-[11px] mt-1.5" style={{ color: dc.text }}>Rituals will be filtered to {form.domain} + Special</p>}
        {isNew && !form.domain && <p className="text-[11px] mt-1 text-ink-100/40">Select a domain to continue</p>}
      </Field>
      <Field label="Leader" optional>
        <select className="input" value={form.leader ?? ''} onChange={e => setForm({ ...form, leader: e.target.value || null })}>
          <option value="">— None —</option>
          {activeMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </Field>
      <Field label="Description" optional><textarea rows={3} className="input resize-y" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value || null })} /></Field>
    </Modal>
  );
}

function RitualModal({ covenId, domain, initial, onClose, onSave }: {
  covenId: string;
  domain: RitualRealm | null;
  initial?: CovenRitual;
  onClose: () => void;
  onSave: (r: Omit<CovenRitual, 'id'>) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof RITUALS_CATALOGUE[number] | null>(
    initial ? RITUALS_CATALOGUE.find(r => r.name === initial.ritual_name) ?? null : null
  );
  const [magnitude, setMagnitude] = useState(initial?.magnitude ?? 2);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [wording, setWording] = useState(initial?.wording ?? '');
  const [busy, setBusy] = useState(false);

  const allowed = useMemo(() =>
    RITUALS_CATALOGUE.filter(r => !domain || r.realm === domain),
    [domain]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.realm.toLowerCase().includes(q) ||
      r.effect.toLowerCase().includes(q)
    );
  }, [search, allowed]);

  function pick(entry: typeof RITUALS_CATALOGUE[number]) { setSelected(entry); }
  function clear() { setSelected(null); setSearch(''); }

  // In edit mode we already have the ritual data from `initial`, no re-selection needed
  const canSave = isEdit ? !busy : (!busy && !!selected);
  const ritualName = selected?.name ?? initial?.ritual_name ?? '';
  const ritualRealm = selected?.realm ?? initial?.realm ?? null;

  async function save() {
    if (!canSave || !ritualName) return;
    setBusy(true);
    try {
      await onSave({
        coven_id: covenId,
        ritual_name: ritualName,
        magnitude,
        realm: ritualRealm,
        notes: notes.trim() || null,
        wording: wording.trim() || null,
      });
    } finally { setBusy(false); }
  }

  const realmColor = ritualRealm ? REALM_COLORS[ritualRealm as RitualRealm]?.text : A;

  return (
    <Modal onClose={onClose} title={isEdit ? 'Edit Ritual' : 'Add Ritual'} icon={<Icons.Sparkles size={20} />} accent="#b56eb5" width="lg"
      footer={<><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={save} disabled={!canSave} className="btn btn-primary">{busy ? 'Saving…' : isEdit ? 'Save' : 'Add Ritual'}</button></>}>

      {!isEdit && (
        <Field label="Search">
          <input
            className="input"
            autoFocus={!isEdit}
            placeholder="Filter by name, realm, or effect…"
            value={search}
            onChange={e => { setSearch(e.target.value); if (selected) setSelected(null); }}
          />
        </Field>
      )}

      {(isEdit || selected) ? (
        <div className="rounded-lg px-4 py-3 flex items-start justify-between gap-3" style={{ background: `${realmColor}12`, border: `1px solid ${realmColor}30` }}>
          <div>
            <div className="font-semibold text-ink-100">{ritualName}</div>
            {ritualRealm && <div className="text-xs mb-1" style={{ color: realmColor }}>{ritualRealm}</div>}
            {selected?.effect && <div className="text-xs text-ink-100/60 leading-relaxed">{selected.effect}</div>}
          </div>
          {!isEdit && <button onClick={clear} className="text-ink-100/40 hover:text-ink-100 flex-shrink-0 mt-0.5">✕</button>}
        </div>
      ) : !isEdit && (
        <div className="border border-gold-500/15 rounded-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-ink-100/40 text-sm py-6">No rituals match "{search}"</p>
            ) : filtered.map(r => (
              <button key={r.name} onClick={() => pick(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-start gap-3 border-b border-gold-500/8 last:border-0 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-100 leading-snug">{r.name}</div>
                  <div className="text-[11px] text-ink-100/50 leading-snug line-clamp-1">{r.effect}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-gold-500/10 text-[11px] text-ink-100/30">
            {filtered.length} ritual{filtered.length !== 1 ? 's' : ''} · click to select
          </div>
        </div>
      )}

      <Field label="Magnitude">
        <input type="number" min={1} className="input" value={magnitude}
          onChange={e => setMagnitude(parseInt(e.target.value) || 1)} disabled={!selected} />
      </Field>

      <Field label="Casting Wording" optional>
        <textarea rows={4} className="input resize-y font-mono text-sm"
          placeholder="Record the exact wording used when casting this ritual…"
          value={wording} onChange={e => setWording(e.target.value)} disabled={!isEdit && !selected} />
      </Field>

      <Field label="Notes" optional>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any coven notes…" disabled={!isEdit && !selected} />
      </Field>
    </Modal>
  );
}
