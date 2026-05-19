import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanceData } from '@/hooks/useLanceData';
import { Icons } from '@/components/Icons';
import { OverviewTab } from '@/tabs/OverviewTab';
import { HouseTab } from '@/tabs/HouseTab';
import { UnassignedTab } from '@/tabs/UnassignedTab';
import { CovensTab } from '@/tabs/CovensTab';
import { FunctionsTab } from '@/tabs/FunctionsTab';
import { BusinessesTab } from '@/tabs/BusinessesTab';
import { InventoryTab } from '@/tabs/InventoryTab';
import { AdminTab } from '@/tabs/AdminTab';
import { AddHouseModal } from '@/components/modals/AddHouseModal';
import { AddPersonModal } from '@/components/modals/AddPersonModal';
import { cx } from '@/lib/utils';

type TabId = 'overview' | 'unassigned' | 'covens' | 'functions' | 'businesses' | 'inventory' | 'admin' | string;

export function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const lance = useLanceData();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [search, setSearch] = useState('');
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lance.data.members;
    return lance.data.members.filter(m =>
      [m.name, m.player_name, m.rank, m.function, m.military_function]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q))
    );
  }, [lance.data.members, search]);

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: Icons.House },
    ...lance.data.houses.map(h => ({ id: h.id, label: h.name.replace('House ', ''), Icon: Icons.Shield })),
    { id: 'unassigned', label: 'Unassigned', Icon: Icons.Question },
    { id: 'covens', label: 'Covens', Icon: Icons.Sparkles },
    { id: 'functions', label: 'Functions', Icon: Icons.Swords },
    { id: 'businesses', label: 'Businesses', Icon: Icons.Briefcase },
    { id: 'inventory', label: 'Inventory', Icon: Icons.Package },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', Icon: Icons.Shield }] : [])
  ];

  function exportCsv() {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines: string[] = [];

    // Members
    lines.push(['House', 'Name', 'Player', 'Rank', 'Function', 'Military Role', 'Noble', 'Status', 'Attending', 'HP', 'MP', 'Resource', 'Coin/Event', 'Coven', 'Notes'].map(q).join(','));
    lance.data.members.forEach(m => {
      const house = lance.data.houses.find(h => h.id === m.house_id)?.name ?? 'Unassigned';
      lines.push([house, m.name, m.player_name ?? '', m.rank ?? '', m.function ?? '', m.military_function ?? '', m.is_noble ? 'Y' : 'N', m.status, m.attending_event ? 'Y' : 'N', m.hp ?? '', m.mp ?? '', m.resource ?? '', m.coin_per_event ?? '', m.coven ?? '', m.notes ?? ''].map(q).join(','));
    });

    // Blank row + inventory header
    lines.push('');
    lines.push(['INVENTORY', 'Current Qty', 'Required Qty', 'Status'].map(q).join(','));
    lance.data.inventory.forEach(i => {
      const status = i.required_qty === 0 ? '' : i.current_qty >= i.required_qty ? 'OK' : `Short ${i.required_qty - i.current_qty}`;
      lines.push([i.item, i.current_qty, i.required_qty, status].map(q).join(','));
    });

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden px-12 py-8 border-b border-gold-500/15 bg-gradient-to-br from-ink-900/95 to-ink-800/95">
        <div
          className="absolute -top-10 -right-10 w-72 h-72 opacity-[0.04] pointer-events-none text-gold-300"
          style={{ background: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl text-ink-800 grid place-items-center" style={{ background: 'linear-gradient(135deg, #d4b46d 0%, #b8954c 100%)', boxShadow: '0 8px 24px -8px rgba(201,169,97,0.6), 0 1px 0 rgba(255,255,255,0.3) inset' }}>
              <Icons.Swords size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">
                {lance.settings?.name ?? 'The Serrated Claws'}
              </h1>
              <p className="text-xs uppercase tracking-[0.15em] text-ink-100/50 mt-1">Lance Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="text-right hidden sm:block">
                <div className="text-sm text-ink-100">{profile.display_name ?? user?.email}</div>
                <div className="text-[10px] uppercase tracking-widest text-gold-300/80">{profile.role}</div>
              </div>
            )}
            <button onClick={signOut} className="btn btn-ghost btn-sm">
              <Icons.LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Action bar */}
      <div className="sticky top-0 z-40 px-12 py-4 flex flex-wrap gap-3 items-center bg-ink-900/40 backdrop-blur-xl border-b border-gold-500/15">
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
              <Icons.Plus size={16} />
              Add Person
            </button>
            <button onClick={() => setShowAddHouse(true)} className="btn btn-secondary">
              <Icons.Plus size={16} />
              House
            </button>
            {activeHouse && (
              <button
                onClick={async () => {
                  if (confirm(`Delete ${activeHouse.name}? Members will be unassigned.`)) {
                    await lance.deleteHouse(activeHouse.id);
                    setActiveTab('overview');
                  }
                }}
                className="btn btn-danger"
              >
                <Icons.Trash size={16} />
                Delete House
              </button>
            )}
          </>
        )}
        <button onClick={exportCsv} className="btn btn-ghost">
          <Icons.Download size={16} />
          Export
        </button>
      </div>

      {/* Tabs */}
      <nav className="px-12 flex gap-0.5 overflow-x-auto bg-ink-950/50 backdrop-blur border-b border-gold-500/15">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cx('tab-btn', activeTab === t.id && 'active')}>
            <t.Icon size={16} />
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="px-12 py-10 animate-fade-in">
        {lance.loading && <div className="text-ink-100/60 text-center py-20">Loading roster…</div>}
        {lance.error && <ErrorBanner error={lance.error} />}

        {!lance.loading && !lance.error && (
          <>
            {activeTab === 'overview' && <OverviewTab data={lance.data} filteredMembers={filteredMembers} isAdmin={isAdmin} />}
            {activeHouse && <HouseTab house={activeHouse} data={lance.data} search={search} isAdmin={isAdmin} onUpsert={lance.upsertMember} onUnassign={lance.unassignMember} onDelete={lance.deleteMember} />}
            {activeTab === 'unassigned' && <UnassignedTab data={lance.data} isAdmin={isAdmin} onUpsert={lance.upsertMember} onDelete={lance.deleteMember} />}
            {activeTab === 'covens' && <CovensTab data={lance.data} isAdmin={isAdmin} onUpsert={lance.upsertCoven} onDelete={lance.deleteCoven} />}
            {activeTab === 'functions' && <FunctionsTab data={lance.data} isAdmin={isAdmin} onUpsert={lance.upsertFunction} onDelete={lance.deleteFunction} />}
            {activeTab === 'businesses' && <BusinessesTab data={lance.data} isAdmin={isAdmin} onUpsert={lance.upsertBusiness} onDelete={lance.deleteBusiness} />}
            {activeTab === 'inventory' && <InventoryTab data={lance.data} isAdmin={isAdmin} onSetInventory={lance.setInventory} onLogInventory={lance.logInventory} />}
            {activeTab === 'admin' && isAdmin && (
              <AdminTab
                data={lance.data}
                profiles={lance.profiles}
                settings={lance.settings}
                currentUserId={user!.id}
                onUpdateProfile={lance.upsertProfile}
                onUpsertSettings={lance.upsertSettings}
                onResetInventoryQty={lance.resetInventoryQty}
                onClearInventoryLog={lance.clearInventoryLog}
                onUpsertEvent={lance.upsertEvent}
                onDeleteEvent={lance.deleteEvent}
              />
            )}
          </>
        )}
      </main>

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
