# Serrated Claws — Redesign Handoff

> **Companion to:** `redesign-mockups.html` (visual reference)
> **Repo:** `Sebgedge87/serrated-claws@main` (commit 88877df)
> **Scope:** simplify user flow. No new features, no schema changes, no new deps.

---

## The flow we're shipping

```
Sign in ─▶ Overview ─▶ House tab ─▶ Character sheet
                │             │
                │             └─ Ledger view (default) ⇄ Cards view
                │
                └─ avatar dropdown reachable everywhere:
                   My Character · Switch Lance · Empire Wiki
                   Settings · Leave lance · Sign out
```

Three principles drive every change below:

1. **One primary action per screen.** The header has one — *My Character*. The action bar has one — *Add Person*. House tab has one — *Open* a member. No competing CTAs.
2. **House identity is a first-class signal.** Each house's `primary_color` reaches the tab bar, the underline, the ribbon, and the noble pill — not just an overview thumbnail.
3. **Density by default; expansion on demand.** Members in a roster are ledger rows; clicking opens the sheet. The card view is opt-in.

---

## Change 1 — Header chrome (highest impact)

### File: `src/components/Layout.tsx` (lines ~150–215)

**Remove** the inline right-side cluster (lance switcher select, profile block, My Character/Add Character button, Empire Wiki link, Leave Lance button, Sign-out button).

**Replace with** a single primary action + avatar dropdown.

### New component: `src/components/HeaderUserMenu.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials, cx } from '@/lib/utils';
import type { Profile, LanceMembership, Lance } from '@/lib/types';

interface Props {
  profile: Profile | null;
  user: { email?: string | null } | null;
  currentMembership: LanceMembership | null;
  memberships: LanceMembership[];
  currentLance: Lance | null;
  onSwitchLance: (id: string) => void;
  onLeaveLance: () => Promise<void>;
  onSignOut: () => void;
  wikiUrl: string;
}

