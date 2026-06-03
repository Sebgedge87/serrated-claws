import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanceData } from '@/hooks/useLanceData';
import { useLances } from '@/hooks/useLances';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/hooks/useTheme';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { HeaderUserMenu } from '@/components/HeaderUserMenu';
import { LanceGate } from '@/components/LanceGate';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { HouseTab } from '@/components/tabs/HouseTab';
import { CovensTab } from '@/tabs/CovensTab';
import { FunctionsTab } from '@/tabs/FunctionsTab';
import { BusinessesTab } from '@/tabs/BusinessesTab';
import { InventoryTab } from '@/tabs/InventoryTab';
import { AdminTab } from '@/tabs/AdminTab';
import { BankTab } from '@/tabs/BankTab';
import { BardTab } from '@/tabs/BardTab';
import { RosterTab } from '@/tabs/RosterTab';
import { AddHouseModal } from '@/components/modals/AddHouseModal';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { CharacterSheetPage } from '@/components/CharacterSheetPage';
import { CreateCharacterScreen } from '@/components/CreateCharacterScreen';
import { cx, monogramOf } from '@/lib/utils';
import type { Member } from '@/lib/types';

const WIKI_URL = 'https://www.profounddecisions.co.uk/empire-wiki/Skills';

type TabId = 'overview' | 'roster' | 'covens' | 'functions' | 'businesses' | 'inventory' | 'treasury' | 'admin' | 'bards' | string;

