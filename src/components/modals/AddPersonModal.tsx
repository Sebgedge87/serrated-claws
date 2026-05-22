import { useMemo, useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, CraftingQueueItem, Member, LanceData } from '@/lib/types';
import { SKILLS_CATALOGUE, SKILL_CATEGORY_COLORS, SKILL_CATEGORY_ORDER } from '@/lib/skillsCatalogue';
import type { SkillCategory } from '@/lib/skillsCatalogue';
import { RITUALS_CATALOGUE, REALM_COLORS, RITUAL_REALM_ORDER } from '@/lib/ritualsCatalogue';
import type { RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';

interface Props {
  data: LanceData;
  initial?: Partial<Member>;
  onClose: () => void;
  onSave: (member: Partial<Member> & { name: string }) => Promise<void>;
  onUpsertCharInventory?: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory?: (id: string) => Promise<void>;
  onUpsertSkill?: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill?: (id: string) => Promise<void>;
  onUpsertRitual?: (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual?: (id: string) => Promise<void>;
}

export function AddPersonModal({ data, initial, onClose, onSave, onUpsertCharInventory, onDeleteCharInventory, onUpsertSkill, onDeleteSkill, onUpsertRitual, onDeleteRitual }: Props) {
  const [form, setForm] = useState<Partial<Member>>({
    name: '',
    player_name: null,
    pid: null,
    rank: 'Member',
    function: null,
    military_function: null,
    is_noble: false,
    status: 'active',
    hp: null,
    mp: null,
    resource: null,
    rings_per_event: null as number | null,
    crowns_per_event: null as number | null,
    thrones_per_event: null as number | null,
    attending_event: false,
    coven: null,
    notes: null,
    house_id: data.houses[0]?.id ?? null,
    ...initial
  });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Member>(key: K, value: Member[K] | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({ ...form, name: form.name.trim() } as Partial<Member> & { name: string });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={initial?.id ? 'Edit Member' : 'Add Member'}
      subtitle={initial?.id ? 'Update roster entry' : 'Sworn to a house'}
      icon={<Icons.Users size={22} />}
      width="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={!form.name?.trim() || busy} className="btn btn-primary">
            <Icons.Plus size={15} />
            {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add Member'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Character Name (IC)" span="full">
          <input className="input font-display font-semibold" autoFocus value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Player Name (OC)">
          <input className="input" value={form.player_name ?? ''} onChange={e => set('player_name', e.target.value || null)} />
        </Field>
        <Field label="PID" optional>
          <input className="input font-mono" value={form.pid ?? ''} onChange={e => set('pid', e.target.value || null)} />
        </Field>
        <Field label="House">
          <select className="input" value={form.house_id ?? ''} onChange={e => set('house_id', e.target.value || null)}>
            <option value="">Unassigned</option>
            {data.houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Rank">
          <input className="input" value={form.rank ?? ''} onChange={e => set('rank', e.target.value || null)} />
        </Field>
        <Field label="Claw">
          <select className="input" value={form.function ?? ''} onChange={e => set('function', e.target.value || null)}>
            <option value="">None</option>
            {data.functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Field>
        <Field label="Military Role">
          <input className="input" placeholder="Shield Wall, Battle Mage…" value={form.military_function ?? ''} onChange={e => set('military_function', e.target.value || null)} />
        </Field>
        <Field label="HP">
          <input type="number" className="input" value={form.hp ?? ''} onChange={e => set('hp', e.target.value ? parseInt(e.target.value, 10) : null)} />
        </Field>
        <Field label="MP">
          <input type="number" className="input" value={form.mp ?? ''} onChange={e => set('mp', e.target.value ? parseInt(e.target.value, 10) : null)} />
        </Field>
        <Field label="Resource">
          <input className="input" placeholder="Military Unit, Mana Site…" value={form.resource ?? ''} onChange={e => set('resource', e.target.value || null)} />
        </Field>
        <Field label="Income per Event" optional>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-ink-100/40 block mb-0.5">Rings</label>
            <input type="number" min={0} className="input" placeholder="0" value={form.rings_per_event ?? ''} onChange={e => set('rings_per_event', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div>
            <label className="text-[10px] text-ink-100/40 block mb-0.5">Crowns</label>
            <input type="number" min={0} className="input" placeholder="0" value={form.crowns_per_event ?? ''} onChange={e => set('crowns_per_event', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div>
            <label className="text-[10px] text-ink-100/40 block mb-0.5">Thrones</label>
            <input type="number" min={0} className="input" placeholder="0" value={form.thrones_per_event ?? ''} onChange={e => set('thrones_per_event', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
        </div>
      </Field>
        <Field label="Coven">
          <select className="input" value={form.coven ?? ''} onChange={e => set('coven', e.target.value || null)}>
            <option value="">None</option>
            {data.covens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status ?? 'active'} onChange={e => set('status', e.target.value as Member['status'])}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="KIA">KIA</option>
          </select>
        </Field>
        <Field label="Noble">
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer">
            <input type="checkbox" checked={!!form.is_noble} onChange={e => set('is_noble', e.target.checked)} className="w-5 h-5 accent-gold-300" />
            <span className="text-sm">Member of the nobility</span>
          </label>
        </Field>
        <Field label="Attending Next Event">
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer">
            <input type="checkbox" checked={!!form.attending_event} onChange={e => set('attending_event', e.target.checked)} className="w-5 h-5 accent-gold-300" />
            <span className="text-sm">Will be at the next event</span>
          </label>
        </Field>
        <Field label="Notes" optional span="full">
          <textarea className="input resize-y" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>

      {initial?.id && onUpsertSkill && onDeleteSkill && (
        <CharacterSkillsSection
          memberId={initial.id}
          skills={data.characterSkills.filter(s => s.member_id === initial.id)}
          onUpsert={onUpsertSkill}
          onDelete={onDeleteSkill}
        />
      )}

      {initial?.id && onUpsertRitual && onDeleteRitual && (
        <CharacterRitualsSection
          memberId={initial.id}
          rituals={data.characterRituals.filter(r => r.member_id === initial.id)}
          onUpsert={onUpsertRitual}
          onDelete={onDeleteRitual}
        />
      )}

      {initial?.id && onUpsertCharInventory && onDeleteCharInventory && (
        <CharInventorySection
          memberId={initial.id}
          items={data.characterInventory.filter(ci => ci.member_id === initial.id)}
          onUpsert={onUpsertCharInventory}
          onDelete={onDeleteCharInventory}
        />
      )}

      {initial?.id && (
        <CraftingSection
          memberId={initial.id}
          queue={data.craftingQueue}
          members={data.members}
          events={data.events}
        />
      )}
    </Modal>
  );
}

// ── Character Skills ─────────────────────────────────────────────────────────

function CharacterSkillsSection({
  memberId,
  skills,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  skills: CharacterSkill[];
  onUpsert: (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newSkill, setNewSkill] = useState({ skill_name: '', category: 'Combat' as SkillCategory, rank: 1, notes: '' });
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return SKILLS_CATALOGUE.filter(s => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  function pickSuggestion(s: typeof SKILLS_CATALOGUE[number]) {
    setNewSkill({ skill_name: s.name, category: s.category, rank: 1, notes: '' });
    setSearch(s.name);
  }

  async function addSkill() {
    if (!newSkill.skill_name.trim() || busy) return;
    setBusy(true);
    try {
      await onUpsert({
        member_id: memberId,
        skill_name: newSkill.skill_name.trim(),
        category: newSkill.category,
        rank: newSkill.rank,
        notes: newSkill.notes.trim() || null,
      });
      setSearch('');
      setNewSkill({ skill_name: '', category: 'Combat', rank: 1, notes: '' });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CharacterSkill[]>();
    for (const s of skills) {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [skills]);

  const orderedCategories = [
    ...SKILL_CATEGORY_ORDER.filter(c => grouped.has(c)),
    ...[...grouped.keys()].filter(c => !(SKILL_CATEGORY_ORDER as string[]).includes(c)),
  ];

  return (
    <div className="mt-5 pt-5 border-t border-gold-500/15">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Character Skills</span>
        <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs">
          <Icons.Plus size={13} />
          Add Skill
        </button>
      </div>

      {orderedCategories.map(cat => {
        const catSkills = grouped.get(cat)!;
        const colors = SKILL_CATEGORY_COLORS[(cat as SkillCategory)] ?? SKILL_CATEGORY_COLORS.Other;
        return (
          <div key={cat} className="mb-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/40 mb-1.5">{cat}</div>
            <div className="flex flex-wrap gap-1.5">
              {catSkills.map(sk => (
                <div
                  key={sk.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  <span>{sk.skill_name}</span>
                  {sk.rank > 1 && (
                    <span className="px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: colors.border, color: colors.text }}>
                      ×{sk.rank}
                    </span>
                  )}
                  <button
                    onClick={() => onDelete(sk.id)}
                    className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                    title="Remove skill"
                  >
                    <Icons.X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {skills.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-2">No skills recorded · click Add Skill to begin</p>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border border-gold-500/10 mt-2">
          <div className="relative">
            <input
              autoFocus
              className="input text-sm w-full"
              placeholder="Skill name (e.g. Magician, Endurance…)"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setNewSkill(n => ({ ...n, skill_name: e.target.value }));
              }}
              onKeyDown={e => e.key === 'Enter' && !suggestions.length && addSkill()}
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-ink-800 border border-gold-500/20 rounded-lg shadow-lift overflow-hidden">
                {suggestions.map(s => {
                  const colors = SKILL_CATEGORY_COLORS[s.category];
                  return (
                    <button
                      key={s.name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 flex items-center justify-between gap-2"
                      onClick={() => pickSuggestion(s)}
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                        {s.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="input text-sm"
              value={newSkill.category}
              onChange={e => setNewSkill(n => ({ ...n, category: e.target.value as SkillCategory }))}
            >
              {SKILL_CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-100/50 whitespace-nowrap">Rank</label>
              <input
                type="number"
                min={1}
                max={10}
                className="input text-sm flex-1"
                value={newSkill.rank}
                onChange={e => setNewSkill(n => ({ ...n, rank: Math.max(1, parseInt(e.target.value) || 1) }))}
              />
            </div>
          </div>

          <input
            className="input text-sm w-full"
            placeholder="Notes (optional)"
            value={newSkill.notes}
            onChange={e => setNewSkill(n => ({ ...n, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdding(false); setSearch(''); }} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={addSkill} disabled={!newSkill.skill_name.trim() || busy} className="btn btn-primary btn-sm text-xs">
              {busy ? 'Adding…' : 'Add Skill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Character Rituals ─────────────────────────────────────────────────────────

function CharacterRitualsSection({
  memberId,
  rituals,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  rituals: CharacterRitual[];
  onUpsert: (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newRitual, setNewRitual] = useState({ ritual_name: '', realm: 'Spring' as RitualRealm, notes: '' });
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return RITUALS_CATALOGUE.filter(r => r.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  function pickSuggestion(r: typeof RITUALS_CATALOGUE[number]) {
    setNewRitual({ ritual_name: r.name, realm: r.realm, notes: '' });
    setSearch(r.name);
  }

  async function addRitual() {
    if (!newRitual.ritual_name.trim() || busy) return;
    setBusy(true);
    try {
      await onUpsert({
        member_id: memberId,
        ritual_name: newRitual.ritual_name.trim(),
        realm: newRitual.realm,
        notes: newRitual.notes.trim() || null,
      });
      setSearch('');
      setNewRitual({ ritual_name: '', realm: 'Spring', notes: '' });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CharacterRitual[]>();
    for (const r of rituals) {
      const realm = r.realm || 'Spring';
      if (!map.has(realm)) map.set(realm, []);
      map.get(realm)!.push(r);
    }
    return map;
  }, [rituals]);

  const orderedRealms = [
    ...RITUAL_REALM_ORDER.filter(realm => grouped.has(realm)),
    ...[...grouped.keys()].filter(realm => !(RITUAL_REALM_ORDER as string[]).includes(realm)),
  ];

  return (
    <div className="mt-5 pt-5 border-t border-gold-500/15">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Mastered Rituals</span>
        <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs">
          <Icons.Plus size={13} />
          Add Ritual
        </button>
      </div>

      {orderedRealms.map(realm => {
        const realmRituals = grouped.get(realm)!;
        const colors = REALM_COLORS[(realm as RitualRealm)] ?? REALM_COLORS.Spring;
        return (
          <div key={realm} className="mb-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-100/40 mb-1.5">{realm}</div>
            <div className="flex flex-wrap gap-1.5">
              {realmRituals.map(rt => (
                <div
                  key={rt.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                  title={rt.notes ?? undefined}
                >
                  <span>{rt.ritual_name}</span>
                  <button
                    onClick={() => onDelete(rt.id)}
                    className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                    title="Remove ritual"
                  >
                    <Icons.X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {rituals.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-2">No rituals mastered · click Add Ritual to begin</p>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border border-gold-500/10 mt-2">
          <div className="relative">
            <input
              autoFocus
              className="input text-sm w-full"
              placeholder="Ritual name (e.g. Raise the Drowned Levy…)"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setNewRitual(n => ({ ...n, ritual_name: e.target.value }));
              }}
              onKeyDown={e => e.key === 'Enter' && !suggestions.length && addRitual()}
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-ink-800 border border-gold-500/20 rounded-lg shadow-lift overflow-hidden">
                {suggestions.map(s => {
                  const colors = REALM_COLORS[s.realm];
                  return (
                    <button
                      key={s.name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 flex items-center justify-between gap-2"
                      onClick={() => pickSuggestion(s)}
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                        {s.realm}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <select
            className="input text-sm w-full"
            value={newRitual.realm}
            onChange={e => setNewRitual(n => ({ ...n, realm: e.target.value as RitualRealm }))}
          >
            {RITUAL_REALM_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <input
            className="input text-sm w-full"
            placeholder="Notes (optional)"
            value={newRitual.notes}
            onChange={e => setNewRitual(n => ({ ...n, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdding(false); setSearch(''); }} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={addRitual} disabled={!newRitual.ritual_name.trim() || busy} className="btn btn-primary btn-sm text-xs">
              {busy ? 'Adding…' : 'Add Ritual'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Character Inventory ───────────────────────────────────────────────────────

function CharInventorySection({
  memberId,
  items,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  items: CharInventoryItem[];
  onUpsert: (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ item: '', qty: 1, category: '', notes: '', include_in_lance: false });
  const [busy, setBusy] = useState(false);

  async function addItem() {
    if (!newItem.item.trim() || busy) return;
    setBusy(true);
    try {
      await onUpsert({
        member_id: memberId,
        item: newItem.item.trim(),
        qty: newItem.qty,
        category: newItem.category.trim() || null,
        notes: newItem.notes.trim() || null,
        include_in_lance: newItem.include_in_lance,
      });
      setNewItem({ item: '', qty: 1, category: '', notes: '', include_in_lance: false });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-gold-500/15">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Character Inventory</span>
        <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs">
          <Icons.Plus size={13} />
          Add Item
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map(ci => (
            <div key={ci.id} className="flex items-center gap-2 px-3 py-2 bg-ink-800/40 rounded-lg">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ink-100">{ci.item}</span>
                {ci.category && <span className="text-xs text-ink-100/50 ml-2">[{ci.category}]</span>}
                {ci.notes && <span className="text-xs text-ink-100/40 ml-2 italic">{ci.notes}</span>}
              </div>
              <span className="text-sm font-mono text-gold-300 flex-shrink-0">×{ci.qty}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink-100/60 cursor-pointer flex-shrink-0 select-none" title="Include in lance inventory roll-up">
                <input
                  type="checkbox"
                  checked={ci.include_in_lance}
                  onChange={e => onUpsert({ ...ci, include_in_lance: e.target.checked })}
                  className="w-3.5 h-3.5 accent-gold-300"
                />
                Lance
              </label>
              <button onClick={() => onDelete(ci.id)} className="btn btn-ghost btn-sm text-red-400/60 hover:text-red-400 flex-shrink-0 px-1.5">
                <Icons.Trash size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border border-gold-500/10">
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <input
              autoFocus
              className="input text-sm"
              placeholder="Item name"
              value={newItem.item}
              onChange={e => setNewItem(n => ({ ...n, item: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <input
              type="number"
              className="input text-sm"
              min={1}
              value={newItem.qty}
              onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <input
            className="input text-sm w-full"
            placeholder="Category (optional)"
            value={newItem.category}
            onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
          />
          <input
            className="input text-sm w-full"
            placeholder="Notes (optional)"
            value={newItem.notes}
            onChange={e => setNewItem(n => ({ ...n, notes: e.target.value }))}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ink-100/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newItem.include_in_lance}
                onChange={e => setNewItem(n => ({ ...n, include_in_lance: e.target.checked }))}
                className="w-4 h-4 accent-gold-300"
              />
              Include in lance inventory
            </label>
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
              <button onClick={addItem} disabled={!newItem.item.trim() || busy} className="btn btn-primary btn-sm text-xs">
                {busy ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-2">No items · click Add Item to begin</p>
      )}
    </div>
  );
}

// ── Crafting ──────────────────────────────────────────────────────────────────

const CRAFTING_STATUS_COLORS: Record<CraftingQueueItem['status'], string> = {
  'planned':           '#a0a0b8',
  'materials-sourced': '#6ab0e0',
  'in-progress':       '#d4b46d',
  'complete':          '#6ad47e',
  'cancelled':         '#e87070',
};

function CraftingSection({
  memberId,
  queue,
  members,
  events,
}: {
  memberId: string;
  queue: CraftingQueueItem[];
  members: { id: string; name: string }[];
  events: { id: string; name: string }[];
}) {
  const eventMap = Object.fromEntries(events.map(e => [e.id, e.name]));
  const crafting = queue.filter(q => q.crafter_id === memberId && q.status !== 'complete' && q.status !== 'cancelled');
  if (crafting.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-gold-500/15">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Currently Crafting</span>
        <span className="text-[10px] text-ink-100/40">({crafting.length})</span>
      </div>
      <div className="space-y-1.5">
        {crafting.map(item => {
          const recipient = members.find(m => m.id === item.recipient_id);
          const statusColor = CRAFTING_STATUS_COLORS[item.status];
          return (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2 bg-ink-800/40 rounded-lg">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ink-100">{item.item_name}</span>
                <span className="text-xs text-ink-100/50 ml-2 capitalize">{item.tier}</span>
                {recipient && <span className="text-xs text-ink-100/40 ml-2">→ {recipient.name}</span>}
                {item.target_event && <span className="text-xs text-ink-100/30 ml-2">by {eventMap[item.target_event] ?? item.target_event}</span>}
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0"
                style={{ color: statusColor, borderColor: `${statusColor}50`, background: `${statusColor}18` }}
              >
                {item.status.replace('-', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
