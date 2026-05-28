import { useMemo, useState } from 'react';
import type { CharInventoryItem, CharacterRitual, CharacterSkill, CharacterSpell, CraftingQueueItem, LanceData, Member } from '@/lib/types';
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

interface Props {
  member: Member;
  data: LanceData;
  isAdmin: boolean;
  canEdit: boolean;
  isOwn: boolean;
  wikiUrl: string;
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

      {/* Hero section */}
      <HeroSection
        member={member}
        data={data}
        house={house}
        canEdit={canEdit}
        isAdmin={isAdmin}
        onUpsertMember={onUpsertMember}
      />

      {/* Two-column layout */}
      <div className="mt-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <StatsCard
          member={member}
          skills={data.characterSkills.filter(s => s.member_id === member.id)}
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
          <PersonalResourceCard
            member={member}
            canEdit={canEdit}
            onUpsertMember={onUpsertMember}
          />
          {member.notes && (
            <div className="card px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Notes</div>
              <p className="text-sm leading-relaxed text-ink-100/80">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SkillsSection
            memberId={member.id}
            skills={data.characterSkills.filter(s => s.member_id === member.id)}
            totalXp={member.total_xp ?? 8}
            canEdit={canEdit}
            onUpsert={onUpsertSkill}
            onDelete={onDeleteSkill}
          />
          {(member.mp != null || data.characterSpells.some(s => s.member_id === member.id) || canEdit) && (
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
          <RitualsSection
            memberId={member.id}
            member={member}
            data={data}
            rituals={data.characterRituals.filter(r => r.member_id === member.id)}
            canEdit={canEdit}
            onUpsert={onUpsertRitual}
            onDelete={onDeleteRitual}
          />
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
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  member,
  data,
  house,
  canEdit,
  isAdmin,
  onUpsertMember,
}: {
  member: Member;
  data: LanceData;
  house: typeof data.houses[number] | undefined;
  canEdit: boolean;
  isAdmin: boolean;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({ ...member });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const accent = (form.is_noble ?? member.is_noble) ? '#d4b46d' : (form.status ?? member.status) === 'active' ? '#6dd47e' : (form.status ?? member.status) === 'KIA' ? '#ff7a7a' : '#999';
  const ro = !editing; // read-only shorthand

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

  const inputCls = (extra = '') =>
    `input ${extra} ${ro ? 'opacity-70 cursor-default pointer-events-none select-text' : ''}`;

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40 60%, transparent)` }} />
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-ink-100/40 font-semibold">Character</div>
          {canEdit && (
            editing ? (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
                <button onClick={saveEdit} disabled={!form.name?.trim() || busy} className="btn btn-primary btn-sm">
                  <Icons.Save size={13} />
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={startEdit} className="btn btn-ghost btn-sm">
                <Icons.Edit size={13} />
                Edit
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Character Name</label>
            <input className={inputCls('font-display font-semibold')} readOnly={ro} value={ro ? (member.name ?? '') : (form.name ?? '')} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Player Name</label>
            <input className={inputCls()} readOnly={ro} value={ro ? (member.player_name ?? '') : (form.player_name ?? '')} onChange={e => set('player_name', e.target.value || null)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">PID</label>
            <input className={inputCls('font-mono')} readOnly={ro} value={ro ? (member.pid ?? '') : (form.pid ?? '')} onChange={e => set('pid', e.target.value || null)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Rank</label>
            <input className={inputCls()} readOnly={ro} value={ro ? (member.rank ?? '') : (form.rank ?? '')} onChange={e => set('rank', e.target.value || null)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Claw</label>
            {ro ? (
              <input className={inputCls()} readOnly value={data.functions.find(f => f.id === member.function)?.name ?? ''} />
            ) : (
              <select className="input" value={form.function ?? ''} onChange={e => set('function', e.target.value || null)}>
                <option value="">None</option>
                {data.functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Military Role</label>
            <input className={inputCls()} readOnly={ro} placeholder="Shield Wall, Battle Mage…" value={ro ? (member.military_function ?? '') : (form.military_function ?? '')} onChange={e => set('military_function', e.target.value || null)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">HP</label>
            <input type={ro ? 'text' : 'number'} min={0} className={inputCls()} readOnly={ro} value={ro ? (member.hp ?? '') : (form.hp ?? '')} onChange={e => set('hp', e.target.value !== '' ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">MP</label>
            <input type={ro ? 'text' : 'number'} min={0} className={inputCls()} readOnly={ro} value={ro ? (member.mp ?? '') : (form.mp ?? '')} onChange={e => set('mp', e.target.value !== '' ? Number(e.target.value) : null)} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Income / Event</label>
            {ro ? (
              <input className={inputCls()} readOnly value={formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event) ?? ''} />
            ) : (
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
            )}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Coven</label>
            {ro ? (
              <input className={inputCls()} readOnly value={data.covens.find(c => c.id === member.coven)?.name ?? ''} />
            ) : (
              <select className="input" value={form.coven ?? ''} onChange={e => set('coven', e.target.value || null)}>
                <option value="">None</option>
                {data.covens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          {isAdmin && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">House</label>
                {ro ? (
                  <input className={inputCls()} readOnly value={house?.name ?? 'Unassigned'} />
                ) : (
                  <select className="input" value={form.house_id ?? ''} onChange={e => set('house_id', e.target.value || null)}>
                    <option value="">Unassigned</option>
                    {data.houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Status</label>
                {ro ? (
                  <input className={inputCls()} readOnly value={member.status ?? ''} />
                ) : (
                  <select className="input" value={form.status ?? 'active'} onChange={e => set('status', e.target.value as Member['status'])}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="KIA">KIA</option>
                  </select>
                )}
              </div>
            </>
          )}
          <div className="flex items-center gap-4 col-span-2">
            <label className={`flex items-center gap-2 text-sm ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
              <input type="checkbox" disabled={ro} checked={ro ? !!member.is_noble : !!form.is_noble} onChange={e => set('is_noble', e.target.checked)} className="w-4 h-4 accent-gold-300" />
              Noble
            </label>
            <label className={`flex items-center gap-2 text-sm ${ro ? 'cursor-default' : 'cursor-pointer'}`}>
              <input type="checkbox" disabled={ro} checked={ro ? !!member.attending_event : !!form.attending_event} onChange={e => set('attending_event', e.target.checked)} className="w-4 h-4 accent-gold-300" />
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

// ── Stats Card ────────────────────────────────────────────────────────────────

function StatsCard({
  member,
  skills,
  canEdit,
  onUpsertMember,
}: {
  member: Member;
  skills: CharacterSkill[];
  canEdit: boolean;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
}) {
  const [editingXp, setEditingXp] = useState(false);
  const [xpInput, setXpInput] = useState(String(member.total_xp ?? 8));
  const [xpError, setXpError] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState({ hp: member.hp ?? '', mp: member.mp ?? '', rings_per_event: member.rings_per_event ?? '', crowns_per_event: member.crowns_per_event ?? '', thrones_per_event: member.thrones_per_event ?? '' });
  const [statsBusy, setStatsBusy] = useState(false);

  const totalXp = member.total_xp ?? 8;
  const xpSpent = skills.reduce((sum, sk) => {
    const cat = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
    return sum + (cat ? skillXpCost(cat, sk.rank) : sk.rank);
  }, 0);
  const xpRemaining = totalXp - xpSpent;
  const xpPct = totalXp > 0 ? Math.min(100, (xpSpent / totalXp) * 100) : 0;

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

  return (
    <div className="card px-4 py-4">
      {/* XP / Level block */}
      <div className="mb-4 pb-4 border-b border-gold-500/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold">XP</span>
          {canEdit && !editingXp && (
            <button onClick={() => { setXpInput(String(totalXp)); setEditingXp(true); }} className="text-[10px] text-ink-100/40 hover:text-gold-300 transition-colors">
              edit
            </button>
          )}
        </div>
        {editingXp ? (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                min={xpSpent}
                className="input text-sm w-20 py-1"
                value={xpInput}
                onChange={e => setXpInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveXp(); if (e.key === 'Escape') { setEditingXp(false); setXpError(null); } }}
              />
              <button onClick={saveXp} className="btn btn-primary btn-sm text-xs py-1">Save</button>
              <button onClick={() => { setEditingXp(false); setXpError(null); }} className="btn btn-ghost btn-sm text-xs py-1">✕</button>
            </div>
            {xpError && <p className="text-red-400 text-[11px] mt-1">{xpError}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-2xl font-display font-bold text-gold-300">{totalXp}</span>
              <span className={cx('text-sm font-mono font-semibold', xpRemaining < 0 ? 'text-red-400' : xpRemaining === 0 ? 'text-ink-100/60' : 'text-sage-500')}>
                {xpRemaining >= 0 ? `${xpRemaining} remaining` : `${Math.abs(xpRemaining)} over`}
              </span>
            </div>
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${xpPct}%`,
                  background: xpRemaining < 0 ? '#e87070' : 'linear-gradient(90deg, #d4b46d, #6ad47e)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-ink-100/40">
              <span>{xpSpent} spent</span>
              <span>{totalXp} total</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold">Stats</div>
        {canEdit && !editingStats && (
          <button onClick={() => { setStatsForm({ hp: member.hp ?? '', mp: member.mp ?? '', rings_per_event: member.rings_per_event ?? '', crowns_per_event: member.crowns_per_event ?? '', thrones_per_event: member.thrones_per_event ?? '' }); setEditingStats(true); }} className="text-[10px] text-ink-100/40 hover:text-gold-300 transition-colors">
            edit
          </button>
        )}
      </div>

      {editingStats ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1 flex items-center gap-1"><Icons.Heart size={10} className="text-red-400" /> HP</label>
              <input type="number" min={0} className="input text-sm py-1" value={statsForm.hp} onChange={e => setStatsForm(f => ({ ...f, hp: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1 flex items-center gap-1"><Icons.Zap size={10} className="text-blue-400" /> MP</label>
              <input type="number" min={0} className="input text-sm py-1" value={statsForm.mp} onChange={e => setStatsForm(f => ({ ...f, mp: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1 flex items-center gap-1"><Icons.Coins size={10} className="text-gold-300" /> Income / Event</label>
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
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setEditingStats(false)} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button onClick={saveStats} disabled={statsBusy} className="btn btn-primary btn-sm text-xs">
              {statsBusy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {member.hp != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-100/60 flex items-center gap-1.5"><Icons.Heart size={12} className="text-red-400" /> HP</span>
              <span className="text-sm font-mono font-bold text-red-400">{member.hp}</span>
            </div>
          )}
          {member.mp != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-100/60 flex items-center gap-1.5"><Icons.Zap size={12} className="text-blue-400" /> MP</span>
              <span className="text-sm font-mono font-bold text-blue-400">{member.mp}</span>
            </div>
          )}
          {formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-100/60 flex items-center gap-1.5"><Icons.Coins size={12} className="text-gold-300" /> Income / Event</span>
              <span className="text-sm font-mono font-bold text-gold-300">{formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event)}</span>
            </div>
          )}
          {!member.hp && !member.mp && !formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event) && canEdit && (
            <p className="text-xs text-ink-100/30 text-center py-1">No stats set · click edit</p>
          )}
          {member.coven && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-100/60 flex items-center gap-1.5"><Icons.Sparkles size={12} className="text-purple-400" /> Coven</span>
              <span className="text-sm text-ink-100">{member.coven}</span>
            </div>
          )}
          {member.military_function && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-100/60 flex items-center gap-1.5"><Icons.Shield size={12} /> Military Role</span>
              <span className="text-sm text-ink-100">{member.military_function}</span>
            </div>
          )}
        </div>
      )}
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icons.Coins size={13} className="text-gold-300" />
          <span className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold">Personal Funds</span>
          <span className="text-[9px] text-ink-100/30 ml-1">(private)</span>
        </div>
        {canEdit && !editing && (
          <button onClick={() => { setForm({ personal_rings: member.personal_rings ?? 0, personal_crowns: member.personal_crowns ?? 0, personal_thrones: member.personal_thrones ?? 0 }); setEditing(true); }} className="text-[10px] text-ink-100/40 hover:text-gold-300 transition-colors">
            edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {(['personal_thrones', 'personal_crowns', 'personal_rings'] as const).map(key => (
              <div key={key}>
                <label className="text-[10px] text-ink-100/40 block mb-1 capitalize">{key.replace('personal_', '')}</label>
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
            <span className="text-2xl font-display font-bold text-gold-300">
              {t > 0 && <>{t}<span className="text-sm text-gold-300/60 ml-0.5">t</span>{' '}</>}
              {c > 0 && <>{c}<span className="text-sm text-gold-300/60 ml-0.5">c</span>{' '}</>}
              {r > 0 && <>{r}<span className="text-sm text-gold-300/60 ml-0.5">r</span></>}
              {total === 0 && <span className="text-ink-100/30">0r</span>}
            </span>
            <span className="text-xs text-ink-100/40 font-mono">{total} rings</span>
          </div>

          {incomeRings > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gold-500/10">
              <span className="text-xs text-ink-100/50">
                Income / event: <span className="text-gold-300/80">{formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event)}</span>
              </span>
              {canEdit && (
                <button onClick={collectIncome} disabled={busy} className="btn btn-ghost btn-sm text-xs text-gold-300 hover:bg-gold-500/10">
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

  if (!canEdit) {
    if (!member.resource) return null;
    return (
      <div className="card px-4 py-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-3">Personal Resource</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-100">{member.resource}</span>
          {member.territory && <span className="text-xs text-ink-100/50">{member.territory}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="card px-4 py-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-3">Personal Resource</div>

      {/* Step 1: pick resource type */}
      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1.5">Resource Type</label>
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_TYPES.map(rt => (
            <button
              key={rt}
              className={cx(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                resType === rt
                  ? 'bg-gold-500/20 border-gold-500/60 text-gold-300'
                  : 'bg-black/20 border-gold-500/15 text-ink-100/60 hover:border-gold-500/40 hover:text-ink-100'
              )}
              onClick={async () => {
                const newType = resType === rt ? null : rt;
                // Reset sub and territory if switching type
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

      {/* Step 2: subtype (Forest/Mine only) */}
      {resType && subOptions.length > 0 && (
        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1.5">Subtype</label>
          <select
            className="input text-sm"
            value={resSub ?? ''}
            onChange={async e => {
              const val = e.target.value || null;
              setResSub(val);
              await saveResource(resType, val);
            }}
          >
            <option value="">— choose subtype —</option>
            {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Step 3: territory — only shown when a resource type is selected */}
      {resType && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1.5">
            Territory
            {resType === 'Fleet' && <span className="ml-1.5 text-ink-100/30">(coastal only)</span>}
          </label>
          <select
            className="input text-sm"
            value={territory ?? ''}
            onChange={async e => await saveTerritory(e.target.value || null)}
          >
            <option value="">— choose territory —</option>
            {validTerritories.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Skills Section ────────────────────────────────────────────────────────────

type CategoryFilter = SkillCategory | 'All';

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
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
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

  const categoriesWithSkills = useMemo(() => {
    const cats = new Set<SkillCategory>();
    for (const s of skills) cats.add((s.category as SkillCategory) || 'Other');
    return cats;
  }, [skills]);

  const visibleTabs: CategoryFilter[] = ['All', ...SKILL_CATEGORY_ORDER.filter(c => categoriesWithSkills.has(c) || adding)];
  const filteredSkills = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory);

  const grouped = useMemo(() => {
    const map = new Map<string, CharacterSkill[]>();
    for (const s of filteredSkills) {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [filteredSkills]);

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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Character Skills</span>
        {canEdit && !adding && (
          <button onClick={() => setAdding(true)} className="btn btn-ghost btn-sm text-xs">
            <Icons.Plus size={13} />
            Add Skills
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {visibleTabs.map(cat => {
          const colors = cat !== 'All' ? SKILL_CATEGORY_COLORS[cat as SkillCategory] : null;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cx(
                'px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                isActive && colors
                  ? 'border-opacity-60'
                  : 'bg-black/20 border-gold-500/15 text-ink-100/60 hover:text-ink-100 hover:border-gold-500/40'
              )}
              style={isActive && colors ? { background: colors.bg, color: colors.text, borderColor: colors.border } : undefined}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Existing skills */}
      {orderedCategories.map(cat => {
        const catSkills = grouped.get(cat)!;
        const colors = SKILL_CATEGORY_COLORS[(cat as SkillCategory)] ?? SKILL_CATEGORY_COLORS.Other;
        return (
          <div key={cat} className="mb-3">
            {activeCategory === 'All' && (
              <div className="text-[10px] uppercase tracking-widest text-ink-100/40 mb-1.5">{cat}</div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {catSkills.map(sk => {
                const catalogueEntry = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
                const xpCostTotal = catalogueEntry ? skillXpCost(catalogueEntry, sk.rank) : sk.rank;
                return (
                  <div
                    key={sk.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-default"
                    style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                    title={catalogueEntry?.description}
                  >
                    <span>{sk.skill_name}</span>
                    {sk.rank > 1 && (
                      <span className="px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: colors.border, color: colors.text }}>
                        ×{sk.rank}
                      </span>
                    )}
                    <span className="opacity-60 text-[10px]">{xpCostTotal}xp</span>
                    {canEdit && (
                      <button onClick={() => onDelete(sk.id)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity" title="Remove skill">
                        <Icons.X size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {skills.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No skills recorded{canEdit ? ' · click Add Skills to begin' : ''}</p>
      )}

      {/* Add skills panel */}
      {adding && (
        <div className="mt-3 border-t border-gold-500/10 pt-3 space-y-3">
          {/* Pending queue */}
          {pending.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-ink-100/40 mb-1">Queued</div>
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

          {/* XP bar */}
          <div className="text-[11px] flex items-center gap-2">
            <span className={cx('font-semibold', xpRemaining < 0 ? 'text-red-400' : 'text-gold-300')}>
              {xpRemaining}xp remaining
            </span>
            <span className="text-ink-100/30">({xpSpent + pendingXp} / {totalXp} used)</span>
          </div>

          <SkillPicker
            activeCategory={activeCategory}
            xpRemaining={xpRemaining}
            onQueue={queueSkill}
          />

          <div className="flex items-center justify-between">
            <button onClick={cancelAdding} className="btn btn-ghost btn-sm text-xs">Cancel</button>
            <button
              onClick={saveAll}
              disabled={!pending.length || busy || xpRemaining < 0}
              className="btn btn-primary btn-sm text-xs"
            >
              {busy ? 'Saving…' : pending.length > 1 ? `Save ${pending.length} Skills` : 'Save Skill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skill Picker ─────────────────────────────────────────────────────────────

function SkillPicker({
  activeCategory,
  xpRemaining,
  onQueue,
}: {
  activeCategory: CategoryFilter;
  xpRemaining: number;
  onQueue: (skill: PendingSkill) => void;
}) {
  const [draft, setDraft] = useState({ skill_name: '', category: 'Combat' as SkillCategory, rank: 1 });
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const base = activeCategory === 'All' ? SKILLS_CATALOGUE : SKILLS_CATALOGUE.filter(s => s.category === activeCategory);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(s => s.name.toLowerCase().includes(q));
  }, [activeCategory, query]);

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
          <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Skill</label>
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
                <div className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 && (
                    <div className="px-3 py-3 text-xs text-ink-100/40 text-center">No skills match</div>
                  )}
                  {activeCategory === 'All'
                    ? SKILL_CATEGORY_ORDER.map(cat => {
                        const catSkills = filtered.filter(s => s.category === cat);
                        if (!catSkills.length) return null;
                        const catColors = SKILL_CATEGORY_COLORS[cat];
                        return (
                          <div key={cat}>
                            <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold sticky top-0 bg-ink-800" style={{ color: catColors.text }}>
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
                      })
                    : filtered.map(s => {
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
                              {s.requires?.length && <span className="text-[9px] text-ink-100/30">req: {s.requires.join(', ')}</span>}
                            </span>
                            <span className="text-[10px] text-ink-100/40 flex-shrink-0">
                              {s.xpCost}xp{s.scaling === '*' ? '+' : s.scaling === '**' ? '×' : ''}
                            </span>
                          </button>
                        );
                      })
                  }
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Rank</label>
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
              <span className={cx('font-semibold', canAfford ? 'text-gold-300' : 'text-red-400')}>
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

  return (
    <div className="card px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Mastered Rituals</span>
        {canEdit && (
          <button onClick={openAdding} className="btn btn-ghost btn-sm text-xs">
            <Icons.Plus size={13} />
            Add Ritual
          </button>
        )}
      </div>

      {rituals.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No rituals mastered{canEdit ? ' · click Add Ritual to begin' : ''}</p>
      )}

      {rituals.length > 0 && (
        <div className="space-y-1.5">
          {rituals.map(rt => {
            const colors = REALM_COLORS[(rt.realm as RitualRealm)] ?? REALM_COLORS.Spring;
            return (
              <div key={rt.id} className="flex items-start gap-3 py-1.5 border-b border-gold-500/8 last:border-0">
                <span
                  className="shrink-0 mt-0.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border"
                  style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  {rt.realm}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-100">{rt.ritual_name}</div>
                  {rt.notes && <div className="text-xs text-ink-100/50 mt-0.5">{rt.notes}</div>}
                </div>
                {canEdit && (
                  <button onClick={() => onDelete(rt.id)} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity mt-0.5">
                    <Icons.X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="mt-3 pt-3 border-t border-gold-500/10 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Realm</label>
              <select
                className="input text-sm"
                value={realm}
                onChange={e => changeRealm(e.target.value as RitualRealm)}
                disabled={!!covenRealm}
              >
                {RITUAL_REALM_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-[2]">
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Ritual</label>
              <select
                autoFocus
                className="input text-sm"
                value={ritualName}
                onChange={e => setRitualName(e.target.value)}
              >
                <option value="">— choose ritual —</option>
                {availableRituals.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
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
  // Derive realm from member's coven domain
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

  // When the derived realm changes (e.g. coven updates), sync the school default
  const availableSpells = useMemo(() => spellsForRealm(school as SpellRealm), [school]);

  function openAdding() {
    setSchool(covenRealm ?? 'Spring');
    setSpellName('');
    setMagnitude(1);
    setNotes('');
    setAdding(true);
  }

  // When school changes, reset spell selection
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#b56eb5' }}>Spells</span>
        {canEdit && (
          <button onClick={openAdding} className="btn btn-ghost btn-sm text-xs">
            <Icons.Plus size={13} />
            Add Spell
          </button>
        )}
      </div>

      {spells.length === 0 && !adding && (
        <p className="text-xs text-ink-100/40 text-center py-4">No spells recorded{canEdit ? ' · click Add Spell to begin' : ''}</p>
      )}

      {SPELL_SCHOOLS.filter(s => bySchool.has(s)).map(s => {
        const schoolSpells = bySchool.get(s)!;
        const sc = SCHOOL_COLORS[s];
        return (
          <div key={s} className="mb-3">
            <div className="text-[10px] uppercase tracking-widest mb-1.5 font-semibold" style={{ color: sc.text }}>{s}</div>
            <div className="flex flex-wrap gap-1.5">
              {schoolSpells.map(sp => (
                <div
                  key={sp.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                  title={sp.notes ?? undefined}
                >
                  <span>{sp.spell_name}</span>
                  <span className="opacity-60 text-[10px]">{sp.magnitude}m</span>
                  {canEdit && (
                    <button onClick={() => onDelete(sp.id)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
                      <Icons.X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {adding && (
        <div className="mt-2 border-t border-gold-500/10 pt-3 space-y-2 bg-ink-800/30 rounded-lg p-3 border border-gold-500/10">
          {/* School selector — locked to coven realm if set */}
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

          {/* Spell dropdown filtered to chosen school */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Spell</label>
            <select
              className="input text-sm"
              value={spellName}
              onChange={e => pickSpell(e.target.value)}
            >
              <option value="">— choose spell —</option>
              {availableSpells.map(sp => (
                <option key={sp.name} value={sp.name}>{sp.name} ({sp.manaCost}m) {sp.type === 'Offensive' ? '⚔' : ''}</option>
              ))}
            </select>
          </div>

          {spellName && (
            <div className="text-xs text-ink-100/50 px-1">
              {availableSpells.find(s => s.name === spellName)?.effect}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Notes</label>
              <input className="input text-sm" placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Mag</label>
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-bold text-gold-300">Character Inventory</span>
        {canEdit && (
          <button onClick={() => setAdding(a => !a)} className="btn btn-ghost btn-sm text-xs">
            <Icons.Plus size={13} />
            Add Item
          </button>
        )}
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
              {canEdit && (
                <button onClick={() => onDelete(ci.id)} className="btn btn-ghost btn-sm text-red-400/60 hover:text-red-400 flex-shrink-0 px-1.5">
                  <Icons.Trash size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="bg-ink-800/30 rounded-lg p-3 space-y-2 mb-2 border border-gold-500/10">
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Item</label>
              <select
                autoFocus
                className="input text-sm"
                value={newItem.item}
                onChange={e => {
                  const name = e.target.value;
                  const entry = EMPIRE_CATALOGUE.find(c => c.item === name);
                  setNewItem(n => ({ ...n, item: name, category: entry?.type ?? n.category }));
                }}
              >
                <option value="">— choose item —</option>
                {Array.from(new Set(EMPIRE_CATALOGUE.map(c => c.type))).map(type => (
                  <optgroup key={type} label={type}>
                    {EMPIRE_CATALOGUE.filter(c => c.type === type).map(c => (
                      <option key={c.item} value={c.item}>{c.item}{c.unit ? ` (${c.unit})` : ''}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1">Qty</label>
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