export function Layout() {
  const { user, profile, signOut } = useAuth();
  const lances = useLances(user?.id ?? null);
  const lance = useLanceData(lances.currentLanceId);
  const perms = usePermissions(lances.currentMembership, lance.data);
  const isAdmin = lances.currentMembership?.role === 'admin' || lances.currentMembership?.role === 'super_admin' || profile?.role === 'super_admin';
  const currentMember = lance.data.members.find(m => m.id === (profile?.member_id ?? null));
  const bardFunctionIds = new Set(lance.data.functions.filter(f => f.name.toLowerCase().includes('bard')).map(f => f.id));
  const isBard = !!currentMember?.function && bardFunctionIds.has(currentMember.function);
  const canAccessBards = isAdmin || isBard;
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [search, setSearch] = useState('');
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const { Dialog: ConfirmDialog } = useConfirm();
  const { theme, toggleTheme } = useTheme();


  type TabDef = {
    id: string;
    label: string;
    Icon: typeof Icons.House;
    /** house primary_color, drives both monogram tile and active underline */
    color?: string;
    /** 2-letter house monogram (renders instead of an icon when set) */
    monogram?: string;
    /** renders a thin vertical divider before this tab to separate clusters */
    separator?: boolean;
  };
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview', Icon: Icons.House },
    { id: 'roster', label: 'Roster', Icon: Icons.Users },
    ...lance.data.houses.map(h => ({
      id: h.id,
      label: h.name.replace('House ', ''),
      Icon: Icons.Shield,
      color: h.primary_color,
      monogram: monogramOf(h.name),
    })),
    { id: 'covens', label: 'Covens', Icon: Icons.Sparkles },
    { id: 'functions', label: 'Functions', Icon: Icons.Swords },
    { id: 'businesses', label: 'Businesses', Icon: Icons.Briefcase },
    { id: 'inventory', label: 'Inventory', Icon: Icons.Package, separator: true },
    { id: 'treasury', label: 'Treasury', Icon: Icons.Coins, separator: true },
    ...(canAccessBards ? [{ id: 'bards', label: 'Bards', Icon: Icons.Feather } as TabDef] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', Icon: Icons.Shield } as TabDef] : [])
  ];

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
    lines.push(['TREASURY', 'Rings', 'Crowns', 'Thrones', 'Total (rings)'].map(q).join(','));
    lines.push(['' , rings, crowns, thrones, totalRings].map(q).join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `serrated-claws-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const activeHouse = lance.data.houses.find(h => h.id === activeTab);

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-gold-500/15 bg-gradient-to-br from-ink-900/95 to-ink-800/95">
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
              <h1 className="text-4xl font-display font-bold m-0 text-gold-300 select-none">
                {lance.settings?.name ?? lances.currentLance?.name ?? 'The Serrated Claws'}
              </h1>
              <p className="text-xs uppercase tracking-[0.15em] text-ink-100/50 mt-1">Lance Management System</p>
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
              onNavigate={id => { setActiveTab(id); setSelectedMember(null); }}
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
        <div className="relative flex-1 min-w-[160px]">
          <Icons.Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-100/40 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members, ranks, functions…"
            className="input pl-11"
          />
        </div>
        {/* Button group — wraps as a unit so nothing strands on its own row */}
        <div className="flex gap-2 items-center flex-shrink-0">
          {isAdmin && (
            <>
              <button onClick={() => setShowAddPerson(true)} className="btn btn-primary" title="Add person">
                <Icons.Users size={16} />
                <span className="hidden sm:inline">Add Person</span>
              </button>
              <button onClick={() => setShowAddHouse(true)} className="btn btn-secondary" title="Add house">
                <Icons.Shield size={16} />
                <span className="hidden sm:inline">House</span>
              </button>
            </>
          )}
          <button onClick={exportCsv} className="btn btn-ghost" title="Export CSV">
            <Icons.Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div></div>

      {/* Tabs */}
      <nav className="bg-ink-950/50 backdrop-blur border-b border-gold-500/15">
        <div className="relative px-2 sm:px-4">
          <div className="flex overflow-x-auto scrollbar-hide pr-4" role="tablist" ref={(el) => { if (el) { const active = el.querySelector('[aria-selected="true"]') as HTMLElement; if (active) active.scrollIntoView({ inline: 'nearest', block: 'nearest' }); } }}>
            {tabs.flatMap(t => {
              const isActive = activeTab === t.id;
              const accent = t.color ?? 'rgb(212,180,109)'; // gold-300 fallback
              const btn = (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  title={t.label}
                  onClick={() => { setActiveTab(t.id); setSelectedMember(null); }}
                  className={cx('tab-btn', isActive && 'active')}
                  /* House-coloured underline/text when the tab is a house and active */
                  style={isActive && t.color
                    ? { color: t.color, borderBottomColor: t.color }
                    : undefined}
                >
                  {t.monogram ? (
                    <span
                      aria-hidden="true"
                      className="font-display font-bold text-[10px] grid place-items-center rounded w-5 h-5 flex-shrink-0"
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
              if (!t.separator) return [btn];
              return [
                <div key={`sep-${t.id}`} className="flex-shrink-0 w-px my-3 mx-1 bg-gold-500/20 self-stretch" />,
                btn,
              ];
            })}
          </div>
          {/* Right-edge fade to signal scrollable content */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12"
            style={{ background: 'linear-gradient(to right, transparent, var(--color-ink-950, #0a0a0f))' }}
          />
        </div>
      </nav>

      {/* Content */}
      <main className="py-8 sm:py-10 animate-fade-in">
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
            canEdit={isAdmin || currentMembership?.member_id === liveMember.id}
            isOwn={currentMembership?.member_id === liveMember.id}
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
          />
          );
        })()}

        {!lance.loading && !lance.error && !selectedMember && (
          <>
            {activeTab === 'overview' && <OverviewTab data={lance.data} filteredMembers={lance.data.members} isAdmin={isAdmin} onNavigate={setActiveTab} />}
            {activeTab === 'roster' && <RosterTab data={lance.data} isAdmin={isAdmin} onViewMember={setSelectedMember} />}
            {activeHouse && (
              <HouseTab
                house={activeHouse}
                data={lance.data}
                search={search}
                isAdmin={isAdmin}
                onUpsert={lance.upsertMember}
                onUnassign={lance.unassignMember}
                onDelete={lance.deleteMember}
                onDeleteHouse={async () => { await lance.deleteHouse(activeHouse.id); setActiveTab('overview'); }}
                onUpsertCharInventory={lance.upsertCharInventory}
                onDeleteCharInventory={lance.deleteCharInventory}
                onUpsertSkill={lance.upsertCharacterSkill}
                onDeleteSkill={lance.deleteCharacterSkill}
                onUpsertRitual={lance.upsertCharacterRitual}
                onDeleteRitual={lance.deleteCharacterRitual}
                onViewMember={setSelectedMember}
                {...(canAccessBards ? {
                  lanceId: lances.currentLanceId ?? '',
                  currentMemberIdForBard: profile?.member_id ?? null,
                  onUpsertBardWork: lance.upsertBardWork,
                  onDeleteBardWork: lance.deleteBardWork,
                } : {})}
              />
            )}
            {activeTab === 'covens' && <CovensTab data={lance.data} isAdmin={isAdmin} canManageCoven={perms.canManageCoven} onUpsert={lance.upsertCoven} onDelete={lance.deleteCoven} onUpsertRitual={lance.upsertCovenRitual} onDeleteRitual={lance.deleteCovenRitual} />}
            {activeTab === 'functions' && <FunctionsTab data={lance.data} isAdmin={isAdmin} canManageFunction={perms.canManageFunction} onUpsert={lance.upsertFunction} onDelete={lance.deleteFunction} />}
            {activeTab === 'businesses' && <BusinessesTab data={lance.data} isAdmin={isAdmin} canManageBusiness={perms.canManageBusiness} onUpsert={lance.upsertBusiness} onDelete={lance.deleteBusiness} />}
            {activeTab === 'inventory' && (
              <InventoryTab
                data={lance.data}
                isAdmin={isAdmin}
                onSetInventory={lance.setInventory}
                onSetInventoryPrice={lance.setInventoryPrice}
                onLogInventory={lance.logInventory}
                onUpsertStock={lance.upsertMagicItemStock}
                onDeleteStock={lance.deleteMagicItemStock}
                onUpsertQueue={lance.upsertCraftingQueueItem}
                onDeleteQueue={lance.deleteCraftingQueueItem}
              />
            )}
            {activeTab === 'treasury' && (
              <BankTab
                data={lance.data}
                isAdmin={isAdmin}
                onUpsertInventory={lance.setInventory}
              />
            )}
            {activeTab === 'bards' && (
              <BardTab
                data={lance.data}
                lanceId={lances.currentLanceId ?? ''}
                currentMemberId={profile?.member_id ?? null}
                isAdmin={isAdmin}
                onUpsert={lance.upsertBardWork}
                onDelete={lance.deleteBardWork}
              />
            )}
            {activeTab === 'admin' && isAdmin && (
              <AdminTab
                data={lance.data}
                memberships={lance.memberships}
                settings={lance.settings}
                currentUserId={user!.id}
                inviteCode={lances.currentLance?.invite_code ?? null}
                onUpdateProfile={lance.upsertProfile}
                onUpsertSettings={lance.upsertSettings}
                onResetInventoryQty={lance.resetInventoryQty}
                onClearInventoryLog={lance.clearInventoryLog}
                onUpsertEvent={lance.upsertEvent}
                onDeleteEvent={lance.deleteEvent}
                onClearAttending={lance.clearAttending}
                onRegenerateInviteCode={() => lances.regenerateInviteCode(lances.currentLanceId!)}
                onDeleteMember={lance.deleteMember}
                onViewMember={setSelectedMember}
              />
            )}
          </>
        )}
      </div></main>

      {/* Mobile-only FAB for adding a person. Hidden on ≥ sm where the
          action bar carries the button directly. */}
      {isAdmin && (
        <button
          onClick={() => setShowAddPerson(true)}
          className="sm:hidden fixed bottom-5 right-5 w-14 h-14 rounded-full grid place-items-center z-40 text-ink-900"
          style={{
            background: 'linear-gradient(180deg, #d4b46d, #b8954c)',
            boxShadow: '0 12px 30px -8px rgba(201,169,97,0.55), 0 1px 0 rgba(255,255,255,0.3) inset',
          }}
          aria-label="Add person"
        >
          <Icons.Plus size={26} />
        </button>
      )}

      {showAddHouse && (
        <AddHouseModal
          onClose={() => setShowAddHouse(false)}
          onSave={async house => {
            await lance.upsertHouse(house);
            setShowAddHouse(false);
            setActiveTab(house.id);
          }}
        />
      )}
      {showAddPerson && (
        <AddPersonModal
          data={lance.data}
          onClose={() => setShowAddPerson(false)}
          onSave={async member => {
            await lance.upsertMember(member);
            setShowAddPerson(false);
          }}
        />
      )}
      {showCreateCharacter && user && (
        <div className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm overflow-y-auto">
          <CreateCharacterScreen
            userId={user.id}
            lanceId={lances.currentLanceId!}
            onCreated={() => window.location.reload()}
            onClose={() => setShowCreateCharacter(false)}
          />
        </div>
      )}
      {ConfirmDialog}
    </div>
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