export function HeaderUserMenu({
  profile, user, currentMembership, memberships, currentLance,
  onSwitchLance, onLeaveLance, onSignOut, wikiUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { confirm, Dialog } = useConfirm();

  // Close on outside click + Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const displayName = profile?.display_name ?? user?.email ?? 'Signed in';
  const role = currentMembership?.role ?? profile?.role ?? 'viewer';
  const init = initials(displayName);

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cx(
            'btn btn-ghost gap-2 pl-2 pr-3 py-1.5',
            open && 'bg-gold-500/5 border-gold-500/40'
          )}
        >
          <span className="w-7 h-7 rounded-full grid place-items-center font-display font-bold text-xs
                           bg-gradient-to-br from-ink-700 to-ink-800 text-ink-100
                           border border-gold-500/30">
            {init}
          </span>
          <span className="hidden sm:inline text-sm text-ink-100">{displayName}</span>
          <Icons.ChevronDown size={14} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-60 z-50
                       bg-gradient-to-b from-ink-800/98 to-ink-900/98
                       border border-gold-500/25 rounded-xl
                       shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]
                       backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gold-500/10">
              <div className="text-sm text-ink-100">{displayName}</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-gold-300 mt-0.5">
                {role} · {currentLance?.name ?? '—'}
              </div>
            </div>

            {/* Lance section */}
            {memberships.length > 1 && (
              <>
                <MenuLabel>Lance</MenuLabel>
                <button
                  role="menuitem"
                  className="menu-item w-full"
                  onClick={() => setSwitching(v => !v)}
                >
                  <Icons.Shield size={14} className="text-ink-300" />
                  Switch lance…
                </button>
                {switching && (
                  <div className="px-2 pb-2">
                    {memberships.map(m => (
                      <button
                        key={m.lance_id}
                        onClick={() => { onSwitchLance(m.lance_id); setOpen(false); }}
                        className={cx(
                          'w-full text-left text-xs px-3 py-2 rounded-md mb-0.5',
                          m.lance_id === currentLance?.id
                            ? 'bg-gold-500/15 text-gold-300'
                            : 'text-ink-100 hover:bg-gold-500/5'
                        )}
                      >
                        {m.lance?.name ?? m.lance_id}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <a
              role="menuitem"
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="menu-item w-full"
              onClick={() => setOpen(false)}
            >
              <Icons.BookOpen size={14} className="text-ink-300" />
              Empire Wiki ↗
            </a>

            {/* Danger zone */}
            <MenuLabel>Account</MenuLabel>
            <button
              role="menuitem"
              className="menu-item w-full text-red-300/80 hover:text-red-300"
              onClick={async () => {
                setOpen(false);
                if (await confirm({
                  title: `Leave "${currentLance?.name}"?`,
                  body: 'You will lose access until re-invited.',
                  danger: true, confirmLabel: 'Leave'
                })) await onLeaveLance();
              }}
            >
              <Icons.LogOut size={14} />
              Leave this lance
            </button>
            <button role="menuitem" className="menu-item w-full" onClick={onSignOut}>
              <Icons.LogOut size={14} className="text-ink-300" />
              Sign out
            </button>
          </div>
        )}
      </div>
      {Dialog}
    </>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-gold-300/60 font-bold border-b border-gold-500/8">
      {children}
    </div>
  );
}
```

### Add to `src/index.css`, inside `@layer components`:

```css
.menu-item {
  @apply flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-100 cursor-pointer
         border-b border-gold-500/8 text-left;
}
.menu-item:hover { @apply bg-gold-500/6; }
.menu-item:last-child { @apply border-b-0; }
```

### Replace the header right cluster in `Layout.tsx`:

```tsx
{/* AFTER */}
<div className="flex items-center gap-3">
  {currentMembership?.member_id ? (
    <button
      onClick={() => {
        const me = lance.data.members.find(m => m.id === currentMembership.member_id);
        if (me) setSelectedMember(me);
      }}
      className="btn btn-primary"
    >
      <Icons.Users size={15} />
      My Character
    </button>
  ) : (
    <button onClick={() => setShowCreateCharacter(true)} className="btn btn-primary">
      <Icons.Plus size={15} />
      Add Character
    </button>
  )}

  <HeaderUserMenu
    profile={profile}
    user={user}
    currentMembership={currentMembership}
    memberships={lances.memberships}
    currentLance={lances.currentLance ?? null}
    onSwitchLance={lances.setCurrentLanceId}
    onLeaveLance={async () => {
      if (lances.currentLanceId) await lances.leaveLance(lances.currentLanceId);
    }}
    onSignOut={signOut}
    wikiUrl={WIKI_URL}
  />
</div>
```

---

## Change 2 — Tab nav with house identity

### File: `src/components/Layout.tsx` (tabs section, ~line 250)

**Remove** `<span className="hidden xl:inline">{t.label}</span>` — let labels always show and let the row scroll horizontally on small screens.

**Add** a per-tab color signal for houses.

```tsx
const tabs = [
  { id: 'overview', label: 'Overview', Icon: Icons.House, color: null as string | null },
  ...lance.data.houses.map(h => ({
    id: h.id,
    label: h.name.replace('House ', ''),
    Icon: Icons.Shield,
    color: h.primary_color,
    monogram: monogramOf(h.name),   // ← helper below
  })),
  { id: 'unassigned',  label: 'Unassigned',  Icon: Icons.Question,  color: null },
  { id: 'covens',      label: 'Covens',      Icon: Icons.Sparkles,  color: null },
  { id: 'functions',   label: 'Functions',   Icon: Icons.Swords,    color: null },
  { id: 'businesses',  label: 'Businesses',  Icon: Icons.Briefcase, color: null },
  { id: 'inventory',   label: 'Inventory',   Icon: Icons.Package,   color: null },
  ...(isAdmin ? [{ id: 'admin', label: 'Admin', Icon: Icons.Shield, color: null }] : [])
];
```

Helper in `src/lib/utils.ts`:
```ts
/** "House Du Hyre" → "DH", "House de la Montagne" → "dM" */
export function monogramOf(name: string): string {
  const stripped = name.replace(/^House\s+/i, '').trim();
  const words = stripped.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]);
}
```

Updated tab render:
```tsx
<nav className="bg-ink-950/50 backdrop-blur border-b border-gold-500/15">
  <div className="page-wrap !px-2 sm:!px-4">
    <div className="flex overflow-x-auto scrollbar-hide">
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        const accent = t.color ?? 'rgb(212,180,109)'; // gold-300
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => { setActiveTab(t.id); setSelectedMember(null); }}
            className={cx(
              'tab-btn',
              isActive && 'active',
            )}
            style={isActive && t.color
              ? { color: t.color, borderBottomColor: t.color }
              : undefined}
          >
            {t.monogram ? (
              <span
                className="font-display font-bold text-[10px] grid place-items-center rounded
                           w-5 h-5 flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}55, ${accent}20)`,
                  border: `1px solid ${accent}88`,
                  color: accent,
                }}
              >
                {t.monogram}
              </span>
            ) : (
              <t.Icon size={15} />
            )}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  </div>
</nav>
```

