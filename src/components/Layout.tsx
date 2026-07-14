import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanceData } from '@/hooks/useLanceData';
import { useLances } from '@/hooks/useLances';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/hooks/useTheme';
import { LanceProvider } from '@/contexts/LanceContext';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { HeaderUserMenu } from '@/components/HeaderUserMenu';
import { LanceGate } from '@/components/LanceGate';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { HouseTab } from '@/components/tabs/HouseTab';
import { HousesTab } from '@/tabs/HousesTab';
import { CovensTab } from '@/tabs/CovensTab';
import { AdminTab } from '@/tabs/AdminTab';
import { BankTab } from '@/tabs/BankTab';
import { AttendingBanner } from '@/components/AttendingBanner';
import { WalkThrough, hasSeen } from '@/components/WalkThrough';
import { AddHouseModal } from '@/components/modals/AddHouseModal';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { CharacterSheetPage } from '@/components/CharacterSheetPage';
import { CreateCharacterScreen } from '@/components/CreateCharacterScreen';
import { cx } from '@/lib/utils';
import type { House, Member } from '@/lib/types';
import { nationConfig } from '@/lib/nations';

const WIKI_URL = 'https://www.profounddecisions.co.uk/empire-wiki/Skills';

type TabId = 'overview' | 'houses' | 'covens' | 'treasury' | 'admin';

