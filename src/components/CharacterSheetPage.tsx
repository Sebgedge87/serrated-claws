import { useMemo, useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, CharacterSpell, CraftingQueueItem, LanceData, LanceMembership, Member } from '@/lib/types';
import { RITUALS_CATALOGUE, REALM_COLORS, RITUAL_REALM_ORDER, type RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { SKILLS_CATALOGUE, SKILL_CATEGORY_COLORS, SKILL_CATEGORY_ORDER, skillXpCost } from '@/lib/skillsCatalogue';
import type { SkillCategory } from '@/lib/skillsCatalogue';
import { RESOURCE_TYPES, resourceSubOptions, territoriesForResource, buildResourceString, parseResourceString } from '@/lib/personalResource';
import type { ResourceType } from '@/lib/personalResource';
import { EMPIRE_CATALOGUE } from '@/lib/catalogue';
import { spellsForRealm } from '@/lib/spellsCatalogue';
import type { SpellRealm } from '@/lib/spellsCatalogue';
import { cx, formatIncome } from '@/lib/utils';
import { Field } from '@/components/ui/Field';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DataRow } from '@/components/ui/DataRow';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/Modal';

interface Props {
  member: Member;
  data: LanceData;
  isAdmin: boolean;
  canEdit: boolean;
  isOwn: boolean;
  wikiUrl: string;
  memberships?: LanceMembership[];
  onBack: () => void;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
  onUpsertSkill: (s: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill: (id: string) => Promise<void>;
  onUpsertSpell: (s: Omit<CharacterSpell, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSpell: (id: string) => Promise<void>;
  onUpsertRitual: (r: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDeleteRitual: (id: string) => Promise<void>;
  onUpsertCharInventory: (i: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory: (id: string) => Promise<void>;
}

export function CharacterSheetPage({
  member,
  data,
  isAdmin,
  canEdit,
  isOwn,
  wikiUrl,
  memberships,
  onBack,
  onUpsertMember,
  onUpsertSkill,
  onDeleteSkill,
  onUpsertSpell,
  onDeleteSpell,
  onUpsertRitual,
  onDeleteRitual,
  onUpsertCharInventory,
  onDeleteCharInventory,
}: Props) {
  const house = data.houses.find(h => h.id === member.house_id);
  const skills = data.characterSkills.filter(s => s.member_id === member.id);
  const totalXp = member.total_xp ?? 8;
  const xpSpent = skills.reduce((sum, sk) => {
    const cat = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
    return sum + (cat ? skillXpCost(cat, sk.rank) : sk.rank);
  }, 0);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          <Icons.ArrowLeft size={14} />
          Back
        </button>
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <Icons.ExternalLink size={14} />
          Empire Wiki
        </a>
      </div>

      {/* Masthead */}
      <Masthead
        member={member}
        data={data}
        house={house}
        canEdit={canEdit}
        isAdmin={isAdmin}
        wikiUrl={wikiUrl}
        memberships={memberships}
        onUpsertMember={onUpsertMember}
      />

      {/* Notes lede — directly under masthead */}
      {member.notes && (
        <div className="mt-5 px-1">
          <p className="text-base leading-relaxed text-ink-100/80 max-w-3xl">
            <span
              className="font-display float-left text-5xl leading-none font-bold mr-2"
              style={{ color: 'var(--gold)' }}
            >
              {member.notes[0]}
            </span>
            {member.notes.slice(1)}
          </p>
          <div className="clear-both" />
        </div>
      )}

      {/* Vitals strip */}
      <VitalsStrip
        member={member}
        xpSpent={xpSpent}
        totalXp={totalXp}
        isOwn={isOwn}
        isAdmin={isAdmin}
        canEdit={canEdit}
        onUpsertMember={onUpsertMember}
      />

      {/* Two-column layout */}
      <div className="mt-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Left column — sidebar */}
        <div className="space-y-4">
          <PersonalResourceCard
            member={member}
            canEdit={canEdit}
            onUpsertMember={onUpsertMember}
          />
          {(isOwn || isAdmin) && (
            <PersonalFundsCard
              member={member}
              canEdit={canEdit}
              onUpsertMember={onUpsertMember}
            />
          )}
          <CharInventorySectionPage
            memberId={member.id}
            items={data.characterInventory.filter(ci => ci.member_id === member.id)}
            canEdit={canEdit}
            onUpsert={onUpsertCharInventory}
            onDelete={onDeleteCharInventory}
          />
          <CraftingSectionPage
            memberId={member.id}
            queue={data.craftingQueue}
            members={data.members}
            events={data.events}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SkillsSection
            memberId={member.id}
            skills={skills}
            totalXp={totalXp}
            canEdit={canEdit}
            onUpsert={onUpsertSkill}
            onDelete={onDeleteSkill}
          />
          {(skills.some(s => s.skill_name === 'Magician') || data.characterSpells.some(s => s.member_id === member.id)) && (
            <SpellsSection
              memberId={member.id}
              member={member}
              data={data}
              spells={data.characterSpells.filter(s => s.member_id === member.id)}
              canEdit={canEdit}
              onUpsert={onUpsertSpell}
              onDelete={onDeleteSpell}
            />
          )}
          {(skills.some(s => ['Spring Lore','Summer Lore','Autumn Lore','Winter Lore','Day Lore','Night Lore'].includes(s.skill_name)) || data.characterRituals.some(r => r.member_id === member.id)) && (
            <RitualsSection
              memberId={member.id}
              member={member}
              data={data}
              rituals={data.characterRituals.filter(r => r.member_id === member.id)}
              canEdit={canEdit}
              onUpsert={onUpsertRitual}
              onDelete={onDeleteRitual}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Masthead ──────────────────────────────────────────────────────────────────

function Masthead({
  member,
  data,
  house,
  canEdit,
  isAdmin,
  wikiUrl,
  memberships,
  onUpsertMember,
}: {
  member: Member;
  data: LanceData;
  house: typeof data.houses[number] | undefined;
  canEdit: boolean;
  isAdmin: boolean;
  wikiUrl: string;
  memberships?: LanceMembership[];
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({ ...member });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const houseColor = house?.primary_color ?? 'var(--gold)';
  const covenName = data.covens.find(c => c.id === member.coven)?.name ?? null;
  const clawName = data.functions.find(f => f.id === member.function)?.name ?? null;

  function startEdit() {
    setForm({ ...member });
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm({ ...member });
    setSaveError(null);
  }

  async function saveEdit() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      await onUpsertMember({ ...member, ...form, name: form.name.trim() } as Partial<Member> & { name: string });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof Member>(key: K, value: Member[K] | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  if (editing) {
    return (
      <div className="card overflow-hidden">
        <div className="h-[2px] w-full" style={{ background: houseColor }} />
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow">Edit Character</div>
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={saveEdit} disabled={!form.name?.trim() || busy} className="btn btn-primary btn-sm">
                <Icons.Save size={13} />
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-1">Character Name</label>
              <input className="input font-display font-semibold" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Player Name</label>
              <CustomSelect
                value={form.player_name ?? ''}
                onChange={v => set('player_name', v || null)}
                options={(memberships ?? [])
                  .map(m => {
                    const name = m.profile?.display_name || m.profile?.email || null;
                    return name ? { value: name, label: name } : null;
                  })
                  .filter((o): o is { value: string; label: string } => o !== null)}
                placeholder="— Select player —"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">PID</label>
              <input className="input num" value={form.pid ?? ''} onChange={e => set('pid', e.target.value || null)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Rank</label>
              <input className="input" value={form.rank ?? ''} onChange={e => set('rank', e.target.value || null)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Claw</label>
              <CustomSelect
                value={form.function ?? ''}
                onChange={v => set('function', v || null)}
                options={data.functions.map(f => ({ value: f.id, label: f.name }))}
                placeholder="None"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Military Role</label>
              <input className="input" placeholder="Shield Wall, Battle Mage…" value={form.military_function ?? ''} onChange={e => set('military_function', e.target.value || null)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">HP</label>
              <input type="number" min={0} className="input" value={form.hp ?? ''} onChange={e => set('hp', e.target.value !== '' ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">MP</label>
              <input type="number" min={0} className="input" value={form.mp ?? ''} onChange={e => set('mp', e.target.value !== '' ? Number(e.target.value) : null)} />
            </div>
            <div className="col-span-2">
              <label className="eyebrow block mb-1">Income / Event</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Rings</label>
                  <input type="number" min={0} className="input" placeholder="0" value={form.rings_per_event ?? ''} onChange={e => set('rings_per_event', e.target.value !== '' ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Crowns</label>
                  <input type="number" min={0} className="input" placeholder="0" value={form.crowns_per_event ?? ''} onChange={e => set('crowns_per_event', e.target.value !== '' ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Thrones</label>
                  <input type="number" min={0} className="input" placeholder="0" value={form.thrones_per_event ?? ''} onChange={e => set('thrones_per_event', e.target.value !== '' ? Number(e.target.value) : null)} />
                </div>
              </div>
            </div>
            <div>
              <label className="eyebrow block mb-1">Coven</label>
              <CustomSelect
                value={form.coven ?? ''}
                onChange={v => set('coven', v || null)}
                options={data.covens.map(c => ({ value: c.id, label: c.name }))}
                placeholder="None"
              />
            </div>
            {isAdmin && (
              <>
                <div>
                  <label className="eyebrow block mb-1">House</label>
                  <CustomSelect
                    value={form.house_id ?? ''}
                    onChange={v => set('house_id', v || null)}
                    options={data.houses.map(h => ({ value: h.id, label: h.name }))}
                    placeholder="Unassigned"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1">Status</label>
                  <CustomSelect
                    value={form.status ?? 'active'}
                    onChange={v => set('status', v as Member['status'])}
                    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'KIA', label: 'KIA' }]}
                    placeholder=""
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="eyebrow block mb-1">Notes</label>
              <textarea className="input w-full" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
            </div>
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.is_noble} onChange={e => set('is_noble', e.target.checked)} className="w-4 h-4 accent-gold-300" />
                Noble
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.attending_event} onChange={e => set('attending_event', e.target.checked)} className="w-4 h-4 accent-gold-300" />
                Attending next event
              </label>
            </div>
          </div>

          {saveError && (
            <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mt-4">
              {saveError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Read mode masthead
  const eyebrowParts = [
    member.rank,
    house ? `of ${house.name}` : null,
    member.pid ? `No. ${member.pid}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--line)', background: 'rgb(var(--ink-800))' }}
    >
      {/* Thin house-color top accent line */}
      <div className="h-[2px] w-full" style={{ background: houseColor }} />

      <div className="px-6 pt-5 pb-4">
        {/* Eyebrow */}
        {eyebrowParts && (
          <div className="eyebrow mb-1">{eyebrowParts}</div>
        )}

        {/* Character name */}
        <h1 className="font-display text-5xl font-bold leading-tight text-ink-100 mb-3">
          {member.name}
        </h1>

        {/* Pills row */}
        <div className="flex flex-wrap gap-2 mb-5">
          {member.is_noble && <Pill variant="noble">Noble</Pill>}
          <Pill variant={member.status === 'active' ? 'active' : member.status === 'KIA' ? 'kia' : 'inactive'}>
            {member.status ?? 'active'}
          </Pill>
          {covenName && (
            <span className="pill" style={{ color: '#b56eb5', borderColor: 'rgba(181,110,181,0.4)' }}>
              {covenName}
            </span>
          )}
          {member.military_function && (
            <span className="pill">{member.military_function}</span>
          )}
          {member.attending_event && (
            <span className="pill" style={{ color: 'var(--ok)', borderColor: 'rgba(130,183,141,0.4)' }}>
              Attending
            </span>
          )}
        </div>

        {/* 4-up Field grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 pt-4 border-t"
          style={{ borderColor: 'var(--line-soft)' }}
        >
          <Field label="Player" value={member.player_name ?? '—'} />
          <Field label="Claw" value={clawName ?? '—'} />
          <Field label="Coven" value={covenName ?? '—'} />
          <Field label="Resource" value={member.resource ?? '—'} />
        </div>
      </div>

      {/* Action bar */}
      {canEdit && (
        <div className="px-6 pb-4 flex gap-2">
          <button onClick={startEdit} className="btn btn-primary btn-sm">
            <Icons.Edit size={13} />
            Edit Record
          </button>
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <Icons.ExternalLink size={13} />
            Empire Wiki
          </a>
        </div>
      )}
    </div>
  );
}

// ── Vitals Strip ──────────────────────────────────────────────────────────────

function VitalsStrip({
  member,
  xpSpent,
  totalXp,
  isOwn,
  isAdmin,
  canEdit,
  onUpsertMember,
}: {
  member: Member;
  xpSpent: number;
  totalXp: number;
  isOwn: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const [editingStats, setEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState({
    hp: member.hp ?? '',
    mp: member.mp ?? '',
    rings_per_event: member.rings_per_event ?? '',
    crowns_per_event: member.crowns_per_event ?? '',
    thrones_per_event: member.thrones_per_event ?? '',
  });
  const [statsBusy, setStatsBusy] = useState(false);

  const [editingXp, setEditingXp] = useState(false);
  const [xpInput, setXpInput] = useState(String(totalXp));
  const [xpError, setXpError] = useState<string | null>(null);

  const [editingFunds, setEditingFunds] = useState(false);
  const [fundsForm, setFundsForm] = useState({
    personal_rings: member.personal_rings ?? 0,
    personal_crowns: member.personal_crowns ?? 0,
    personal_thrones: member.personal_thrones ?? 0,
  });
  const [fundsBusy, setFundsBusy] = useState(false);

  const xpPct = totalXp > 0 ? Math.min(100, (xpSpent / totalXp) * 100) : 0;
  const xpRemaining = totalXp - xpSpent;

  function rollup(rings: number, crowns: number, thrones: number) {
    const total = rings + crowns * 20 + thrones * 160;
    const t = Math.floor(total / 160); const rem1 = total % 160;
    const c = Math.floor(rem1 / 20);   const r = rem1 % 20;
    return { t, c, r, total };
  }

  const { t: ft, c: fc, r: fr, total: fTotal } = rollup(
    member.personal_rings ?? 0,
    member.personal_crowns ?? 0,
    member.personal_thrones ?? 0
  );

  const fundsStr = fTotal === 0 ? '0r' : [
    ft > 0 ? `${ft}t` : '',
    fc > 0 ? `${fc}c` : '',
    fr > 0 ? `${fr}r` : '',
  ].filter(Boolean).join(' ');

  async function saveStats() {
    setStatsBusy(true);
    try {
      await onUpsertMember({
        ...member,
        name: member.name,
        hp: statsForm.hp !== '' ? Number(statsForm.hp) : null,
        mp: statsForm.mp !== '' ? Number(statsForm.mp) : null,
        rings_per_event: statsForm.rings_per_event !== '' ? Number(statsForm.rings_per_event) : null,
        crowns_per_event: statsForm.crowns_per_event !== '' ? Number(statsForm.crowns_per_event) : null,
        thrones_per_event: statsForm.thrones_per_event !== '' ? Number(statsForm.thrones_per_event) : null,
      });
      setEditingStats(false);
    } finally {
      setStatsBusy(false);
    }
  }

  async function saveXp() {
    const val = parseInt(xpInput, 10) || 8;
    setXpError(null);
    try {
      await onUpsertMember({ ...member, total_xp: val, name: member.name });
      setEditingXp(false);
    } catch (err) {
      setXpError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function saveFunds() {
    setFundsBusy(true);
    try {
      await onUpsertMember({ ...member, name: member.name, ...fundsForm });
      setEditingFunds(false);
    } finally { setFundsBusy(false); }
  }

  if (editingStats || editingXp || editingFunds) {
    return (
      <div className="card px-5 py-4 mt-4">
        {editingStats && (
          <div className="space-y-3">
            <div className="eyebrow mb-2">Edit Stats</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="eyebrow block mb-1">HP</label>
                <input type="number" min={0} className="input text-sm py-1" value={statsForm.hp} onChange={e => setStatsForm(f => ({ ...f, hp: e.target.value }))} />
              </div>
              <div>
                <label className="eyebrow block mb-1">MP</label>
                <input type="number" min={0} className="input text-sm py-1" value={statsForm.mp} onChange={e => setStatsForm(f => ({ ...f, mp: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="eyebrow block mb-1">Income / Event</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Rings</label>
                  <input type="number" min={0} className="input text-sm py-1" placeholder="0" value={statsForm.rings_per_event} onChange={e => setStatsForm(f => ({ ...f, rings_per_event: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Crowns</label>
                  <input type="number" min={0} className="input text-sm py-1" placeholder="0" value={statsForm.crowns_per_event} onChange={e => setStatsForm(f => ({ ...f, crowns_per_event: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-ink-100/40 block mb-0.5">Thrones</label>
                  <input type="number" min={0} className="input text-sm py-1" placeholder="0" value={statsForm.thrones_per_event} onChange={e => setStatsForm(f => ({ ...f, thrones_per_event: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingStats(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
              <button onClick={saveStats} disabled={statsBusy} className="btn btn-primary btn-sm text-xs">{statsBusy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
        {editingXp && (
          <div className="space-y-2">
            <div className="eyebrow mb-2">Edit XP Total</div>
            <div className="flex items-center gap-2">
              <input autoFocus type="number" min={xpSpent} className="input text-sm w-24 py-1" value={xpInput} onChange={e => setXpInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveXp(); if (e.key === 'Escape') { setEditingXp(false); setXpError(null); } }} />
              <button onClick={saveXp} className="btn btn-primary btn-sm text-xs">Save</button>
              <button onClick={() => { setEditingXp(false); setXpError(null); }} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            </div>
            {xpError && <p className="text-red-400 text-[11px]">{xpError}</p>}
          </div>
        )}
        {editingFunds && (
          <div className="space-y-2">
            <div className="eyebrow mb-2">Edit Personal Funds</div>
            <div className="grid grid-cols-3 gap-2">
              {(['personal_thrones', 'personal_crowns', 'personal_rings'] as const).map(key => (
                <div key={key}>
                  <label className="text-[10px] text-ink-100/40 block mb-1 capitalize">{key.replace('personal_', '')}</label>
                  <input type="number" min={0} className="input text-sm py-1" value={fundsForm[key]} onChange={e => setFundsForm(f => ({ ...f, [key]: parseInt(e.target.value, 10) || 0 }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingFunds(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
              <button onClick={saveFunds} disabled={fundsBusy} className="btn btn-primary btn-sm text-xs">{fundsBusy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--line)', background: 'rgb(var(--ink-800))' }}
    >
      <div className="flex divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {/* Hits */}
        <div className="flex-1 px-4 py-3 min-w-0" style={{ borderRight: '1px solid var(--line)' }}>
          <div className="eyebrow mb-0.5 flex items-center justify-between">
            <span>Hits</span>
            {canEdit && (
              <button
                onClick={() => { setStatsForm({ hp: member.hp ?? '', mp: member.mp ?? '', rings_per_event: member.rings_per_event ?? '', crowns_per_event: member.crowns_per_event ?? '', thrones_per_event: member.thrones_per_event ?? '' }); setEditingStats(true); }}
                className="font-ui text-[9px] text-ink-100/40 hover:text-gold-300 transition-colors normal-case tracking-normal"
              >edit</button>
            )}
          </div>
          <div className="num text-xl font-bold" style={{ color: 'var(--danger)' }}>{member.hp ?? '—'}</div>
        </div>

        {/* Mana */}
        <div className="flex-1 px-4 py-3 min-w-0" style={{ borderRight: '1px solid var(--line)' }}>
          <div className="eyebrow mb-0.5">Mana</div>
          <div className="num text-xl font-bold text-blue-400">{member.mp ?? '—'}</div>
        </div>

        {/* Income / Event */}
        <div className="flex-1 px-4 py-3 min-w-0" style={{ borderRight: '1px solid var(--line)' }}>
          <div className="eyebrow mb-0.5">Income / Event</div>
          <div className="num text-sm font-bold text-ink-100">
            {formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event) ?? '—'}
          </div>
        </div>

        {/* Personal Funds — private */}
        {(isOwn || isAdmin) && (
          <div className="flex-1 px-4 py-3 min-w-0" style={{ borderRight: '1px solid var(--line)' }}>
            <div className="eyebrow mb-0.5 flex items-center justify-between gap-1">
              <span>Personal Funds <span className="text-[8px] normal-case tracking-normal opacity-50">(private)</span></span>
              {canEdit && (
                <button
                  onClick={() => { setFundsForm({ personal_rings: member.personal_rings ?? 0, personal_crowns: member.personal_crowns ?? 0, personal_thrones: member.personal_thrones ?? 0 }); setEditingFunds(true); }}
                  className="font-ui text-[9px] text-ink-100/40 hover:text-gold-300 transition-colors normal-case tracking-normal"
                >edit</button>
              )}
            </div>
            <div className="num text-sm font-bold" style={{ color: 'var(--gold)' }}>{fundsStr}</div>
          </div>
        )}

        {/* XP */}
        <div className="flex-1 px-4 py-3 min-w-0" style={{ minWidth: 120 }}>
          <div className="eyebrow mb-0.5 flex items-center justify-between gap-1">
            <span>XP</span>
            {canEdit && (
              <button
                onClick={() => { setXpInput(String(totalXp)); setEditingXp(true); }}
                className="font-ui text-[9px] text-ink-100/40 hover:text-gold-300 transition-colors normal-case tracking-normal"
              >edit</button>
            )}
          </div>
          <div className="num text-sm font-bold">
            <span style={{ color: xpRemaining < 0 ? 'var(--danger)' : 'var(--gold)' }}>{xpRemaining}</span>
            <span className="text-ink-100/40"> / {totalXp}</span>
          </div>
          <div className="text-[10px] text-ink-100/40 mt-0.5">{xpSpent} spent</div>
          <div
            className="mt-1.5 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(203,171,104,0.15)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPct}%`, background: xpRemaining < 0 ? 'var(--danger)' : 'var(--gold)' }}
            />
          </div>
          {xpError && <p className="text-red-400 text-[10px] mt-0.5">{xpError}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Personal Funds Card ───────────────────────────────────────────────────────

function PersonalFundsCard({
  member,
  canEdit,
  onUpsertMember,
}: {
  member: Member;
  canEdit: boolean;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    personal_rings: member.personal_rings ?? 0,
    personal_crowns: member.personal_crowns ?? 0,
    personal_thrones: member.personal_thrones ?? 0,
  });
  const [busy, setBusy] = useState(false);

  const incomeRings = (member.rings_per_event ?? 0) + (member.crowns_per_event ?? 0) * 20 + (member.thrones_per_event ?? 0) * 160;

  function rollup(rings: number, crowns: number, thrones: number) {
    const total = rings + crowns * 20 + thrones * 160;
    const t = Math.floor(total / 160); const rem1 = total % 160;
    const c = Math.floor(rem1 / 20);   const r = rem1 % 20;
    return { t, c, r, total };
  }

  const { t, c, r, total } = rollup(member.personal_rings ?? 0, member.personal_crowns ?? 0, member.personal_thrones ?? 0);

  async function save() {
    setBusy(true);
    try {
      await onUpsertMember({ ...member, name: member.name, ...form });
      setEditing(false);
    } finally { setBusy(false); }
  }

  async function collectIncome() {
    if (!incomeRings || busy) return;
    setBusy(true);
    try {
      const curTotal = (member.personal_rings ?? 0) + (member.personal_crowns ?? 0) * 20 + (member.personal_thrones ?? 0) * 160;
      const newTotal = curTotal + incomeRings;
      const nt = Math.floor(newTotal / 160); const rem = newTotal % 160;
      const nc = Math.floor(rem / 20);       const nr = rem % 20;
      await onUpsertMember({ ...member, name: member.name, personal_rings: nr, personal_crowns: nc, personal_thrones: nt });
    } finally { setBusy(false); }
  }

  return (
    <div className="card px-4 py-4">
      <SectionHeader title="Personal Funds" />

      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {(['personal_thrones', 'personal_crowns', 'personal_rings'] as const).map(key => (
              <div key={key}>
                <label className="eyebrow block mb-1 capitalize">{key.replace('personal_', '')}</label>
                <input type="number" min={0} className="input text-sm py-1" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={save} disabled={busy} className="btn btn-primary btn-sm text-xs">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {t > 0 && <>{t}<span className="text-sm opacity-60 ml-0.5">t</span>{' '}</>}
              {c > 0 && <>{c}<span className="text-sm opacity-60 ml-0.5">c</span>{' '}</>}
              {r > 0 && <>{r}<span className="text-sm opacity-60 ml-0.5">r</span></>}
              {total === 0 && <span className="text-ink-100/30">0r</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className="num text-xs text-ink-100/40">{total} rings</span>
              {canEdit && (
                <button onClick={() => { setForm({ personal_rings: member.personal_rings ?? 0, personal_crowns: member.personal_crowns ?? 0, personal_thrones: member.personal_thrones ?? 0 }); setEditing(true); }} className="font-ui text-[10px] text-ink-100/40 hover:text-gold-300 transition-colors">edit</button>
              )}
            </div>
          </div>

          {incomeRings > 0 && (
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--line-soft)' }}>
              <span className="text-xs text-ink-100/50">
                Income / event: <span className="opacity-80" style={{ color: 'var(--gold)' }}>{formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event)}</span>
              </span>
              {canEdit && (
                <button onClick={collectIncome} disabled={busy} className="btn btn-ghost btn-sm text-xs" style={{ color: 'var(--gold)' }}>
                  + Collect
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Personal Resource Card ────────────────────────────────────────────────────

function PersonalResourceCard({
  member,
  canEdit,
  onUpsertMember,
}: {
  member: Member;
  canEdit: boolean;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const parsed = parseResourceString(member.resource);
  const [resType, setResType] = useState<ResourceType | null>(parsed.type);
  const [resSub, setResSub] = useState<string | null>(parsed.sub);
  const [territory, setTerritory] = useState<string | null>(member.territory);
  const [editing, setEditing] = useState(false);

  const subOptions = resourceSubOptions(resType);
  const validTerritories = territoriesForResource(resType);

  async function saveResource(type: ResourceType | null, sub: string | null, newTerritory?: string | null) {
    const resource = buildResourceString(type, sub);
    const ter = newTerritory !== undefined ? newTerritory : territory;
    await onUpsertMember({ ...member, resource, territory: ter, name: member.name });
  }

  async function saveTerritory(val: string | null) {
    setTerritory(val);
    await onUpsertMember({ ...member, territory: val, name: member.name });
  }

  if (!canEdit || !editing) {
    if (!canEdit && !member.resource) return null;
    return (
      <div className="card px-4 py-4">
        <SectionHeader
          title="Personal Resource"
          action={canEdit ? <span onClick={() => setEditing(true)}>Edit</span> : undefined}
        />
        <Field label="Resource" value={resType ?? '—'} />
        {(territory || resType) && <Field label="Territory" value={territory ?? '—'} />}
      </div>
    );
  }

  return (
    <div className="card px-4 py-4">
      <SectionHeader title="Personal Resource" action={<span onClick={() => setEditing(false)}>Done</span>} />

      <div className="mb-3">
        <label className="eyebrow block mb-1.5">Resource Type</label>
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_TYPES.map(rt => (
            <button
              key={rt}
              className={cx(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                resType === rt
                  ? 'border-opacity-60'
                  : 'bg-black/20 border-gold-500/15 text-ink-100/60 hover:border-gold-500/40 hover:text-ink-100'
              )}
              style={resType === rt ? { background: 'rgba(203,171,104,0.18)', color: 'var(--gold)', borderColor: 'rgba(203,171,104,0.5)' } : undefined}
              onClick={async () => {
                const newType = resType === rt ? null : rt;
                const newSub = null;
                const newTer = newType ? territory : null;
                setResType(newType);
                setResSub(newSub);
                if (!newType) setTerritory(null);
                await saveResource(newType, newSub, newTer);
              }}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      {resType && subOptions.length > 0 && (
        <div className="mb-3">
          <label className="eyebrow block mb-1.5">Subtype</label>
          <CustomSelect
            value={resSub ?? ''}
            onChange={async v => {
              const val = v || null;
              setResSub(val);
              await saveResource(resType, val);
            }}
            options={subOptions.map(s => ({ value: s, label: s }))}
            placeholder="— choose subtype —"
          />
        </div>
      )}

      {resType && (
        <div>
          <label className="eyebrow block mb-1.5">
            Territory
            {resType === 'Fleet' && <span className="ml-1.5 text-ink-100/30">(coastal only)</span>}
          </label>
          <CustomSelect
            value={territory ?? ''}
            onChange={async v => await saveTerritory(v || null)}
            options={validTerritories.map(t => ({ value: t, label: t }))}
            placeholder="— choose territory —"
          />
        </div>
      )}
    </div>
  );
}

// ── Skills Section ────────────────────────────────────────────────────────────

type PendingSkill = { skill_name: string; category: SkillCategory; rank: number; xpCost: number };

function SkillsSection({
  memberId,
  skills,
  totalXp,
  canEdit,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  skills: CharacterSkill[];
  totalXp: number;
  canEdit: boolean;
  onUpsert: (s: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<PendingSkill[]>([]);
  const [busy, setBusy] = useState(false);

  const xpSpent = useMemo(() =>
    skills.reduce((sum, sk) => {
      const cat = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
      return sum + (cat ? skillXpCost(cat, sk.rank) : sk.rank);
    }, 0),
  [skills]);

  const pendingXp = pending.reduce((s, p) => s + p.xpCost, 0);
  const xpRemaining = totalXp - xpSpent - pendingXp;

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

  function queueSkill(skill: PendingSkill) {
    setPending(p => [...p, skill]);
  }

  async function saveAll() {
    if (!pending.length || busy) return;
    setBusy(true);
    try {
      for (const p of pending) {
        await onUpsert({ member_id: memberId, skill_name: p.skill_name, category: p.category, rank: p.rank, notes: null });
      }
      setPending([]);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  function cancelAdding() {
    setPending([]);
    setAdding(false);
  }

  return (
    <div className="card px-5 py-5">
      <SectionHeader
        title="Character Skills"
        count={skills.length || undefined}
        action={canEdit && !adding ? (
          <button onClick={() => setAdding(true)} className="btn btn-ghost btn-sm text-xs flex items-center gap-1">
            <Icons.Plus size={12} />
            Add Skills
          </button>
        ) : undefined}
      />

      {/* Existing skills grouped by category */}
      {orderedCategories.map(cat => {
        const catSkills = grouped.get(cat)!;
        const colors = SKILL_CATEGORY_COLORS[(cat as SkillCategory)] ?? SKILL_CATEGORY_COLORS.Other;
        return (
          <div key={cat} className="mb-4">
            {/* Category eyebrow with swatch dot */}
            <div className="flex items-center gap-2 mb-1">
              <span className="swatch-dot" style={{ ['--c' as string]: colors.text }} />
              <span className="eyebrow" style={{ color: colors.text }}>{cat}</span>
            </div>
            {catSkills.map(sk => {
              const catalogueEntry = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
              const xpCostTotal = catalogueEntry ? skillXpCost(catalogueEntry, sk.rank) : sk.rank;
              return (
                <DataRow key={sk.id} accent={colors.text}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[17px] font-semibold text-ink-100">{sk.skill_name}</span>
                      {sk.rank > 1 && (
                        <span className="num text-xs font-bold" style={{ color: colors.text }}>rank {sk.rank}</span>
                      )}
                    </div>
                    {catalogueEntry?.description && (
                      <div className="text-[13px] leading-snug mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>
                        {catalogueEntry.description}
                      </div>
                    )}
                  </div>
                  <span className="num text-[12px] flex-shrink-0" style={{ color: 'rgb(var(--ink-300))' }}>{xpCostTotal} xp</span>
                  {canEdit && (
                    <button onClick={() => onDelete(sk.id)} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" title="Remove skill">
                      <Icons.X size={12} />
                    </button>
                  )}
                </DataRow>
              );
            })}
          </div>
        );
      })}

      {skills.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No skills recorded{canEdit ? ' · click Add Skills to begin' : ''}</p>
      )}

      {/* Add skills modal */}
      {adding && (
        <Modal
          onClose={cancelAdding}
          title="Add Skills"
          icon={<Icons.Plus size={20} />}
          accent="var(--gold)"
          width="md"
          footer={
            <>
              <button onClick={cancelAdding} className="btn btn-ghost">Cancel</button>
              <button
                onClick={saveAll}
                disabled={!pending.length || busy || xpRemaining < 0}
                className="btn btn-primary"
              >
                {busy ? 'Saving…' : pending.length > 1 ? `Save ${pending.length} Skills` : 'Save Skill'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="text-[11px] flex items-center gap-2">
              <span className={cx('font-semibold', xpRemaining < 0 ? 'text-red-400' : '')} style={xpRemaining >= 0 ? { color: 'var(--gold)' } : undefined}>
                {xpRemaining}xp remaining
              </span>
              <span className="text-ink-100/30">({xpSpent + pendingXp} / {totalXp} used)</span>
            </div>

            {pending.length > 0 && (
              <div className="space-y-1">
                <div className="eyebrow mb-1">Queued</div>
                {pending.map((p, i) => {
                  const colors = SKILL_CATEGORY_COLORS[p.category];
                  return (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: colors.bg, color: colors.text }}>
                      <span className="flex-1">{p.skill_name}{p.rank > 1 ? ` ×${p.rank}` : ''}</span>
                      <span className="opacity-60">{p.xpCost}xp</span>
                      <button onClick={() => setPending(q => q.filter((_, j) => j !== i))} className="opacity-50 hover:opacity-100">
                        <Icons.X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <SkillPicker xpRemaining={xpRemaining} onQueue={queueSkill} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Item Picker (custom dark dropdown replacing native <select>) ──────────────

function ItemPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const entry = EMPIRE_CATALOGUE.find(c => c.item === value);

  const types = Array.from(new Set(EMPIRE_CATALOGUE.map(c => c.type)));
  const filtered = query.trim()
    ? EMPIRE_CATALOGUE.filter(c => c.item.toLowerCase().includes(query.toLowerCase()))
    : EMPIRE_CATALOGUE;

  function pick(name: string) { onChange(name); setOpen(false); setQuery(''); }

  return (
    <div className="relative">
      <button
        type="button"
        autoFocus
        className={cx('input text-sm w-full text-left flex items-center justify-between gap-2', open && 'border-gold-300')}
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? 'text-ink-100' : 'text-ink-100/40'}>
          {value ? `${value}${entry?.unit ? ` (${entry.unit})` : ''}` : '— choose item —'}
        </span>
        <Icons.ChevronDown size={14} className="text-ink-100/40 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-ink-800 border border-gold-500/25 rounded-lg shadow-lift overflow-hidden">
          <div className="p-2 border-b border-gold-500/15">
            <input
              autoFocus
              className="input text-sm w-full py-1.5"
              placeholder="Search items…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                if (e.key === 'Enter' && filtered.length === 1) pick(filtered[0].item);
              }}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {query.trim() ? (
              filtered.length === 0
                ? <div className="px-3 py-3 text-xs text-ink-100/40 text-center">No items match</div>
                : filtered.map(c => (
                  <button key={c.item} onClick={() => pick(c.item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 flex items-center justify-between gap-2 border-b border-gold-500/8 last:border-0">
                    <span className="text-ink-100">{c.item}</span>
                    <span className="text-[10px] text-ink-100/40">{c.type}</span>
                  </button>
                ))
            ) : (
              types.map(type => {
                const items = EMPIRE_CATALOGUE.filter(c => c.type === type);
                return (
                  <div key={type}>
                    <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold sticky top-0 bg-ink-800 z-10" style={{ color: 'var(--gold)' }}>
                      {type}
                    </div>
                    {items.map(c => (
                      <button key={c.item} onClick={() => pick(c.item)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 flex items-center justify-between gap-2 border-b border-gold-500/8 last:border-0 transition-colors">
                        <span className="text-ink-100">{c.item}{c.unit ? ` (${c.unit})` : ''}</span>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skill Picker ─────────────────────────────────────────────────────────────

function SkillPicker({
  xpRemaining,
  onQueue,
}: {
  xpRemaining: number;
  onQueue: (skill: PendingSkill) => void;
}) {
  const [draft, setDraft] = useState({ skill_name: '', category: 'Combat' as SkillCategory, rank: 1 });
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return SKILLS_CATALOGUE;
    const q = query.toLowerCase();
    return SKILLS_CATALOGUE.filter(s => s.name.toLowerCase().includes(q));
  }, [query]);

  const selectedEntry = SKILLS_CATALOGUE.find(s => s.name === draft.skill_name);
  const colors = selectedEntry ? SKILL_CATEGORY_COLORS[selectedEntry.category] : null;
  const thisCost = selectedEntry ? skillXpCost(selectedEntry, draft.rank) : 0;
  const canAfford = xpRemaining >= thisCost;

  function pick(s: typeof SKILLS_CATALOGUE[number]) {
    setDraft(d => ({ ...d, skill_name: s.name, category: s.category, rank: 1 }));
    setQuery('');
    setOpen(false);
  }

  function queue() {
    if (!draft.skill_name || !canAfford) return;
    onQueue({ skill_name: draft.skill_name, category: draft.category, rank: draft.rank, xpCost: thisCost });
    setDraft({ skill_name: '', category: 'Combat', rank: 1 });
  }

  return (
    <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 border border-gold-500/10">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <label className="eyebrow block mb-1">Skill</label>
          <div className="relative">
            <button
              type="button"
              className={cx('input text-sm w-full text-left flex items-center justify-between gap-2', open && 'border-gold-300')}
              onClick={() => setOpen(o => !o)}
            >
              {draft.skill_name
                ? <span className="flex items-center gap-2">
                    {colors && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors.text }} />}
                    {draft.skill_name}
                    {selectedEntry?.maxRank && <span className="text-[10px] text-ink-100/40">max {selectedEntry.maxRank}</span>}
                  </span>
                : <span className="text-ink-100/40">— choose skill —</span>
              }
              <Icons.ChevronDown size={14} className="text-ink-100/40 flex-shrink-0" />
            </button>

            {open && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-ink-800 border border-gold-500/25 rounded-lg shadow-lift overflow-hidden">
                <div className="p-2 border-b border-gold-500/15">
                  <input
                    autoFocus
                    className="input text-sm w-full py-1.5"
                    placeholder="Search skills…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && filtered.length === 1) pick(filtered[0]);
                      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                    }}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto relative">
                  {filtered.length === 0 && (
                    <div className="px-3 py-3 text-xs text-ink-100/40 text-center">No skills match</div>
                  )}
                  {SKILL_CATEGORY_ORDER.map(cat => {
                    const catSkills = filtered.filter(s => s.category === cat);
                    if (!catSkills.length) return null;
                    const catColors = SKILL_CATEGORY_COLORS[cat];
                    return (
                      <div key={cat}>
                        <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold sticky top-0 z-10 bg-ink-800" style={{ color: catColors.text }}>
                          {cat}
                        </div>
                        {catSkills.map(s => {
                          const cost = skillXpCost(s, 1);
                          const affordable = xpRemaining >= cost;
                          return (
                            <button
                              key={s.name}
                              disabled={!affordable}
                              className={cx('w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors', affordable ? 'hover:bg-gold-500/10' : 'opacity-40 cursor-not-allowed')}
                              onClick={() => affordable && pick(s)}
                            >
                              <span className="text-ink-100 flex items-center gap-1.5">
                                {s.name}
                                {s.isPrereq && <span className="text-[9px] text-amber-400/70">prereq</span>}
                              </span>
                              <span className="text-[10px] text-ink-100/40 flex-shrink-0">
                                {s.xpCost}xp{s.scaling === '*' ? '+' : s.scaling === '**' ? '×' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="eyebrow block mb-1">Rank</label>
          <input
            type="number"
            min={1}
            max={selectedEntry?.maxRank ?? 10}
            className="input text-sm w-20"
            value={draft.rank}
            onChange={e => setDraft(d => ({ ...d, rank: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        {selectedEntry ? (
          <div className="text-xs space-y-0.5">
            {selectedEntry.description && (
              <p className="text-ink-100/60 leading-snug">{selectedEntry.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className={cx('font-semibold', canAfford ? '' : 'text-red-400')} style={canAfford ? { color: 'var(--gold)' } : undefined}>
                {thisCost}xp {canAfford ? '' : '— not enough XP'}
              </span>
              {selectedEntry.scaling === '*' && <span className="text-ink-100/40">+1xp/rank</span>}
              {selectedEntry.scaling === '**' && <span className="text-ink-100/40">flat/rank</span>}
              {selectedEntry.requires?.length && <span className="text-ink-100/40">req: {selectedEntry.requires.join(', ')}</span>}
            </div>
          </div>
        ) : <span />}
        <button
          onClick={queue}
          disabled={!draft.skill_name || !canAfford}
          className="btn btn-secondary btn-sm text-xs"
        >
          <Icons.Plus size={12} />
          Queue
        </button>
      </div>
    </div>
  );
}

// ── Spells Section ────────────────────────────────────────────────────────────

const SPELL_SCHOOLS = ['Spring', 'Summer', 'Autumn', 'Winter', 'Day', 'Night'] as const;
const SCHOOL_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Spring: { text: '#6ad47e', bg: 'rgba(106,212,126,0.12)', border: 'rgba(106,212,126,0.35)' },
  Summer: { text: '#e8a870', bg: 'rgba(232,168,112,0.12)', border: 'rgba(232,168,112,0.35)' },
  Autumn: { text: '#d4b46d', bg: 'rgba(212,180,109,0.12)', border: 'rgba(212,180,109,0.35)' },
  Winter: { text: '#7eb0ff', bg: 'rgba(126,176,255,0.12)', border: 'rgba(126,176,255,0.35)' },
  Day:    { text: '#fff5a0', bg: 'rgba(255,245,160,0.10)', border: 'rgba(255,245,160,0.30)' },
  Night:  { text: '#b56eb5', bg: 'rgba(181,110,181,0.12)', border: 'rgba(181,110,181,0.35)' },
};

function SpellsSection({
  memberId,
  member,
  data,
  spells,
  canEdit,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  member: Member;
  data: LanceData;
  spells: CharacterSpell[];
  canEdit: boolean;
  onUpsert: (s: Omit<CharacterSpell, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const covenRealm = useMemo((): SpellRealm | null => {
    if (!member.coven) return null;
    const coven = data.covens.find(c => c.id === member.coven);
    const domain = coven?.domain;
    if (domain && (SPELL_SCHOOLS as readonly string[]).includes(domain)) return domain as SpellRealm;
    return null;
  }, [member.coven, data.covens]);

  const [adding, setAdding] = useState(false);
  const [school, setSchool] = useState<string>(covenRealm ?? 'Spring');
  const [spellName, setSpellName] = useState('');
  const [magnitude, setMagnitude] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const availableSpells = useMemo(() => spellsForRealm(school as SpellRealm), [school]);

  function openAdding() {
    setSchool(covenRealm ?? 'Spring');
    setSpellName('');
    setMagnitude(1);
    setNotes('');
    setAdding(true);
  }

  function changeSchool(s: string) {
    setSchool(s);
    setSpellName('');
    setMagnitude(1);
  }

  function pickSpell(name: string) {
    const entry = availableSpells.find(s => s.name === name);
    setSpellName(name);
    if (entry) setMagnitude(entry.manaCost);
  }

  async function addSpell() {
    if (!spellName || busy) return;
    setBusy(true);
    try {
      await onUpsert({ member_id: memberId, spell_name: spellName, school, magnitude, notes: notes.trim() || null });
      setSpellName('');
      setMagnitude(1);
      setNotes('');
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  const bySchool = useMemo(() => {
    const map = new Map<string, CharacterSpell[]>();
    for (const s of spells) {
      if (!map.has(s.school)) map.set(s.school, []);
      map.get(s.school)!.push(s);
    }
    return map;
  }, [spells]);

  return (
    <div className="card px-5 py-5">
      <SectionHeader
        title="Spells"
        count={spells.length || undefined}
        accent="#b56eb5"
        action={canEdit ? (
          <button onClick={openAdding} className="btn btn-ghost btn-sm text-xs flex items-center gap-1">
            <Icons.Plus size={12} />
            Add Spell
          </button>
        ) : undefined}
      />

      {spells.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No spells recorded{canEdit ? ' · click Add Spell to begin' : ''}</p>
      )}

      {SPELL_SCHOOLS.filter(s => bySchool.has(s)).map(s => {
        const schoolSpells = bySchool.get(s)!;
        const sc = SCHOOL_COLORS[s];
        return (
          <div key={s} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="swatch-dot" style={{ ['--c' as string]: sc.text }} />
              <span className="eyebrow" style={{ color: sc.text }}>{s}</span>
            </div>
            {schoolSpells.map(sp => {
              const catalogueEntry = spellsForRealm(s as SpellRealm).find(e => e.name === sp.spell_name);
              return (
                <DataRow key={sp.id} accent={sc.text}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[17px] font-semibold text-ink-100">{sp.spell_name}</span>
                      <span className="num text-xs" style={{ color: 'rgb(var(--ink-300))' }}>{sp.magnitude}m</span>
                    </div>
                    {(catalogueEntry?.effect || sp.notes) && (
                      <div className="text-[13px] leading-snug mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>
                        {catalogueEntry?.effect ?? sp.notes}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => onDelete(sp.id)} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                      <Icons.X size={12} />
                    </button>
                  )}
                </DataRow>
              );
            })}
          </div>
        );
      })}

      {adding && (
        <div className="mt-2 pt-3 border-t space-y-2 bg-ink-800/30 rounded-lg p-3 border" style={{ borderColor: 'var(--line-soft)' }}>
          <div className="flex items-center gap-2 mb-1">
            {SPELL_SCHOOLS.map(s => {
              const sc = SCHOOL_COLORS[s];
              const active = school === s;
              return (
                <button
                  key={s}
                  disabled={!!covenRealm && s !== covenRealm}
                  onClick={() => changeSchool(s)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  style={active ? { background: sc.bg, color: sc.text, borderColor: sc.border } : { background: 'transparent', color: '#ffffff50', borderColor: '#ffffff15' }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div>
            <label className="eyebrow block mb-1">Spell</label>
            <CustomSelect
              value={spellName}
              onChange={pickSpell}
              options={availableSpells.map(sp => ({ value: sp.name, label: `${sp.name} (${sp.manaCost}m)${sp.type === 'Offensive' ? ' ⚔' : ''}` }))}
              placeholder="— choose spell —"
            />
          </div>

          {spellName && (
            <div className="text-xs text-ink-100/50 px-1">
              {availableSpells.find(s => s.name === spellName)?.effect}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="eyebrow block mb-1">Notes</label>
              <input className="input text-sm" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Mag</label>
              <input type="number" min={1} className="input text-sm w-16" value={magnitude} onChange={e => setMagnitude(Math.max(1, parseInt(e.target.value, 10) || 1))} />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={addSpell} disabled={!spellName || busy} className="btn btn-primary btn-sm text-xs">
              {busy ? 'Saving…' : 'Add Spell'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rituals Section ───────────────────────────────────────────────────────────

function RitualsSection({
  memberId,
  member,
  data,
  rituals,
  canEdit,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  member: Member;
  data: LanceData;
  rituals: CharacterRitual[];
  canEdit: boolean;
  onUpsert: (r: Omit<CharacterRitual, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const covenRealm = useMemo((): RitualRealm | null => {
    if (!member.coven) return null;
    const coven = data.covens.find(c => c.id === member.coven);
    const domain = coven?.domain;
    if (domain && (RITUAL_REALM_ORDER as string[]).includes(domain)) return domain as RitualRealm;
    return null;
  }, [member.coven, data.covens]);

  const [adding, setAdding] = useState(false);
  const [realm, setRealm] = useState<RitualRealm>(covenRealm ?? 'Spring');
  const [ritualName, setRitualName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const availableRituals = useMemo(
    () => RITUALS_CATALOGUE.filter(r => r.realm === realm),
    [realm]
  );

  function openAdding() {
    setRealm(covenRealm ?? 'Spring');
    setRitualName('');
    setNotes('');
    setAdding(true);
  }

  function changeRealm(r: RitualRealm) {
    setRealm(r);
    setRitualName('');
  }

  async function addRitual() {
    if (!ritualName || busy) return;
    setBusy(true);
    try {
      await onUpsert({ member_id: memberId, ritual_name: ritualName, realm, notes: notes.trim() || null });
      setRitualName('');
      setNotes('');
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  const byRealm = useMemo(() => {
    const map = new Map<string, CharacterRitual[]>();
    for (const r of rituals) {
      if (!map.has(r.realm)) map.set(r.realm, []);
      map.get(r.realm)!.push(r);
    }
    return map;
  }, [rituals]);

  return (
    <div className="card px-5 py-5">
      <SectionHeader
        title="Mastered Rituals"
        count={rituals.length || undefined}
        accent="#8a73bf"
        action={canEdit ? (
          <button onClick={openAdding} className="btn btn-ghost btn-sm text-xs flex items-center gap-1">
            <Icons.Plus size={12} />
            Add Ritual
          </button>
        ) : undefined}
      />

      {rituals.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No rituals mastered{canEdit ? ' · click Add Ritual to begin' : ''}</p>
      )}

      {RITUAL_REALM_ORDER.filter(r => byRealm.has(r)).map(realmKey => {
        const realmRituals = byRealm.get(realmKey)!;
        const colors = REALM_COLORS[realmKey as RitualRealm] ?? REALM_COLORS.Spring;
        return (
          <div key={realmKey} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="swatch-dot" style={{ ['--c' as string]: colors.text }} />
              <span className="eyebrow" style={{ color: colors.text }}>{realmKey}</span>
            </div>
            {realmRituals.map(rt => {
              const catalogueEntry = RITUALS_CATALOGUE.find(r => r.name === rt.ritual_name);
              return (
                <DataRow key={rt.id} accent={colors.text}>
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-[17px] font-semibold text-ink-100">{rt.ritual_name}</span>
                    {(catalogueEntry?.effect || rt.notes) && (
                      <div className="text-[13px] leading-snug mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>
                        {catalogueEntry?.effect ?? rt.notes}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => onDelete(rt.id)} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                      <Icons.X size={13} />
                    </button>
                  )}
                </DataRow>
              );
            })}
          </div>
        );
      })}

      {adding && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--line-soft)' }}>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="eyebrow block mb-1">Realm</label>
              <CustomSelect
                value={realm}
                onChange={v => changeRealm(v as RitualRealm)}
                options={RITUAL_REALM_ORDER.map(r => ({ value: r, label: r }))}
                placeholder=""
                disabled={!!covenRealm}
              />
            </div>
            <div className="flex-[2]">
              <label className="eyebrow block mb-1">Ritual</label>
              <CustomSelect
                value={ritualName}
                onChange={setRitualName}
                options={availableRituals.map(r => ({ value: r.name, label: r.name }))}
                placeholder="— choose ritual —"
              />
            </div>
          </div>
          {ritualName && (
            <p className="text-xs text-ink-100/50 px-0.5">
              {availableRituals.find(r => r.name === ritualName)?.effect}
            </p>
          )}
          <input
            className="input text-sm w-full"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={addRitual} disabled={!ritualName || busy} className="btn btn-primary btn-sm text-xs">
              {busy ? 'Adding…' : 'Add Ritual'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Character Inventory Section ───────────────────────────────────────────────

function CharInventorySectionPage({
  memberId,
  items,
  canEdit,
  onUpsert,
  onDelete,
}: {
  memberId: string;
  items: CharInventoryItem[];
  canEdit: boolean;
  onUpsert: (i: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
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
    <div className="card px-5 py-5">
      <SectionHeader
        title="Character Inventory"
        count={items.length || undefined}
        action={canEdit ? (
          <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs flex items-center gap-1">
            <Icons.Plus size={12} />
            Add Item
          </button>
        ) : undefined}
      />

      {items.length > 0 && (
        <div className="mb-3">
          {items.map(ci => (
            <DataRow key={ci.id}>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-ink-100">{ci.item}</span>
                {ci.category && <span className="text-xs text-ink-100/50 ml-2">[{ci.category}]</span>}
                {ci.notes && <span className="text-xs text-ink-100/40 ml-2 italic">{ci.notes}</span>}
              </div>
              <span className="num text-sm flex-shrink-0" style={{ color: 'var(--gold)' }}>×{ci.qty}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink-100/60 cursor-pointer flex-shrink-0 select-none" title="Include in lance inventory roll-up">
                <input
                  type="checkbox"
                  checked={ci.include_in_lance}
                  onChange={e => onUpsert({ ...ci, include_in_lance: e.target.checked })}
                  className="w-3.5 h-3.5 accent-gold-300"
                />
                Lance
              </label>
              {canEdit && (
                <button onClick={() => onDelete(ci.id)} className="btn btn-ghost btn-sm text-red-400/60 hover:text-red-400 flex-shrink-0 px-1.5">
                  <Icons.Trash size={13} />
                </button>
              )}
            </DataRow>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border" style={{ borderColor: 'var(--line-soft)' }}>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div>
              <label className="eyebrow block mb-1">Item</label>
              <ItemPicker
                value={newItem.item}
                onChange={name => {
                  const entry = EMPIRE_CATALOGUE.find(c => c.item === name);
                  setNewItem(n => ({ ...n, item: name, category: entry?.type ?? n.category }));
                }}
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Qty</label>
              <input
                type="number"
                className="input text-sm"
                min={1}
                value={newItem.qty}
                onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value, 10) || 1 }))}
              />
            </div>
          </div>
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
        <p className="text-xs text-ink-100/40 text-center py-4">No items{canEdit ? ' · click Add Item to begin' : ''}</p>
      )}
    </div>
  );
}

// ── Crafting Section ──────────────────────────────────────────────────────────

const CRAFTING_STATUS_COLORS: Record<CraftingQueueItem['status'], string> = {
  'planned':           '#a0a0b8',
  'materials-sourced': '#6ab0e0',
  'in-progress':       '#d4b46d',
  'complete':          '#6ad47e',
  'cancelled':         '#e87070',
};

function CraftingSectionPage({
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
    <div className="card px-5 py-5">
      <SectionHeader title="Currently Crafting" count={crafting.length} />
      {crafting.map(item => {
        const recipient = members.find(m => m.id === item.recipient_id);
        const statusColor = CRAFTING_STATUS_COLORS[item.status];
        return (
          <DataRow key={item.id}>
            <div className="flex-1 min-w-0">
              <span className="font-display text-[17px] font-semibold text-ink-100">{item.item_name}</span>
              <div className="text-[13px] mt-0.5" style={{ color: 'rgb(var(--ink-300))' }}>
                <span className="capitalize">{item.tier}</span>
                {recipient && <span className="ml-2">→ {recipient.name}</span>}
                {item.target_event && <span className="ml-2">by {eventMap[item.target_event] ?? item.target_event}</span>}
              </div>
            </div>
            <span
              className="num text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0"
              style={{ color: statusColor, borderColor: `${statusColor}50`, background: `${statusColor}18` }}
            >
              {item.status.replace('-', ' ')}
            </span>
          </DataRow>
        );
      })}
    </div>
  );
}