---

## Change 3 — Action bar slim-down

### File: `src/components/Layout.tsx` (action bar block, ~line 220)

Remove the contextual "Delete House" button from the global action bar — move it into `HouseTab`. Keep only: search · Add Person (admin) · Add House (admin) · Export.

```tsx
{/* Action bar — AFTER */}
<div className="sticky top-0 z-40 bg-ink-900/40 backdrop-blur-xl border-b border-gold-500/15">
  <div className="page-wrap py-3 flex flex-wrap gap-3 items-center">
    <div className="relative flex-1 min-w-[280px]">
      <Icons.Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search members, ranks, functions…"
        className="input pl-11"
      />
    </div>
    {isAdmin && (
      <>
        <button onClick={() => setShowAddPerson(true)} className="btn btn-primary">
          <Icons.Plus size={16} /> Add Person
        </button>
        <button onClick={() => setShowAddHouse(true)} className="btn btn-secondary">
          <Icons.Plus size={16} /> House
        </button>
      </>
    )}
    <button onClick={exportCsv} className="btn btn-ghost">
      <Icons.Download size={16} /> Export
    </button>
  </div>
</div>
```

---

## Change 4 — House ribbon + ledger view

### File: `src/components/tabs/HouseTab.tsx`

Replace the small icon+name header with a full ribbon. Then offer a ledger view alongside the existing card view.

