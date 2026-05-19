import { useMemo, useState } from 'react';
import type { CharInventoryItem, CharacterSkill, CraftingQueueItem, LanceData, Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { SKILLS_CATALOGUE, SKILL_CATEGORY_COLORS, SKILL_CATEGORY_ORDER, skillXpCost } from '@/lib/skillsCatalogue';
import type { SkillCategory } from '@/lib/skillsCatalogue';
import { TERRITORIES, RESOURCE_TYPES, resourceSubOptions, buildResourceString, parseResourceString } from '@/lib/personalResource';
import type { ResourceType } from '@/lib/personalResource';
import { EMPIRE_CATALOGUE } from '@/lib/catalogue';
import { cx } from '@/lib/utils';

interface Props {
  member: Member;
  data: LanceData;
  isAdmin: boolean;
  canEdit: boolean;
  wikiUrl: string;
  onBack: () => void;
  onUpsertMember: (m: Partial<Member> & { name: string }) => Promise<void>;
  onUpsertSkill: (s: Omit<CharacterSkill, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSkill: (id: string) => Promise<void>;
  onUpsertCharInventory: (i: Omit<CharInventoryItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCharInventory: (id: string) => Promise<void>;
}

export function CharacterSheetPage({
  member,
  data,
  isAdmin,
  canEdit,
  wikiUrl,
  onBack,
  onUpsertMember,
  onUpsertSkill,
  onDeleteSkill,
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

  const accent = member.is_noble ? '#d4b46d' : member.status === 'active' ? '#6dd47e' : member.status === 'KIA' ? '#ff7a7a' : '#999';

  function startEdit() {
    setForm({ ...member });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm({ ...member });
  }

  async function saveEdit() {
    if (!form.name?.trim() || busy) return;
    setBusy(true);
    try {
      await onUpsertMember({ ...member, ...form, name: form.name.trim() } as Partial<Member> & { name: string });
      setEditing(false);
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
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40 60%, transparent)` }} />
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Character Name</label>
              <input className="input font-display font-semibold" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Player Name</label>
              <input className="input" value={form.player_name ?? ''} onChange={e => set('player_name', e.target.value || null)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">PID</label>
              <input className="input font-mono" value={form.pid ?? ''} onChange={e => set('pid', e.target.value || null)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Rank</label>
              <input className="input" value={form.rank ?? ''} onChange={e => set('rank', e.target.value || null)} />
            </div>
            {isAdmin && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">House</label>
                  <select className="input" value={form.house_id ?? ''} onChange={e => set('house_id', e.target.value || null)}>
                    <option value="">Unassigned</option>
                    {data.houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1">Status</label>
                  <select className="input" value={form.status ?? 'active'} onChange={e => set('status', e.target.value as Member['status'])}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="KIA">KIA</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={!!form.is_noble} onChange={e => set('is_noble', e.target.checked)} className="w-4 h-4 accent-gold-300" />
                Noble
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={!!form.attending_event} onChange={e => set('attending_event', e.target.checked)} className="w-4 h-4 accent-gold-300" />
                Attending next event
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
            <button onClick={saveEdit} disabled={!form.name?.trim() || busy} className="btn btn-primary btn-sm">
              <Icons.Save size={13} />
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40 60%, transparent)` }} />
      <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">
            {member.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {member.is_noble && (
              <span className="pill pill-noble">
                <Icons.Crown size={11} />
                Noble
              </span>
            )}
            <span className={`pill pill-${member.status.toLowerCase()}`}>{member.status}</span>
            {house && <span className="text-sm text-ink-100/60">{house.name}</span>}
            {member.rank && <span className="text-sm font-semibold text-ink-100">{member.rank}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-ink-100/60">
            {member.player_name && <span>{member.player_name}</span>}
            {member.pid && <span className="font-mono text-[12px] opacity-70">PID {member.pid}</span>}
          </div>
        </div>
        {canEdit && (
          <button onClick={startEdit} className="btn btn-ghost btn-sm">
            <Icons.Edit size={13} />
            Edit
          </button>
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

  const totalXp = member.total_xp ?? 8;
  const xpSpent = skills.reduce((sum, sk) => {
    const cat = SKILLS_CATALOGUE.find(c => c.name === sk.skill_name);
    return sum + (cat ? skillXpCost(cat, sk.rank) : sk.rank);
  }, 0);
  const xpRemaining = totalXp - xpSpent;
  const xpPct = totalXp > 0 ? Math.min(100, (xpSpent / totalXp) * 100) : 0;

  async function saveXp() {
    const val = parseInt(xpInput) || 8;
    await onUpsertMember({ ...member, total_xp: val, name: member.name });
    setEditingXp(false);
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
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              type="number"
              min={xpSpent}
              className="input text-sm w-20 py-1"
              value={xpInput}
              onChange={e => setXpInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveXp(); if (e.key === 'Escape') setEditingXp(false); }}
            />
            <button onClick={saveXp} className="btn btn-primary btn-sm text-xs py-1">Save</button>
            <button onClick={() => setEditingXp(false)} className="btn btn-ghost btn-sm text-xs py-1">✕</button>
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

      <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-3">Stats</div>
      <div className="space-y-2">
        {member.hp != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60 flex items-center gap-1.5">
              <Icons.Heart size={12} className="text-red-400" /> HP
            </span>
            <span className="text-sm font-mono font-bold text-red-400">{member.hp}</span>
          </div>
        )}
        {member.mp != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60 flex items-center gap-1.5">
              <Icons.Zap size={12} className="text-blue-400" /> MP
            </span>
            <span className="text-sm font-mono font-bold text-blue-400">{member.mp}</span>
          </div>
        )}
        {member.coin_per_event && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60 flex items-center gap-1.5">
              <Icons.Coins size={12} className="text-gold-300" /> Coin / Event
            </span>
            <span className="text-sm font-mono font-bold text-gold-300">{member.coin_per_event}</span>
          </div>
        )}
        {member.coven && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60 flex items-center gap-1.5">
              <Icons.Sparkles size={12} className="text-purple-400" /> Coven
            </span>
            <span className="text-sm text-ink-100">{member.coven}</span>
          </div>
        )}
        {member.military_function && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60 flex items-center gap-1.5">
              <Icons.Shield size={12} /> Military Role
            </span>
            <span className="text-sm text-ink-100">{member.military_function}</span>
          </div>
        )}
      </div>
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

  async function saveResource(type: ResourceType | null, sub: string | null) {
    const resource = buildResourceString(type, sub);
    await onUpsertMember({ ...member, resource, name: member.name });
  }

  async function saveTerritory(val: string | null) {
    await onUpsertMember({ ...member, territory: val, name: member.name });
  }

  if (!canEdit) {
    if (!member.resource && !member.territory) return null;
    return (
      <div className="card px-4 py-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-3">Personal Resource</div>
        {member.territory && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-100/60">Territory</span>
            <span className="text-sm text-ink-100">{member.territory}</span>
          </div>
        )}
        {member.resource && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-100/60">Resource</span>
            <span className="text-sm text-ink-100">{member.resource}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card px-4 py-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-3">Personal Resource</div>

      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-widest text-ink-100/40 block mb-1.5">Territory</label>
        <select
          className="input text-sm"
          value={territory ?? ''}
          onChange={async e => {
            const val = e.target.value || null;
            setTerritory(val);
            await saveTerritory(val);
          }}
        >
          <option value="">None</option>
          {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

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
                const newSub = null;
                setResType(newType);
                setResSub(newSub);
                await saveResource(newType, newSub);
              }}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      {subOptions.length > 0 && (
        <div>
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
            <option value="">None</option>
            {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
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
            onChange={e => setDraft(d => ({ ...d, rank: Math.max(1, parseInt(e.target.value) || 1) }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        {selectedEntry ? (
          <div className="text-xs flex items-center gap-2">
            <span className={cx('font-semibold', canAfford ? 'text-gold-300' : 'text-red-400')}>
              {thisCost}xp {canAfford ? '' : '— not enough XP'}
            </span>
            {selectedEntry.scaling === '*' && <span className="text-ink-100/40">+1/rank</span>}
            {selectedEntry.scaling === '**' && <span className="text-ink-100/40">flat/rank</span>}
            {selectedEntry.requires?.length && <span className="text-ink-100/40">req: {selectedEntry.requires.join(', ')}</span>}
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
                onChange={e => setNewItem(n => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
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
}: {
  memberId: string;
  queue: CraftingQueueItem[];
  members: { id: string; name: string }[];
}) {
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
                {item.target_event && <span className="text-xs text-ink-100/30 ml-2">by {item.target_event}</span>}
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