export function Layout() {
  const { user, profile, signOut } = useAuth();
  const lances = useLances(user?.id ?? null);
  const lance = useLanceData(lances.currentLanceId);
  const perms = usePermissions(lances.currentMembership, lance.data);
  const isAdmin = lances.currentMembership?.role === 'admin' || lances.currentMembership?.role === 'super_admin' || (!!lances.currentMembership && profile?.role === 'super_admin');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activeHouse, setActiveHouse] = useState<House | null>(null);
  const [treasuryView, setTreasuryView] = useState<'holdings' | 'stock' | 'ventures'>('holdings');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const { Dialog: ConfirmDialog } = useConfirm();
  const { theme, toggleTheme } = useTheme();
  const [showTour, setShowTour] = useState(() => !!profile?.id && !hasSeen(profile.id));

  const lanceNation = nationConfig(lance.settings?.nation);

  // Apply nation theme to <html> via data-nation attribute
  useEffect(() => {
    const slug = lanceNation.slug === 'dawn' ? null : lanceNation.slug;
    if (slug) document.documentElement.setAttribute('data-nation', slug);
    else document.documentElement.removeAttribute('data-nation');
    return () => document.documentElement.removeAttribute('data-nation');
  }, [lanceNation.slug]);

  type TabDef = { id: TabId; label: string; Icon: typeof Icons.House };
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview',                      Icon: Icons.House },
    { id: 'houses',   label: lanceNation.groupTermPlural,     Icon: Icons.Shield },
    { id: 'covens',   label: 'Covens',                        Icon: Icons.Sparkles },
    { id: 'treasury', label: 'Quartermaster',                  Icon: Icons.Coins },
    ...(isAdmin ? [{ id: 'admin' as TabId, label: 'Admin',   Icon: Icons.Shield }] : []),
  ];

  // Global search results
  const q = search.trim().toLowerCase();
  const searchResults = q.length >= 2 ? {
    members: lance.data.members.filter(m =>
      [m.name, m.player_name, m.rank].filter(Boolean).some(v => v!.toLowerCase().includes(q))
    ).slice(0, 6),
    houses: lance.data.houses.filter(h => h.name.toLowerCase().includes(q)).slice(0, 4),
    covens: lance.data.covens.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3),
  } : null;

  function exportCsv() {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines: string[] = [];

    // Members
    lines.push(['House', 'Name', 'Player', 'Rank', 'Function', 'Military Role', 'Noble', 'Status', 'Attending', 'HP', 'MP', 'Coven', 'Tithe Paid', 'Tithe Notes', 'Notes'].map(q).join(','));
    lance.data.members.forEach(m => {
      const house = lance.data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned';
      lines.push([house, m.name, m.player_name ?? '', m.rank ?? '', m.function ?? '', m.military_function ?? '', m.is_noble ? 'Y' : 'N', m.status, m.attending_event ? 'Y' : 'N', m.hp ?? '', m.mp ?? '', m.coven ?? '', m.tithe_paid ? 'Y' : 'N', m.tithe_notes ?? '', m.notes ?? ''].map(q).join(','));
    });

    // Blank row + inventory header
    lines.push('');
    lines.push(['INVENTORY', 'Current Qty', 'Required Qty', 'Status'].map(q).join(','));
    lance.data.inventory.forEach(i => {
      const status = i.required_qty === 0 ? '' : i.current_qty >= i.required_qty ? 'OK' : `Short ${i.required_qty - i.current_qty}`;
      lines.push([i.item, i.current_qty, i.required_qty, status].map(q).join(','));
    });

    // Blank row + skills section
    if (lance.data.characterSkills.length > 0) {
      lines.push('');
      lines.push(['SKILLS', 'Character', 'Skill', 'Category', 'Rank', 'Notes'].map(q).join(','));
      lance.data.characterSkills.forEach(sk => {
        const member = lance.data.members.find(m => m.id === sk.member_id);
        lines.push([member?.name ?? sk.member_id, sk.skill_name, sk.category, sk.rank, sk.notes ?? ''].map(q).join(','));
      });
    }

    // Blank row + rituals section
    if (lance.data.characterRituals.length > 0) {
      lines.push('');
      lines.push(['RITUALS', 'Character', 'Ritual', 'Realm', 'Notes'].map(q).join(','));
      lance.data.characterRituals.forEach(rt => {
        const member = lance.data.members.find(m => m.id === rt.member_id);
        lines.push([member?.name ?? rt.member_id, rt.ritual_name, rt.realm, rt.notes ?? ''].map(q).join(','));
      });
    }

    // Blank row + money summary
    const inv = Object.fromEntries(lance.data.inventory.map(i => [i.item, i]));
    const rings = inv['Ring']?.current_qty ?? 0;
    const crowns = inv['Crown']?.current_qty ?? 0;
    const thrones = inv['Throne']?.current_qty ?? 0;
    const totalRings = rings + crowns * 20 + thrones * 160;
    lines.push('');
    lines.push(['QUARTERMASTER', 'Rings', 'Crowns', 'Thrones', 'Total (rings)'].map(q).join(','));
    lines.push(['' , rings, crowns, thrones, totalRings].map(q).join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `serrated-claws-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  // Show LanceGate if no lance is selected or user has no memberships
  const gate = !lances.loading && (lances.memberships.length === 0 || (!lances.currentLanceId && lances.memberships.length > 1));

  if (gate || lances.loading) {
    return (
      <LanceGate
        memberships={lances.memberships}
        loading={lances.loading}
        currentLanceId={lances.currentLanceId}
        memberIdToMove={profile?.member_id ?? null}
        onSelect={lances.setCurrentLanceId}
        onCreate={lances.createLance}
        onJoin={lances.joinLance}
        onMoveCharacter={lances.moveCharacterToLance}
      />
    );
  }

  const currentMembership = lances.currentMembership;

  const lanceContextValue = {
    lanceId: lances.currentLanceId ?? '',
    data: lance.data,
    memberships: lance.memberships,
    settings: lance.settings,
    loading: lance.loading,
    error: lance.error,
    isAdmin,
    reload: lance.reload,
    upsertHouse: lance.upsertHouse,
    deleteHouse: lance.deleteHouse,
    upsertMember: lance.upsertMember,
    unassignMember: lance.unassignMember,
    deleteMember: lance.deleteMember,
    upsertBusiness: lance.upsertBusiness,
    deleteBusiness: lance.deleteBusiness,
    upsertCoven: lance.upsertCoven,
    deleteCoven: lance.deleteCoven,
    upsertFunction: lance.upsertFunction,
    deleteFunction: lance.deleteFunction,
    setInventory: lance.setInventory,
    setInventoryPrice: lance.setInventoryPrice,
    logInventory: lance.logInventory,
    upsertProfile: lance.upsertProfile,
    removeUser: lance.removeUser,
    upsertSettings: lance.upsertSettings,
    addMembership: lance.addMembership,
    resetInventoryQty: lance.resetInventoryQty,
    clearInventoryLog: lance.clearInventoryLog,
    upsertEvent: lance.upsertEvent,
    deleteEvent: lance.deleteEvent,
    clearAttending: lance.clearAttending,
    upsertCharInventory: lance.upsertCharInventory,
    deleteCharInventory: lance.deleteCharInventory,
    upsertCharacterSkill: lance.upsertCharacterSkill,
    deleteCharacterSkill: lance.deleteCharacterSkill,
    upsertCharacterRitual: lance.upsertCharacterRitual,
    deleteCharacterRitual: lance.deleteCharacterRitual,
    upsertCharacterSpell: lance.upsertCharacterSpell,
    deleteCharacterSpell: lance.deleteCharacterSpell,
    upsertMagicItemStock: lance.upsertMagicItemStock,
    deleteMagicItemStock: lance.deleteMagicItemStock,
    upsertCraftingQueueItem: lance.upsertCraftingQueueItem,
    deleteCraftingQueueItem: lance.deleteCraftingQueueItem,
    upsertCovenRitual: lance.upsertCovenRitual,
    deleteCovenRitual: lance.deleteCovenRitual,
    updateCovenMana: lance.updateCovenMana,
    upsertBardWork: lance.upsertBardWork,
    deleteBardWork: lance.deleteBardWork,
    upsertRitualScript: lance.upsertRitualScript,
    upsertScriptPermission: lance.upsertScriptPermission,
    resetAllPlayerData: lance.resetAllPlayerData,
  };

  return (
    <LanceProvider value={lanceContextValue}>
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-50 border-b border-gold-500/15 bg-gradient-to-br from-ink-900/95 to-ink-800/95">
        <div
          className="absolute -top-10 -right-10 w-72 h-72 opacity-[0.04] pointer-events-none text-gold-300"
          style={{ background: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="page-wrap py-8 relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl text-ink-800 grid place-items-center" style={{ background: 'linear-gradient(135deg, #d4b46d 0%, #b8954c 100%)', boxShadow: '0 8px 24px -8px rgba(201,169,97,0.6), 0 1px 0 rgba(255,255,255,0.3) inset' }}>
              <Icons.Swords size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold m-0 text-gold-300 select-none">
                {lance.settings?.name ?? lances.currentLance?.name ?? 'Empire LARP'}
              </h1>
              <p className="text-xs uppercase tracking-[0.15em] text-ink-100/50 mt-1">Group Management System</p>
            </div>
          </div>
          {/* AFTER: one primary action + avatar dropdown. Everything else lives
              behind the dropdown so the header reads at a glance. */}
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
                <span className="hidden sm:inline">My Character</span>
              </button>
            ) : (
              <button onClick={() => setShowCreateCharacter(true)} className="btn btn-primary">
                <Icons.Plus size={15} />
                <span className="hidden sm:inline">Add Character</span>
              </button>
            )}
            <HeaderUserMenu
              profile={profile}
              user={user ?? null}
              currentMembership={currentMembership ?? null}
              memberships={lances.memberships}
              currentLance={lances.currentLance ?? null}
              onSwitchLance={lances.setCurrentLanceId}
              onLeaveLance={async () => {
                if (lances.currentLanceId) await lances.leaveLance(lances.currentLanceId);
              }}
              onSignOut={signOut}
              wikiUrl={WIKI_URL}
              navTabs={tabs.map(t => ({ id: t.id, label: t.label, active: activeTab === t.id }))}
              onNavigate={id => { setActiveTab(id as TabId); setSelectedMember(null); setActiveHouse(null); }}
              onShowTour={() => setShowTour(true)}
            />
            <button onClick={toggleTheme} className="btn btn-ghost btn-sm" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Icons.Sun size={14} /> : <Icons.Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Action bar */}
      <div className="sticky top-0 z-40 bg-ink-900/40 backdrop-blur-xl border-b border-gold-500/15">
      <div className="page-wrap py-3 flex gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]" ref={searchRef}>
          <Icons.Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search members, houses, covens…"
            className="input pl-11"
          />
          {searchOpen && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 card border border-gold-500/20 overflow-hidden shadow-2xl" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {searchResults.members.length === 0 && searchResults.houses.length === 0 && searchResults.covens.length === 0 && (
                <div className="px-4 py-3 text-sm text-ink-100/40">No results for "{search}"</div>
              )}
              {searchResults.members.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-100/40 font-semibold border-b border-gold-500/10">Members</div>
                  {searchResults.members.map(m => (
                    <button key={m.id} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2.5 border-b border-gold-500/8 last:border-0 transition-colors"
                      onMouseDown={() => { setSelectedMember(m); setSearch(''); setSearchOpen(false); }}>
                      <Icons.Users size={13} className="text-gold-300/60 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-ink-100 truncate">{m.name}</div>
                        {m.player_name && <div className="text-xs text-ink-100/40 truncate">{m.player_name}</div>}
                      </div>
                    </button>
                  ))}
                </>
              )}
              {searchResults.houses.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-100/40 font-semibold border-b border-gold-500/10">{lanceNation.groupTermPlural}</div>
                  {searchResults.houses.map(h => (
                    <button key={h.id} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2.5 border-b border-gold-500/8 last:border-0 transition-colors"
                      onMouseDown={() => { setActiveTab('houses'); setActiveHouse(h); setSearch(''); setSearchOpen(false); setSelectedMember(null); }}>
                      <Icons.Shield size={13} className="text-gold-300/60 flex-shrink-0" />
                      <span className="text-sm text-ink-100 truncate">{h.name}</span>
                    </button>
                  ))}
                </>
              )}
              {searchResults.covens.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-100/40 font-semibold border-b border-gold-500/10">Covens</div>
                  {searchResults.covens.map(c => (
                    <button key={c.id} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2.5 border-b border-gold-500/8 last:border-0 transition-colors"
                      onMouseDown={() => { setActiveTab('covens'); setSearch(''); setSearchOpen(false); setSelectedMember(null); }}>
                      <Icons.Sparkles size={13} className="text-gold-300/60 flex-shrink-0" />
                      <span className="text-sm text-ink-100 truncate">{c.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {/* Button group — wraps as a unit so nothing strands on its own row */}
        <div className="flex gap-2 items-center flex-shrink-0">
          {isAdmin && (
            <>
              <button onClick={() => setShowAddPerson(true)} className="btn btn-primary" title="Add person">
                <Icons.Users size={16} />
                <span className="hidden sm:inline">Add Person</span>
              </button>
              <button onClick={() => setShowAddHouse(true)} className="btn btn-secondary" title={`Add ${lanceNation.groupTerm}`}>
                <Icons.Shield size={16} />
                <span className="hidden sm:inline">{lanceNation.groupTerm}</span>
              </button>
            </>
          )}
          <button onClick={() => lance.reload(false)} className="btn btn-ghost" title="Refresh data" disabled={lance.loading}>
            <Icons.Refresh size={16} className={lance.loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCsv} className="btn btn-ghost" title="Export CSV">
            <Icons.Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div></div>

      {/* Tabs — hidden on mobile (replaced by bottom nav) */}
      <nav className="hidden sm:block bg-ink-950/50 backdrop-blur border-b border-gold-500/15">
        <div className="page-wrap">
          <div className="flex" role="tablist">
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => { setActiveTab(t.id); setSelectedMember(null); if (t.id !== 'houses') setActiveHouse(null); }}
                  className={cx('tab-btn', isActive && 'active')}
                >
                  <t.Icon size={15} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Attending event banner — shown for all users with unanswered attendance */}
      <AttendingBanner />

      {/* Content */}
      <main className="py-8 sm:py-10 pb-24 sm:pb-10 animate-fade-in">
      <div className="page-wrap">
        {lance.loading && <div className="text-ink-100/60 text-center py-20">Loading roster…</div>}
        {lance.error && <ErrorBanner error={lance.error} />}

        {!lance.loading && !lance.error && selectedMember && (() => {
          const liveMember = lance.data.members.find(m => m.id === selectedMember.id) ?? selectedMember;
          return (
          <CharacterSheetPage
            member={liveMember}
            data={lance.data}
            isAdmin={isAdmin}
            canEdit={isAdmin || currentMembership?.member_id === liveMember.id || (!!user && liveMember.claimed_by === user.id)}
            isOwn={currentMembership?.member_id === liveMember.id || (!!user && liveMember.claimed_by === user.id)}
            wikiUrl={WIKI_URL}
            onBack={() => setSelectedMember(null)}
            onUpsertMember={lance.upsertMember}
            onUpsertSkill={lance.upsertCharacterSkill}
            onDeleteSkill={lance.deleteCharacterSkill}
            onUpsertSpell={lance.upsertCharacterSpell}
            onDeleteSpell={lance.deleteCharacterSpell}
            onUpsertRitual={lance.upsertCharacterRitual}
            onDeleteRitual={lance.deleteCharacterRitual}
            onUpsertCharInventory={lance.upsertCharInventory}
            onDeleteCharInventory={lance.deleteCharInventory}
            memberships={lance.memberships}
          />
          );
        })()}

        {!lance.loading && !lance.error && !selectedMember && (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                data={lance.data}
                filteredMembers={lance.data.members}
                isAdmin={isAdmin}
                nation={lance.settings?.nation}
                onNavigate={id => {
                  // Map legacy IDs that no longer exist as top-level tabs
                  const house = lance.data.houses.find(h => h.id === id);
                  if (house) { setActiveTab('houses'); setActiveHouse(house); return; }
                  if (id === 'roster') { setActiveTab('houses'); setActiveHouse(null); return; }
                  if (id === 'inventory') { setActiveTab('treasury'); setTreasuryView('stock'); setActiveHouse(null); return; }
                  if (id === 'businesses') { setActiveTab('treasury'); setTreasuryView('ventures'); setActiveHouse(null); return; }
                  setActiveTab(id as TabId);
                  setActiveHouse(null);
                }}
              />
            )}
            {activeTab === 'houses' && !activeHouse && (
              <HousesTab onSelect={h => setActiveHouse(h)} />
            )}
            {activeTab === 'houses' && activeHouse && (() => {
              const liveHouse = lance.data.houses.find(h => h.id === activeHouse.id) ?? activeHouse;
              return (
                <HouseTab
                  house={liveHouse}
                  data={lance.data}
                  search={search}
                  isAdmin={isAdmin}
                  currentMemberId={profile?.member_id ?? null}
                  onUpsert={lance.upsertMember}
                  onUnassign={lance.unassignMember}
                  onDelete={lance.deleteMember}
                  onDeleteHouse={async () => { await lance.deleteHouse(liveHouse.id); setActiveHouse(null); }}
                  onUpsertCharInventory={lance.upsertCharInventory}
                  onDeleteCharInventory={lance.deleteCharInventory}
                  onUpsertSkill={lance.upsertCharacterSkill}
                  onDeleteSkill={lance.deleteCharacterSkill}
                  onUpsertRitual={lance.upsertCharacterRitual}
                  onDeleteRitual={lance.deleteCharacterRitual}
                  onViewMember={setSelectedMember}
                  onBack={() => setActiveHouse(null)}
                />
              );
            })()}
            {activeTab === 'covens' && <CovensTab canManageCoven={perms.canManageCoven} myMemberId={currentMembership?.member_id ?? null} />}
            {activeTab === 'treasury' && <BankTab canManageBusiness={perms.canManageBusiness} initialView={treasuryView} />}
            {activeTab === 'admin' && isAdmin && (
              <AdminTab
                currentUserId={user?.id ?? ""}
                inviteCode={lances.currentLance?.invite_code ?? null}
                adminInviteCode={(lances.currentLance as unknown as Record<string, unknown>)?.admin_invite_code as string | null ?? null}
                onRegenerateInviteCode={() => lances.regenerateInviteCode(lances.currentLanceId ?? "")}
                onRegenerateAdminInviteCode={() => lances.regenerateAdminInviteCode(lances.currentLanceId ?? "")}
                onClearAdminInviteCode={() => lances.clearAdminInviteCode(lances.currentLanceId ?? "")}
                onDeleteMember={lance.deleteMember}
                onViewMember={setSelectedMember}
                canManageFunction={perms.canManageFunction}
              />
            )}
          </>
        )}
      </div></main>


      {/* Mobile bottom navigation */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur-xl border-t border-gold-500/15 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(t.id);
                setSelectedMember(null);
                if (t.id !== 'houses') setActiveHouse(null);
                if (navigator.vibrate) navigator.vibrate(8);
              }}
              className={cx(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors',
                isActive ? 'text-gold-300' : 'text-ink-300'
              )}
            >
              <t.Icon size={18} />
              <span className="text-[9px] font-medium tracking-wide uppercase">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {showAddHouse && (
        <AddHouseModal
          onClose={() => setShowAddHouse(false)}
          onSave={async house => {
            await lance.upsertHouse(house);
            setShowAddHouse(false);
            setActiveTab('houses');
            setActiveHouse(null);
          }}
        />
      )}
      {showAddPerson && (
        <AddPersonModal
          data={lance.data}
          onClose={() => setShowAddPerson(false)}
          onSave={async member => {
            await lance.upsertMember({ claimed_by: user?.id ?? null, ...member });
            setShowAddPerson(false);
          }}
        />
      )}
      {showCreateCharacter && user && (
        <div className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm overflow-y-auto">
          <CreateCharacterScreen
            userId={user.id}
            lanceId={lances.currentLanceId ?? ""}
            onCreated={async member => {
              await Promise.all([lances.reloadMemberships(), lance.reload(true)]);
              setShowCreateCharacter(false);
              setSelectedMember(member);
              setActiveTab('overview');
            }}
            onClose={() => setShowCreateCharacter(false)}
          />
        </div>
      )}
      {ConfirmDialog}
      {showTour && profile?.id && (
        <WalkThrough
          profileId={profile.id}
          lanceName={lance.settings?.name}
          onDone={() => setShowTour(false)}
        />
      )}
    </div>
    </LanceProvider>
  );
}

function ErrorBanner({ error }: { error: string }) {
  return (
    <div className="text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm">
      <strong className="font-semibold">Failed to load:</strong> {error}
      <div className="text-xs text-red-200/80 mt-1">
        Check that <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are set and the schema has been applied.
      </div>
    </div>
  );
}