```tsx
import { useState } from 'react';
import type { House, Member, LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { MemberCard } from '@/components/MemberCard';
import { MemberLedgerRow } from '@/components/MemberLedgerRow';
import { useConfirm } from '@/components/ConfirmDialog';
import { cx } from '@/lib/utils';

interface Props {
  house: House;
  data: LanceData;
  search: string;
  isAdmin: boolean;
  canManageHouse: boolean;
  onUpsert: (m: Member) => Promise<void>;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteHouse: (id: string) => Promise<void>;
  onViewMember: (m: Member) => void;
}

type ViewMode = 'ledger' | 'cards';

const STORAGE_KEY = 'serrated.viewMode';

export function HouseTab({
  house, data, search, isAdmin, canManageHouse,
  onUpsert, onUnassign, onDelete, onDeleteHouse, onViewMember,
}: Props) {
  const [view, setView] = useState<ViewMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'ledger'
  );
  const setMode = (m: ViewMode) => { setView(m); localStorage.setItem(STORAGE_KEY, m); };
  const { confirm, Dialog } = useConfirm();

  const houseMembers = data.members.filter(m => m.house_id === house.id);
  const filtered = !search ? houseMembers : houseMembers.filter(m => {
    const q = search.toLowerCase();
    return [m.name, m.rank, m.function, m.player_name, m.military_function]
      .filter(Boolean).some(v => v!.toLowerCase().includes(q));
  });
  const nobles = filtered.filter(m => m.is_noble);
  const regulars = filtered.filter(m => !m.is_noble);

  return (
    <div className="animate-fade-in">
      <HouseRibbon
        house={house}
        memberCount={houseMembers.length}
        nobleCount={houseMembers.filter(m => m.is_noble).length}
        canManage={canManageHouse}
        onDelete={async () => {
          if (await confirm({
            title: `Delete ${house.name}?`,
            body: 'Members will be unassigned.',
            danger: true,
          })) onDeleteHouse(house.id);
        }}
      />

      {/* Section + view toggle */}
      {nobles.length > 0 && (
        <RosterSection
          label="Nobility"
          Icon={Icons.Crown}
          color="text-gold-300"
          count={nobles.length}
          view={view}
          onChangeView={setMode}
        >
          {view === 'ledger' ? (
            <LedgerTable members={nobles} isAdmin={isAdmin} onView={onViewMember} onUnassign={onUnassign} onDelete={onDelete} houseColor={house.primary_color} />
          ) : (
            <div className="grid gap-3.5">
              {nobles.map(m => (
                <MemberCard key={m.id} member={m} isAdmin={isAdmin}
                  onUnassign={onUnassign} onDelete={onDelete} onViewSheet={onViewMember} />
              ))}
            </div>
          )}
        </RosterSection>
      )}

      {regulars.length > 0 && (
        <RosterSection
          label="Members"
          Icon={Icons.Users}
          color="text-ink-300"
          count={regulars.length}
          view={nobles.length > 0 ? null : view}
          onChangeView={nobles.length > 0 ? null : setMode}
        >
          {view === 'ledger' ? (
            <LedgerTable members={regulars} isAdmin={isAdmin} onView={onViewMember} onUnassign={onUnassign} onDelete={onDelete} houseColor={house.primary_color} />
          ) : (
            <div className="grid gap-3.5">
              {regulars.map(m => (
                <MemberCard key={m.id} member={m} isAdmin={isAdmin}
                  onUnassign={onUnassign} onDelete={onDelete} onViewSheet={onViewMember} />
              ))}
            </div>
          )}
        </RosterSection>
      )}

      {filtered.length === 0 && (
        <p className="text-ink-300 text-center py-16">No members found</p>
      )}

      {Dialog}
    </div>
  );
}

/* ─────────────────── Ribbon ─────────────────── */

function HouseRibbon({
  house, memberCount, nobleCount, canManage, onDelete,
}: {
  house: House; memberCount: number; nobleCount: number; canManage: boolean; onDelete: () => void;
}) {
  const c = house.primary_color || '#d4b46d';
  return (
    <div className="relative rounded-2xl overflow-hidden mb-7 border border-gold-500/20">
      <div className="absolute inset-0 opacity-90"
           style={{ background: `linear-gradient(110deg, ${c} 0%, ${c}88 35%, rgba(20,17,14,0.95) 75%)` }} />
      <div className="absolute inset-0 pointer-events-none"
           style={{
             backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 1px)',
             backgroundSize: '18px 18px',
           }} />
      <div className="relative z-10 px-7 py-6 flex items-center gap-5 flex-wrap">
        <div
          className="w-16 h-16 rounded-2xl grid place-items-center text-white
                     bg-gradient-to-b from-white/20 to-black/15 backdrop-blur-sm
                     border border-white/25"
        >
          <Icons.Shield size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-3xl text-white drop-shadow-md leading-tight">
            {house.name}
          </h1>
          {house.motto && (
            <p className="font-display italic text-sm text-white/85 mt-1">"{house.motto}"</p>
          )}
          <div className="flex gap-2 mt-2.5">
            <Tag><Icons.Users size={11} />{memberCount} sworn</Tag>
            <Tag><Icons.Crown size={11} />{nobleCount} noble</Tag>
          </div>
        </div>
        {canManage && (
          <button
            onClick={onDelete}
            className="btn btn-sm"
            style={{ background: 'rgba(168,65,63,0.85)', color: 'white' }}
          >
            <Icons.Trash size={12} /> Delete house
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold
                     bg-black/30 text-white border border-white/25">
      {children}
    </span>
  );
}

/* ─────────────────── Section header ─────────────────── */

function RosterSection({
  label, Icon, color, count, children, view, onChangeView,
}: {
  label: string;
  Icon: typeof Icons.Crown;
  color: string;
  count: number;
  children: React.ReactNode;
  view: ViewMode | null;
  onChangeView: ((m: ViewMode) => void) | null;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 mt-8 mb-4">
        <Icon size={16} className={color} />
        <h3 className={cx('text-xs uppercase tracking-widest font-bold', color)}>{label}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 to-transparent" />
        <span className="text-xs text-ink-300">{count}</span>
        {view && onChangeView && (
          <div className="flex bg-black/30 border border-gold-500/15 rounded p-0.5 ml-2">
            {(['ledger', 'cards'] as const).map(m => (
              <button
                key={m}
                onClick={() => onChangeView(m)}
                className={cx(
                  'px-2.5 py-1 text-[11px] rounded-sm transition-colors',
                  view === m ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100'
                )}
              >
                {m === 'ledger' ? 'Ledger' : 'Cards'}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </>
  );
}

/* ─────────────────── Ledger table ─────────────────── */

function LedgerTable({
  members, isAdmin, onView, onUnassign, onDelete, houseColor,
}: {
  members: Member[];
  isAdmin: boolean;
  onView: (m: Member) => void;
  onUnassign: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  houseColor: string;
}) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="grid grid-cols-[36px_1.2fr_90px_1fr_100px_70px_90px] gap-3.5 px-4 py-2
                      text-[10px] uppercase tracking-[0.16em] text-ink-300 font-bold
                      border-b border-gold-500/15">
        <span /><span>Member</span><span>Rank</span><span>Function</span>
        <span>Income</span><span>Status</span><span /></div>
      {members.map(m => (
        <MemberLedgerRow
          key={m.id}
          member={m}
          isAdmin={isAdmin}
          houseColor={houseColor}
          onView={() => onView(m)}
          onUnassign={() => onUnassign(m.id)}
          onDelete={() => onDelete(m.id)}
        />
      ))}
    </div>
  );
}
```

