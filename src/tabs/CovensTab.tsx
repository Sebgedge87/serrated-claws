import { useMemo, useState } from 'react';
import type { Coven, CovenRitual, LanceData } from '@/lib/types';
import { RITUALS_CATALOGUE, REALM_COLORS } from '@/lib/ritualsCatalogue';
import type { RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { exportRitualsPdf } from '@/lib/parchmentPdf';
import { initials } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DataRow } from '@/components/ui/DataRow';
import { CustomSelect } from '@/components/ui/CustomSelect';

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

// Spec realm hues (flat, no alpha)
const REALM_HUE: Record<RitualRealm, string> = {
  Spring:  '#6F9D77',
  Summer:  '#C2A24F',
  Autumn:  '#BD7A4A',
  Winter:  '#6F97C4',
  Day:     '#CBB25A',
  Night:   '#8A73BF',
  Special: '#C07BA0',
};


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
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Covens</h2>
          <p className="text-sm text-ink-100/60 m-0">{data.covens.length} circles · {data.members.filter(m => m.coven).length} members</p>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing({ name: '' })} className="btn btn-secondary">
            <Icons.Plus size={15} /> New Coven
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.covens.map(c => {
          const members = data.members.filter(m => m.coven === c.id);
          const hue = c.domain ? (REALM_HUE[c.domain as RitualRealm] ?? A) : A;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="card text-left w-full overflow-hidden"
              style={{ borderTop: `2px solid ${hue}` }}
            >
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-xl flex-shrink-0" style={{ color: hue }}>✦</span>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-[20px] text-ink-100 leading-tight m-0 truncate">{c.name}</h3>
                    {c.domain && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: hue }}>
                        {c.domain}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-ink-300 flex-shrink-0 num">{members.length}</span>
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
  const covenHue = coven.domain ? (REALM_HUE[coven.domain as RitualRealm] ?? A) : A;
  const leaderName = coven.leader ? data.members.find(m => m.id === coven.leader)?.name : null;

  return (
    <div className="animate-fade-in">
      {/* Top rule + masthead */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${covenHue}, transparent)` }} />
      <div className="hairline-fade" />

      <div className="flex items-center gap-3.5 mb-2 mt-3">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-lg select-none flex-shrink-0"
          style={{ background: `${covenHue}18`, border: `1px solid ${covenHue}55`, color: covenHue }}
        >
          ✦
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-4xl font-bold text-ink-100 m-0 leading-tight">{coven.name}</h2>
          <p className="text-sm text-ink-100/60 m-0 tracking-wide">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {coven.domain && <span style={{ color: covenHue }}> · {coven.domain}</span>}
            {leaderName && <span className="italic"> · led by {leaderName}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onBack} className="text-xs text-ink-100/50 hover:text-ink-100/80 border border-ink-100/20 rounded px-2 py-1 transition-colors">
            ← Covens
          </button>
          {canManage && (
            <button onClick={() => setEditingCoven(true)} className="text-xs text-ink-100/50 hover:text-ink-100/80 border border-ink-100/20 rounded px-2 py-1 transition-colors">
              Edit
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} className="text-xs text-red-400/60 hover:text-red-400 border border-red-400/20 rounded px-2 py-1 transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>

      {coven.description && (
        <p className="text-sm text-ink-100/70 mt-3 mb-6 max-w-2xl italic">{coven.description}</p>
      )}

      {/* Mana strip — flat bordered row like Overview stat strip */}
      <div
        className="mb-8"
        style={{
          border: '1px solid var(--line)',
          borderRadius: '8px',
          display: 'flex',
          overflow: 'hidden',
          background: 'rgb(var(--ink-800))',
        }}
      >
        {[
          { label: 'Required', value: totalRequired, color: 'rgb(var(--ink-300))' },
          { label: 'Have',     value: manaHave,      color: covenHue },
          { label: 'Needed',   value: manaNeeded,    color: manaNeeded > 0 ? 'var(--danger)' : 'var(--ok)' },
          { label: 'Surplus',  value: surplus,       color: surplus >= 0 ? 'var(--ok)' : 'var(--danger)' },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              padding: '18px 16px',
              borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
              textAlign: 'center',
            }}
          >
            <div className="num" style={{ fontSize: '28px', color: s.color, lineHeight: 1, marginBottom: '5px' }}>{s.value}</div>
            <div className="eyebrow" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rituals */}
      <div className="mb-8">
        <SectionHeader
          title="Rituals Mastered"
          count={rituals.length}
          accent={covenHue}
          action={canManage ? (
            <span onClick={() => setAddingRitual(true)}>+ Add ritual</span>
          ) : undefined}
        />

        <div>
          {rituals.map(r => {
            const ritualHue = r.realm ? (REALM_HUE[r.realm as RitualRealm] ?? covenHue) : covenHue;
            return (
              <DataRow key={r.id} accent={ritualHue}>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-ink-100 text-sm">{r.ritual_name}</span>
                  {r.realm && <span className="ml-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: ritualHue }}>{r.realm}</span>}
                  {r.notes && <span className="ml-2 text-xs text-ink-300 italic">{r.notes}</span>}
                </div>
                <span className="text-xs text-ink-300 num flex-shrink-0">mag {r.magnitude}</span>
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
              </DataRow>
            );
          })}
          {rituals.length === 0 && (
            <p className="text-ink-100/40 text-sm py-6 text-center">No rituals added yet.{canManage ? ' Click "+ Add ritual" to start.' : ''}</p>
          )}
        </div>

        {rituals.length > 0 && (
          <div className="mt-2 flex justify-end">
            <button onClick={() => exportRitualsPdf(coven.name, coven.domain, rituals, manaHave)} className="btn btn-ghost btn-sm text-xs" style={{ color: covenHue }}>
              <Icons.Download size={12} /> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Members — ledger rows */}
      <SectionHeader title="Members" count={members.length} accent={covenHue} />
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'rgb(var(--ink-800))',
        }}
      >
        {members.map((m, i) => {
          const house = data.houses.find(h => h.id === m.house_id);
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: `${covenHue}18`,
                  border: `1px solid ${covenHue}44`,
                  color: covenHue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgb(var(--ink-100))', lineHeight: 1.3 }}>{m.name}</div>
                <div style={{ fontSize: '11px', color: 'rgb(var(--ink-300))' }}>{house?.name ?? 'Unassigned'}{m.rank ? ` · ${m.rank}` : ''}</div>
              </div>
              {m.mp != null && (
                <div className="num" style={{ fontSize: '16px', color: covenHue, flexShrink: 0 }}>{m.mp} <span style={{ fontSize: '10px', color: 'rgb(var(--ink-300))' }}>MP</span></div>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-ink-100/40 text-sm py-10 text-center">No members assigned to this coven yet.</p>
        )}
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
        <CustomSelect
          value={form.leader ?? ''}
          onChange={v => setForm({ ...form, leader: v || null })}
          options={activeMembers.map(m => ({ value: m.id, label: m.name }))}
          placeholder="— None —"
        />
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
    RITUALS_CATALOGUE.filter(r => !domain || r.realm === domain || r.realm === 'Special'),
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
          onChange={e => setMagnitude(parseInt(e.target.value, 10) || 1)} disabled={!selected} />
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
