import React, { useMemo, useState } from 'react';
import type { Coven, CovenRitual, LanceData } from '@/lib/types';
import { RITUALS_CATALOGUE, REALM_COLORS } from '@/lib/ritualsCatalogue';
import type { RitualRealm } from '@/lib/ritualsCatalogue';
import { Icons } from '@/components/Icons';
import { Modal, Field } from '@/components/Modal';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLance } from '@/contexts/LanceContext';
import { RitualScriptEditor } from '@/components/RitualScriptEditor';

function StyledCheckbox({ checked, onChange, label, color = '#a78bfa', title }: {
  checked: boolean; onChange: () => void; label?: React.ReactNode; color?: string; title?: string;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none group" title={title}>
      <span
        onClick={onChange}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${checked ? color : 'rgba(232,230,227,0.2)'}`,
          background: checked ? `${color}22` : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      {label && <span style={{ color: checked ? 'rgb(var(--ink-100))' : 'rgba(232,230,227,0.45)', fontSize: 12, transition: 'color 0.15s' }}>{label}</span>}
    </label>
  );
}

interface Props {
  canManageCoven: (id: string) => boolean;
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


export function CovensTab({ canManageCoven }: Props) {
  const { data, isAdmin, upsertCoven: onUpsert, deleteCoven: onDelete, upsertCovenRitual: onUpsertRitual, deleteCovenRitual: onDeleteRitual, upsertRitualScript: onUpsertScript } = useLance();
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
          onUpsertScript={onUpsertScript}
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
  coven, data, isAdmin, canManage, onBack, onUpsert, onDelete, onUpsertRitual, onDeleteRitual, onUpsertScript, confirm
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
  onUpsertScript: (covenId: string, ritualName: string, script: string) => Promise<void>;
  confirm: (opts: { title: string; body?: string; danger?: boolean; confirmLabel?: string }) => Promise<boolean>;
}) {
  void onUpsertRitual; void onDeleteRitual; void confirm;
  const [editingCoven, setEditingCoven] = useState(false);
  const [realmFilter, setRealmFilter] = useState<RitualRealm | 'all'>('all');
  const [expandedRitual, setExpandedRitual] = useState<string | null>(null);
  const [regioRituals, setRegioRituals] = useState<Set<string>>(new Set());
  function toggleRegio(name: string) {
    setRegioRituals(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  // Per-ritual override: which member_ids are actively casting (null = all)
  const [activeCasters, setActiveCasters] = useState<Map<string, Set<string>>>(new Map());

  function toggleCaster(ritualName: string, memberId: string, allIds: string[]) {
    setActiveCasters(prev => {
      const next = new Map(prev);
      const current = next.get(ritualName) ?? new Set(allIds);
      const updated = new Set(current);
      if (updated.has(memberId)) { updated.delete(memberId); } else { updated.add(memberId); }
      // If all selected again, clear the override
      if (updated.size === allIds.length) { next.delete(ritualName); } else { next.set(ritualName, updated); }
      return next;
    });
  }

  const members = data.members.filter(m => m.coven === coven.id);
  const memberIds = new Set(members.map(m => m.id));
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]));
  const covenHue = coven.domain ? (REALM_HUE[coven.domain as RitualRealm] ?? A) : A;
  const leaderName = coven.leader ? data.members.find(m => m.id === coven.leader)?.name : null;
  // Map lore skill name → realm
  const LORE_REALM: Record<string, string> = {
    'Spring Lore': 'Spring', 'Summer Lore': 'Summer', 'Autumn Lore': 'Autumn',
    'Winter Lore': 'Winter', 'Day Lore': 'Day', 'Night Lore': 'Night',
  };

  // Per-member lore rank per realm
  const memberLore = useMemo(() => {
    const map = new Map<string, Map<string, number>>(); // member_id → realm → rank
    for (const sk of data.characterSkills) {
      if (!memberIds.has(sk.member_id)) continue;
      const realm = LORE_REALM[sk.skill_name];
      if (!realm) continue;
      if (!map.has(sk.member_id)) map.set(sk.member_id, new Map());
      map.get(sk.member_id)!.set(realm, sk.rank);
    }
    return map;
  }, [data.characterSkills, memberIds]);

  // Aggregate character rituals for all coven members
  const baseRituals = useMemo(() => {
    // Group character_rituals by ritual name
    const byName = new Map<string, {
      ritual: typeof RITUALS_CATALOGUE[0] | undefined;
      masteredBy: string[];
      realm: string;
      memberEntries: Array<{ member_id: string; mastered: boolean }>;
    }>();
    for (const cr of data.characterRituals) {
      if (!memberIds.has(cr.member_id)) continue;
      const catalogueEntry = RITUALS_CATALOGUE.find(r => r.name === cr.ritual_name);
      const existing = byName.get(cr.ritual_name);
      if (existing) {
        if (cr.mastered) existing.masteredBy.push(memberMap[cr.member_id] ?? cr.member_id);
        existing.memberEntries.push({ member_id: cr.member_id, mastered: cr.mastered });
      } else {
        byName.set(cr.ritual_name, {
          ritual: catalogueEntry,
          masteredBy: cr.mastered ? [memberMap[cr.member_id] ?? cr.member_id] : [],
          realm: cr.realm ?? catalogueEntry?.realm ?? 'Special',
          memberEntries: [{ member_id: cr.member_id, mastered: cr.mastered }],
        });
      }
    }
    return Array.from(byName.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => (a.ritual?.magnitude ?? 0) - (b.ritual?.magnitude ?? 0));
  }, [data.characterRituals, memberIds, memberMap]);

  // Derived: mana per ritual based on active casters + regio bonus (recomputed when regio/activeCasters changes)
  const memberRituals = useMemo(() => {
    return baseRituals.map(v => {
      const casting = activeCasters.get(v.name) ?? new Set(v.memberEntries.map(e => e.member_id));
      const covenMana = v.memberEntries
        .filter(e => casting.has(e.member_id))
        .reduce((sum, entry) => {
          const baseRank = memberLore.get(entry.member_id)?.get(v.realm) ?? 0;
          const effectiveRank = baseRank + (regioRituals.has(v.name) ? 1 : 0);
          return sum + effectiveRank * (entry.mastered ? 2 : 1);
        }, 0);
      return { ...v, covenMana, casting };
    });
  }, [baseRituals, activeCasters, regioRituals, memberLore]);

  const filteredRituals = useMemo(() =>
    realmFilter === 'all' ? memberRituals : memberRituals.filter(r => r.realm === realmFilter),
    [memberRituals, realmFilter]
  );

  // "Can cast unaided" = coven mana contribution meets ritual magnitude
  const castableCount = memberRituals.filter(r => r.covenMana >= (r.ritual?.magnitude ?? 0)).length;
  const realmsPresent = useMemo(() => {
    const s = new Set(memberRituals.map(r => r.realm as RitualRealm));
    return (['Spring','Summer','Autumn','Winter','Day','Night','Special'] as RitualRealm[]).filter(r => s.has(r));
  }, [memberRituals]);

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

      {/* Mana strip */}
      <div className="mb-8" style={{ border: '1px solid var(--line)', borderRadius: '8px', display: 'flex', overflow: 'hidden', background: 'rgb(var(--ink-800))' }}>
        {[
          { label: 'Rituals Known', value: memberRituals.length, color: 'rgb(var(--ink-300))' },
          { label: 'Can Cast',     value: castableCount, color: castableCount > 0 ? 'var(--ok)' : 'rgb(var(--ink-300))' },
          { label: 'Need Resources', value: memberRituals.length - castableCount, color: (memberRituals.length - castableCount) > 0 ? 'var(--danger)' : 'rgb(var(--ink-300))' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '18px 16px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none', textAlign: 'center' }}>
            <div className="num" style={{ fontSize: '28px', color: s.color, lineHeight: 1, marginBottom: '5px' }}>{s.value}</div>
            <div className="eyebrow" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rituals known by coven members */}
      <div className="mb-8">
        <SectionHeader title="Rituals Known" count={memberRituals.length} accent={covenHue} />

        {/* Realm filter tabs */}
        {realmsPresent.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            <button
              onClick={() => setRealmFilter('all')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
              style={{ background: realmFilter === 'all' ? `${covenHue}22` : 'transparent', color: realmFilter === 'all' ? covenHue : 'rgba(232,230,227,0.45)', borderColor: realmFilter === 'all' ? `${covenHue}50` : 'rgba(201,169,97,0.15)' }}
            >
              All
            </button>
            {realmsPresent.map(realm => {
              const rc = REALM_COLORS[realm];
              const active = realmFilter === realm;
              return (
                <button
                  key={realm}
                  onClick={() => setRealmFilter(realm)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
                  style={{ background: active ? `${rc.bg}` : 'transparent', color: active ? rc.text : 'rgba(232,230,227,0.45)', borderColor: active ? rc.border : 'rgba(201,169,97,0.15)' }}
                >
                  {realm}
                </button>
              );
            })}
          </div>
        )}

        {memberRituals.length === 0 ? (
          <p className="text-ink-100/40 text-sm py-6 text-center">No rituals mastered by coven members yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gold-500/10">
                <tr>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100/60">Ritual</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100/60">Realm</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-center text-ink-100/60">Mag</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-center text-ink-100/60">Coven Mana</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100/60">Shortfall / Resources</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-center text-ink-100/60">Regio</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100/60">Casters</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100/60">Effect</th>
                </tr>
              </thead>
              <tbody>
                {filteredRituals.map((r, idx) => {
                  const mag = r.ritual?.magnitude ?? 0;
                  const shortfall = Math.max(0, mag - r.covenMana);
                  const rh = REALM_HUE[r.realm as RitualRealm] ?? covenHue;
                  const rc = REALM_COLORS[r.realm as RitualRealm];
                  const isExpanded = expandedRitual === r.name;
                  const effect = r.ritual?.effect ?? '';

                  let shortfallNode: React.ReactNode;
                  if (mag === 0) {
                    shortfallNode = <span className="text-ink-100/30 text-xs">—</span>;
                  } else if (shortfall === 0) {
                    shortfallNode = <span className="text-[11px] font-bold" style={{ color: 'var(--ok)' }}>✓ Ready</span>;
                  } else {
                    // vis = 3 mana each; crystals = 1 mana each
                    const visNeeded = Math.ceil(shortfall / 3);
                    // Best mix: max vis without overshooting, then top up with crystals
                    const visMix = Math.floor(shortfall / 3);
                    const crystalMix = shortfall - visMix * 3;
                    const mixLabel = visMix > 0 && crystalMix > 0
                      ? `${visMix} vis + ${crystalMix} crystal${crystalMix !== 1 ? 's' : ''}`
                      : null;
                    shortfallNode = (
                      <div className="text-xs leading-snug">
                        <span style={{ color: 'var(--danger)' }} className="font-semibold">−{shortfall} mana short</span>
                        <div className="text-ink-100/40 mt-0.5">
                          {shortfall} crystal{shortfall !== 1 ? 's' : ''} · or {visNeeded} vis
                          {mixLabel && <> · or {mixLabel}</>}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <React.Fragment key={r.name}>
                    <tr className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                      <td className="px-4 py-3 font-semibold text-sm text-ink-100 whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {rc ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{r.realm}</span>
                        ) : <span className="text-xs text-ink-100/50">{r.realm}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="num text-sm" style={{ color: rh }}>{mag}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="num text-sm" style={{ color: r.covenMana >= mag ? 'var(--ok)' : 'var(--danger)' }}>{r.covenMana}</span>
                      </td>
                      <td className="px-4 py-3">{shortfallNode}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <StyledCheckbox
                            checked={regioRituals.has(r.name)}
                            onChange={() => toggleRegio(r.name)}
                            title="+1 lore rank to each caster"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.memberEntries.length === 1 ? (
                          <span className="text-sm text-ink-100/70">
                            {memberMap[r.memberEntries[0].member_id] ?? '—'}
                            {r.memberEntries[0].mastered && <span className="ml-1 text-[10px] text-purple-400">★</span>}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {r.memberEntries.map(entry => {
                              const name = memberMap[entry.member_id] ?? entry.member_id;
                              const allIds = r.memberEntries.map(e => e.member_id);
                              const isActive = r.casting.has(entry.member_id);
                              return (
                                <StyledCheckbox
                                  key={entry.member_id}
                                  checked={isActive}
                                  onChange={() => toggleCaster(r.name, entry.member_id, allIds)}
                                  label={<>{name}{entry.mastered && <span className="ml-1 text-[10px] text-purple-400">★</span>}</>}
                                />
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-100/70 cursor-pointer max-w-xs"
                        onClick={() => setExpandedRitual(isExpanded ? null : r.name)}>
                        <span>{effect.length > 70 ? `${effect.slice(0, 70)}…` : effect}</span>
                        <span className="ml-2 text-[10px] text-ink-100/30">{isExpanded ? '▲' : '▼ script'}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.name}-script`} className="border-t border-gold-500/10">
                        <td colSpan={8} className="px-4 pb-4">
                          {effect && <p className="text-sm text-ink-100/60 mt-3 mb-2 leading-relaxed">{effect}</p>}
                          <RitualScriptEditor
                            covenName={coven.name}
                            ritualName={r.name}
                            initialScript={data.ritualScripts.find(s => s.coven_id === coven.id && s.ritual_name === r.name)?.script ?? ''}
                            members={members}
                            onSave={script => onUpsertScript(coven.id, r.name, script)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                })}
              </tbody>
            </table>
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