### New file: `src/components/MemberLedgerRow.tsx`

```tsx
import type { Member } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials, cx, formatIncome } from '@/lib/utils';

interface Props {
  member: Member;
  isAdmin: boolean;
  houseColor: string;
  onView: () => void;
  onUnassign: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function MemberLedgerRow({ member, isAdmin, houseColor, onView, onUnassign, onDelete }: Props) {
  const { confirm, Dialog } = useConfirm();
  const income = formatIncome(member.rings_per_event, member.crowns_per_event, member.thrones_per_event);

  return (
    <>
      <div
        className="grid grid-cols-[36px_1.2fr_90px_1fr_100px_70px_90px] gap-3.5 items-center px-4 py-2.5
                   text-sm border-b border-gold-500/8 transition-colors hover:bg-gold-500/5 cursor-pointer"
        onClick={onView}
      >
        <div
          className={cx(
            'w-7 h-7 rounded-full grid place-items-center font-display font-bold text-[11px] flex-shrink-0',
            member.is_noble ? 'text-gold-300' : 'text-ink-100'
          )}
          style={{
            background: member.is_noble
              ? `linear-gradient(135deg, ${houseColor}55, ${houseColor}22)`
              : 'linear-gradient(135deg, rgba(140,120,100,0.3), rgba(80,70,60,0.2))',
            border: `1.5px solid ${member.is_noble ? houseColor + '99' : 'rgba(140,120,100,0.3)'}`,
            boxShadow: member.is_noble ? `0 0 12px ${houseColor}40` : 'none',
          }}
        >
          {initials(member.name)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-[14px] truncate">{member.name}</span>
            {member.is_noble && <Icons.Crown size={12} className="text-gold-300 flex-shrink-0" />}
          </div>
          {member.player_name && (
            <div className="text-[11px] text-ink-100/55 truncate">{member.player_name}</div>
          )}
        </div>

        <span className="text-[12px] text-ink-100 truncate">{member.rank ?? '—'}</span>
        <span className="text-[12px] text-gold-300 truncate">{member.function ?? '—'}</span>
        <span className="text-[12px] font-mono text-amber-300/90">{income ?? '—'}</span>
        <span className={`pill pill-${member.status.toLowerCase()}`}>{member.status}</span>

        <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={onView} className="btn btn-ghost btn-sm">
            Open <Icons.ArrowRight size={11} />
          </button>
          {isAdmin && (
            <button
              onClick={async () => {
                if (await confirm({ title: `Delete ${member.name}?`, body: 'This cannot be undone.', danger: true }))
                  await onDelete();
              }}
              className="btn btn-ghost btn-sm text-red-300/80 hover:text-red-300"
              title="Delete"
            >
              <Icons.Trash size={11} />
            </button>
          )}
        </div>
      </div>
      {Dialog}
    </>
  );
}
```

---

## Change 5 — Overview tab slim-down

### File: `src/components/tabs/OverviewTab.tsx`

Two surgical edits:

**a) Treasury card — one canonical total, sub-stacks below:**

Replace the `<CoinTile>` grid block with:

```tsx
<div className="font-display font-bold text-4xl text-gold-50 leading-none mb-4">
  {totalRings.toLocaleString()}
  <span className="font-sans text-base font-medium text-ink-300 ml-3">rings · total</span>
</div>
<div className="flex flex-wrap gap-2.5">
  <CoinStack label="rings"   value={rings}   color="#c0a060" />
  <CoinStack label="crowns"  value={crowns}  color="#d4b46d" />
  <CoinStack label="thrones" value={thrones} color="#f0d488" />
</div>
```

```tsx
function CoinStack({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-black/30
                 border border-gold-500/15"
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <strong className="font-mono text-ink-100">{value}</strong>
      <span className="text-ink-300">{label}</span>
    </span>
  );
}
```

**b) Stat cards — drop "Coven Members" tile (fold into Members as a sub-stat):**

```tsx
const stats = [
  { label: 'Members',    value: totalMembers,           Icon: Icons.Users,     color: '#d4b46d', sub: `${covenMembers} in covens` },
  { label: 'Nobles',     value: nobles,                 Icon: Icons.Crown,     color: '#e0c66d' },
  { label: 'Active',     value: active,                 Icon: Icons.Heart,     color: '#6dd47e' },
  { label: 'Businesses', value: data.businesses.length, Icon: Icons.Briefcase, color: '#7eb0d4' },
];
```

Inside the tile render:
```tsx
<div className="font-display font-bold text-4xl leading-none mb-1.5">{s.value}</div>
<div className="text-[11px] text-ink-300 uppercase tracking-widest font-semibold">{s.label}</div>
{s.sub && <div className="text-[10px] text-ink-300/70 mt-1">{s.sub}</div>}
```

---

## Change 6 — Sign-in collapse

### File: `src/components/SignIn.tsx`

Promote Google to the only top-level CTA. Hide email/password behind a disclosure. Magic link becomes a small link under the password field.

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/components/Icons';

export function SignIn() {
  const { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [useMagic, setUseMagic] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (useMagic) {
        const { error } = await signInWithMagicLink(email);
        if (error) setErr(error); else setMsg('Check your email for a sign-in link.');
      } else if (isSignup) {
        const { error } = await signUpWithPassword(email, password);
        if (error) setErr(error); else setMsg('Account created. Check email to confirm, then sign in.');
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) setErr(error);
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md card p-9 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

        <div className="grid place-items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-700 text-ink-900 grid place-items-center
                          shadow-[0_8px_24px_-8px_rgba(201,169,97,0.6),0_1px_0_rgba(255,255,255,0.3)_inset]">
            <Icons.Swords size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold mt-3.5 bg-gradient-to-b from-gold-50 to-gold-500
                         text-transparent bg-clip-text text-center">
            The Serrated Claws
          </h1>
          <p className="text-[10px] text-ink-100/50 uppercase tracking-[0.18em] mt-1">Lance Management</p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="btn btn-primary w-full justify-center py-3.5 text-sm"
        >
          <Icons.Google />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setShowPwd(v => !v)}
          className="mt-3.5 w-full text-xs text-ink-100/55 hover:text-gold-300 transition-colors py-2"
        >
          {showPwd ? '— Hide email & password —' : '— Use email & password instead —'}
        </button>

        {showPwd && (
          <form onSubmit={onSubmit} className="mt-2 pt-4 border-t border-gold-500/10 space-y-3 animate-fade-in">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                     className="input" placeholder="[email protected]" />
            </div>

            {!useMagic && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                       className="input" placeholder="••••••••" />
              </div>
            )}

            {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{err}</div>}
            {msg && <div className="text-xs text-sage-500 bg-sage-500/10 border border-sage-500/30 rounded-md px-3 py-2">{msg}</div>}

            <button type="submit" disabled={busy} className="btn btn-secondary w-full justify-center">
              {busy ? 'Working…' : useMagic ? 'Send magic link' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-[11px] text-ink-100/45 pt-1">
              <button type="button" onClick={() => setUseMagic(v => !v)} className="hover:text-gold-300">
                {useMagic ? 'Use password instead' : 'Send me a magic link'}
              </button>
              {!useMagic && (
                <button type="button" onClick={() => setIsSignup(v => !v)} className="hover:text-gold-300">
                  {isSignup ? 'Have an account?' : 'Create account'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

---

## Change 7 — Mobile considerations

Two scoped changes (no full mobile refactor):

### a) `src/components/Modal.tsx` — bottom-sheet on small screens

Replace the wrapper div classes:

```tsx
// BEFORE
<div className="fixed inset-0 z-50 grid place-items-center p-5 bg-black/75 backdrop-blur-md" onClick={onClose}>
  <div
    onClick={e => e.stopPropagation()}
    className={cx(
      'w-full max-h-[90vh] overflow-auto bg-gradient-to-b from-ink-800/95 to-ink-900/95 border border-gold-500/30 rounded-2xl animate-fade-in',
      …widthClasses
    )}
  >

// AFTER
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/75 backdrop-blur-md" onClick={onClose}>
  <div
    onClick={e => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    className={cx(
      'w-full max-h-[92vh] overflow-auto bg-gradient-to-b from-ink-800/95 to-ink-900/95 border border-gold-500/30 animate-fade-in',
      'rounded-t-2xl sm:rounded-2xl',
      width === 'sm' && 'sm:max-w-md',
      width === 'md' && 'sm:max-w-xl',
      width === 'lg' && 'sm:max-w-2xl',
    )}
  >
```

Below `sm` (640 px) the modal becomes a bottom sheet automatically (sticks to the bottom edge, rounded only at the top).

### b) Add an FAB on mobile (in `Layout.tsx`)

After the `<main>` block:

```tsx
{isAdmin && (
  <button
    onClick={() => setShowAddPerson(true)}
    className="sm:hidden fixed bottom-5 right-5 w-14 h-14 rounded-full grid place-items-center z-40
               text-ink-900 shadow-[0_12px_30px_-8px_rgba(201,169,97,0.6)]"
    style={{ background: 'linear-gradient(180deg, #d4b46d, #b8954c)' }}
    aria-label="Add person"
  >
    <Icons.Plus size={26} />
  </button>
)}
```

---

## Change 8 — Tidy-up sweep (low effort, code health)

1. **Delete unused** `src/components/Header.tsx` (Layout has its own inline header — `Header.tsx` is dead).
2. **Unify icons import path.** Pick one of `@/components/Icons` or `@/lib/icons` and grep-replace. Recommend `@/components/Icons` since more files use it.
3. **Unify class-merge helper.** `src/components/ui/Button.tsx` uses `cn`; everything else uses `cx`. Rename one.
4. **Move CSV export out of `Layout.tsx`.** Extract `exportCsv` (~100 lines) into `src/lib/exporters.ts` as `exportLanceCsv(data: LanceData)`.

---

## Accessibility additions (do as you touch each file)

| Change | File | What |
|---|---|---|
| `role="dialog"` + `aria-modal="true"` + focus trap | `Modal.tsx` | Add focus-trap. On open, focus first input. On Esc, return focus to opener. |
| `role="tab"` + `aria-selected` | `Layout.tsx` tabs | Already shown in Change 2. |
| `aria-label` on icon-only buttons | `MemberCard.tsx`, `MemberLedgerRow.tsx` | Unassign, Delete buttons today have only `title=` — add `aria-label`. |
| Decorative SVGs | `Header`, `Crest`, avatars | Add `aria-hidden="true"`. |

---

## Suggested commit order

| # | Branch | Files | Notes |
|---|---|---|---|
| 1 | `chore/cleanup` | delete `Header.tsx`, unify icons/cx | Lowest risk, do first. |
| 2 | `feat/header-menu` | new `HeaderUserMenu.tsx`, edit `Layout.tsx` | Highest visible impact. |
| 3 | `feat/tab-house-identity` | `Layout.tsx`, `lib/utils.ts` | Small but high impact. |
| 4 | `feat/house-ribbon-ledger` | new `MemberLedgerRow.tsx`, edit `HouseTab.tsx` | Biggest UX shift. |
| 5 | `feat/overview-tidy` | `OverviewTab.tsx` | One-sitting. |
| 6 | `feat/signin-collapse` | `SignIn.tsx` | One-sitting. |
| 7 | `feat/mobile` | `Modal.tsx`, `Layout.tsx`, FAB | Use real device. |
| 8 | `feat/a11y` | several | Sweep after the rest lands. |

---

## What this does **not** change

- **No schema migrations.** All edits are presentation-layer.
- **No new dependencies.** Tailwind utility classes only.
- **`MemberCard`, `CharacterSheetPage`, modals' bodies, `useLanceData`, auth, Supabase setup** — all untouched.
- **Theme tokens** in `tailwind.config.ts` — unchanged. We're using what's there.
