import { useState, useEffect } from 'react';
import type { LanceData, LanceEvent, LanceMembership, LanceSettings, Member, UserRole } from '@/lib/types';
import { useConfirm } from '@/components/ConfirmDialog';
import { Icons } from '@/components/Icons';
import { MemberCard } from '@/components/MemberCard';
import { exportRosterPdf, exportResourcesPdf } from '@/lib/parchmentPdf';
import { useLance } from '@/contexts/LanceContext';
import { NATIONS, nationConfig, type Nation } from '@/lib/nations';
import { FunctionsTab } from '@/tabs/FunctionsTab';

interface Props {
  currentUserId: string;
  inviteCode: string | null;
  onRegenerateInviteCode: () => Promise<string>;
  onDeleteMember?: (id: string) => Promise<void>;
  onViewMember?: (m: Member) => void;
  canManageFunction: (id: string) => boolean;
}

const A = '#d4b46d';
export const ROLE_COLORS: Record<UserRole, string> = { super_admin: '#f0a040', admin: '#d4b46d', support: '#a78bfa', member: '#7eb0d4', viewer: '#9ca3af' };

export function AdminTab({ currentUserId, inviteCode, onRegenerateInviteCode, onDeleteMember, onViewMember, canManageFunction }: Props) {
  const { data, memberships, settings, isAdmin: _isAdmin, upsertSettings: onUpsertSettings, resetInventoryQty: onResetInventoryQty, clearInventoryLog: onClearInventoryLog, upsertEvent: onUpsertEvent, deleteEvent: onDeleteEvent, clearAttending: onClearAttending, resetAllPlayerData: onResetAllPlayerData, upsertProfile: onUpsertProfile } = useLance();
  const currentRole = memberships.find(m => m.profile_id === currentUserId)?.role ?? 'admin';
  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
          <Icons.Shield size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Admin</h2>
          <p className="text-sm text-ink-100/60 m-0">
            Settings, access control, and lance management
            {isSuperAdmin && <span className="ml-2 text-[10px] uppercase tracking-widest text-orange-300/70">(Super Admin)</span>}
          </p>
        </div>
      </div>

      {/* 1. Settings + Join Code — top, two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <SettingsSection settings={settings} onSave={onUpsertSettings} />
        <InviteCodeSection inviteCode={inviteCode} currentRole={currentRole} onRegenerateInviteCode={onRegenerateInviteCode} />
      </div>

      {/* 2. Events */}
      <EventsSection events={data.events} data={data} onUpsert={onUpsertEvent} onDelete={onDeleteEvent} onClearAttending={onClearAttending} />

      {/* 3. Roles & Access */}
      {isSuperAdmin && <RolesSection memberships={memberships} currentUserId={currentUserId} onUpsertProfile={onUpsertProfile} />}

      {/* 4. Unassigned members */}
      <UnassignedSection data={data} isAdmin onDelete={onDeleteMember} onViewMember={onViewMember} />

      {/* 5. Functions — a-z */}
      <section>
        <SectionHeading icon={<Icons.Swords size={16} />} title="Functions" />
        <FunctionsTab canManageFunction={canManageFunction} sortAlpha />
      </section>

      {/* 6. Export */}
      {isSuperAdmin && <ExportSection data={data} memberships={memberships} />}

      {/* 7. Danger Zone */}
      {isSuperAdmin && <DangerZone onResetInventoryQty={onResetInventoryQty} onClearInventoryLog={onClearInventoryLog} logCount={data.inventoryLog.length} onResetAllPlayerData={onResetAllPlayerData} />}
    </div>
  );
}

// ── Unassigned Members ────────────────────────────────────────────────────────

function UnassignedSection({ data, isAdmin, onDelete, onViewMember }: { data: LanceData; isAdmin: boolean; onDelete?: (id: string) => Promise<void>; onViewMember?: (m: Member) => void }) {
  const unassigned = data.members.filter(m => !m.house_id);
  if (unassigned.length === 0) return null;
  return (
    <section>
      <SectionHeading icon={<Icons.Question size={16} />} title={`Unassigned Members · ${unassigned.length}`} color="#9ca3af" />
      <div className="grid sm:grid-cols-2 gap-3.5">
        {unassigned.map(m => (
          <MemberCard key={m.id} member={m} isAdmin={isAdmin} covens={data.covens} functions={data.functions} onDelete={onDelete} onViewSheet={onViewMember} />
        ))}
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

// ── Events ────────────────────────────────────────────────────────────────────

function EventsSection({ events, data, onUpsert, onDelete, onClearAttending }: { events: LanceEvent[]; data: LanceData; onUpsert: (ev: Partial<LanceEvent> & { name: string; start_date: string }) => Promise<void>; onDelete: (id: string) => Promise<void>; onClearAttending: () => Promise<void> }) {
  const [editing, setEditing] = useState<Partial<LanceEvent> | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendingMembers = data.members.filter(m => m.attending_event === true);
  const nextEvent = [...events]
    .filter(ev => !ev.cleared)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .find(ev => new Date(ev.start_date) >= today);

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  function exportRoster() { exportRosterPdf(data, nextEvent); }
  function exportResources() { exportResourcesPdf(data); }

  return (
    <section>
      <SectionHeading icon={<Icons.Scroll size={16} />} title="Events" />
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-ink-100/60">{attendingMembers.length} member{attendingMembers.length !== 1 ? 's' : ''} attending next event</span>
        {attendingMembers.length > 0 && <>
          <button onClick={exportRoster} className="btn btn-secondary btn-sm">
            <Icons.Download size={14} /> Export Roster
          </button>
          <button onClick={async () => { if (await confirm({ title: 'Clear all attending?', body: 'Sets attending_event = false for all members.', danger: false, confirmLabel: 'Clear' })) await onClearAttending(); }} className="btn btn-ghost btn-sm">
            <Icons.Question size={14} /> Clear Attending
          </button>
        </>}
        <button onClick={exportResources} className="btn btn-ghost btn-sm">
          <Icons.Download size={14} /> Export Resources
        </button>
        <button onClick={() => setEditing({ name: '', start_date: '', end_date: null, sort_order: events.length })} className="btn btn-secondary btn-sm">
          <Icons.Plus size={14} /> Add Event
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {events.map(ev => {
          const start = new Date(ev.start_date); start.setHours(12);
          const clearAfter = new Date(ev.end_date ?? ev.start_date); clearAfter.setDate(clearAfter.getDate() + 1); clearAfter.setHours(0);
          const isPast = today >= clearAfter;
          const isActive = !isPast && today >= start;
          return (
            <div key={ev.id} className="card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-ink-100">{ev.name}</div>
                <div className="text-xs text-ink-100/50 mt-0.5">
                  {fmtDate(ev.start_date)}{ev.end_date ? ` – ${fmtDate(ev.end_date)}` : ''}
                  {isActive && <span className="ml-2 text-gold-300 font-semibold">Active</span>}
                  {isPast && <span className="ml-2 text-ink-100/30">(past{ev.cleared ? ', cleared' : ''})</span>}
                </div>
              </div>
              <button onClick={() => setEditing(ev)} className="btn btn-ghost btn-sm"><Icons.Edit size={13} /></button>
            </div>
          );
        })}
        {events.length === 0 && <p className="text-sm text-ink-100/40 col-span-full">No events yet.</p>}
      </div>
      {editing !== null && (
        <EventModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async ev => { await onUpsert(ev); setEditing(null); }}
          onDelete={editing.id ? async () => { await onDelete(editing.id!); setEditing(null); } : undefined}
        />
      )}
      {ConfirmDialog}
    </section>
  );
}

function EventModal({ initial, onClose, onSave, onDelete }: { initial: Partial<LanceEvent>; onClose: () => void; onSave: (ev: Partial<LanceEvent> & { name: string; start_date: string }) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [name, setName] = useState(initial.name ?? '');
  const [startDate, setStartDate] = useState(initial.start_date ? initial.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initial.end_date ? initial.end_date.slice(0, 10) : '');
  const [order, setOrder] = useState(initial.sort_order ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  async function save() {
    if (!name.trim() || !startDate || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onSave({ ...initial, name: name.trim(), start_date: startDate, end_date: endDate || null, sort_order: order });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save event');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold text-lg text-gold-300">{initial.id ? 'Edit Event' : 'New Event'}</h3>
        {err && <p className="text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">{err}</p>}
        <div>
          <label className="block text-xs text-ink-100/50 uppercase tracking-widest mb-1">Name</label>
          <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="E1 — Spring Gathering" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-100/50 uppercase tracking-widest mb-1">Start Date</label>
            <input type="date" className="input w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-100/50 uppercase tracking-widest mb-1">End Date</label>
            <input type="date" className="input w-full" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-100/50 uppercase tracking-widest mb-1">Sort Order</label>
          <input type="number" className="input w-full" value={order} onChange={e => setOrder(parseInt(e.target.value, 10) || 0)} />
        </div>
        <div className="flex justify-between pt-2">
          {onDelete ? (
            <button onClick={async () => { if (await confirm({ title: 'Delete this event?', danger: true })) await onDelete(); }} className="btn btn-danger btn-sm">Delete</button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={save} disabled={!name.trim() || !startDate || busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
    {ConfirmDialog}
    </>
  );
}

const SETTINGS_SQL = `-- Run this once in your Supabase SQL editor:
create table public.lance_settings (
  id text primary key default 'default',
  name text not null default 'Empire LARP',
  motto text,
  description text
);
insert into public.lance_settings (id) values ('default') on conflict do nothing;
alter table public.lance_settings enable row level security;
create policy settings_read on public.lance_settings for select using (auth.role() = 'authenticated');
create policy settings_admin_write on public.lance_settings for all using (public.is_admin()) with check (public.is_admin());`;

function SettingsSection({ settings, onSave }: { settings: LanceSettings | null; onSave: (updates: Partial<Omit<LanceSettings, 'id'>>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: settings?.name ?? '',
    motto: settings?.motto ?? '',
    description: settings?.description ?? '',
    nation: (settings?.nation ?? 'Dawn') as Nation,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm({
      name: settings.name ?? '',
      motto: settings.motto ?? '',
      description: settings.description ?? '',
      nation: (settings.nation ?? 'Dawn') as Nation,
    });
  }, [settings?.id]);

  const cfg = nationConfig(form.nation);

  async function save() {
    if (!form.name.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({ name: form.name.trim(), motto: form.motto || null, description: form.description || null, nation: form.nation });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Edit size={16} />} title="Settings" />
      {settings === null ? (
        <div className="card p-5">
          <p className="text-sm text-ink-100/60 mb-3">The <code className="text-gold-300 bg-black/30 px-1 rounded">lance_settings</code> table hasn't been created yet. Run this SQL in your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-gold-300 underline">Supabase SQL editor</a>:</p>
          <pre className="bg-black/50 border border-gold-500/15 rounded-lg p-4 text-xs text-ink-100/80 overflow-x-auto whitespace-pre">{SETTINGS_SQL}</pre>
          <p className="text-xs text-ink-100/50 mt-3">After running, reload the page and this form will appear.</p>
        </div>
      ) : (
        <div className="card p-6 space-y-5 max-w-xl">
          {/* Nation */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-2">Nation</label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {NATIONS.map(n => {
                const active = form.nation === n.nation;
                return (
                  <button
                    key={n.nation}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, nation: n.nation as Nation }))}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all"
                    style={{
                      background: active ? `${n.colors[0]}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? n.colors[0] + '80' : 'rgba(201,169,97,0.12)'}`,
                      color: active ? n.colors[0] : 'rgb(var(--ink-300))',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{n.icon}</span>
                    <span className="truncate">{n.nation}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-100/40">
              Changes the app terminology — {cfg.groupTermPlural.toLowerCase()}, {cfg.memberTerm.toLowerCase()}s, colours.
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">
              {cfg.groupTermPlural === 'Houses' ? 'Lance' : cfg.groupTermPlural === 'Legions' ? 'Legion' : cfg.groupTerm} Name
            </label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Empire LARP" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">Motto <span className="normal-case font-normal text-ink-100/40">(optional)</span></label>
            <input className="input" value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} placeholder="Your motto…" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">Description <span className="normal-case font-normal text-ink-100/40">(optional)</span></label>
            <textarea rows={2} className="input resize-y" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A short description…" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={busy || !form.name.trim()} className="btn btn-primary">
              {busy ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
            </button>
            {saved && <span className="text-xs text-green-400">Changes saved</span>}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

// ── Invite Code ───────────────────────────────────────────────────────────────

function InviteCodeSection({ inviteCode, currentRole, onRegenerateInviteCode }: { inviteCode: string | null; currentRole: UserRole; onRegenerateInviteCode: () => Promise<string> }) {
  const [localCode, setLocalCode] = useState<string | null>(inviteCode);
  const [regenBusy, setRegenBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayCode = localCode ?? inviteCode;

  async function handleRegen() {
    setRegenBusy(true);
    try { const c = await onRegenerateInviteCode(); setLocalCode(c); } finally { setRegenBusy(false); }
  }

  function handleCopy() {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Copy size={16} />} title="Join Code" />
      <div className="card p-5 flex items-center gap-4 flex-wrap" style={{ borderLeft: `3px solid ${A}` }}>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-2xl font-bold tracking-widest text-ink-100 select-all mb-1">
            {displayCode ?? '—'}
          </div>
          <div className="text-xs text-ink-100/50">Share this code with new members so they can join from the "Get Started" screen.</div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleCopy} className="btn btn-ghost btn-sm" disabled={!displayCode}>
            <Icons.Copy size={13} />{copied ? 'Copied!' : 'Copy'}
          </button>
          {(currentRole === 'super_admin' || currentRole === 'admin') && (
            <button onClick={handleRegen} disabled={regenBusy} className="btn btn-ghost btn-sm text-red-400/70 hover:text-red-400">
              <Icons.Refresh size={13} />{regenBusy ? 'Regenerating…' : 'Regenerate'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Roles & Access ────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full access including danger zone' },
  { value: 'admin',       label: 'Admin',       description: 'Manage members, events, settings' },
  { value: 'member',      label: 'Member',      description: 'View and edit own character' },
  { value: 'viewer',      label: 'Viewer',      description: 'Read-only access' },
];

function RolesSection({ memberships, currentUserId, onUpsertProfile }: {
  memberships: LanceMembership[];
  currentUserId: string;
  onUpsertProfile: (id: string, updates: { role?: UserRole }) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function changeRole(profileId: string, role: UserRole) {
    setBusy(profileId);
    try { await onUpsertProfile(profileId, { role }); } finally { setBusy(null); }
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Shield size={16} />} title="Roles & Access" />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gold-500/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-ink-100/60">User</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-ink-100/60">Role</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m, i) => {
              const profile = m.profile as { id: string; email?: string; display_name?: string } | null;
              const label = profile?.display_name || profile?.email || m.profile_id;
              const isMe = m.profile_id === currentUserId;
              const color = ROLE_COLORS[m.role];
              return (
                <tr key={m.profile_id} className={i > 0 ? 'border-t border-gold-500/10' : ''}>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-100 font-medium">{label}{isMe && <span className="ml-2 text-[10px] text-ink-100/40">(you)</span>}</div>
                    {profile?.email && profile.display_name && <div className="text-xs text-ink-100/40">{profile.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>{m.role.replace('_', ' ')}</span>
                    ) : (
                      <select
                        value={m.role}
                        disabled={!!busy}
                        onChange={e => changeRole(m.profile_id, e.target.value as UserRole)}
                        className="text-sm rounded px-2 py-1 border border-ink-100/15 bg-ink-800 text-ink-100 disabled:opacity-50"
                        style={{ color }}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExportSection({ data, memberships }: { data: LanceData; memberships: LanceMembership[] }) {
  const [busy, setBusy] = useState(false);

  function exportJson() {
    setBusy(true);
    try {
      const snapshot = {
        exported_at: new Date().toISOString(),
        members: data.members,
        houses: data.houses,
        covens: data.covens,
        functions: data.functions,
        businesses: data.businesses,
        inventory: data.inventory,
        inventoryLog: data.inventoryLog,
        events: data.events,
        characterInventory: data.characterInventory,
        characterSkills: data.characterSkills,
        characterSpells: data.characterSpells,
        characterRituals: data.characterRituals,
        magicItemsStock: data.magicItemsStock,
        craftingQueue: data.craftingQueue,
        covenRituals: data.covenRituals,
        bardWorks: data.bardWorks,
        memberships,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serrated-claws-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Download size={16} />} title="Backup" color="#7eb0d4" />
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink-100">Export lance data</div>
          <div className="text-sm text-ink-100/50 mt-0.5">
            Downloads a full JSON snapshot of all lance data — members, inventory, character sheets, events, and more.
          </div>
        </div>
        <button onClick={exportJson} disabled={busy} className="btn btn-secondary flex-shrink-0">
          <Icons.Download size={15} />
          {busy ? 'Exporting…' : 'Download JSON'}
        </button>
      </div>
    </section>
  );
}

// ── Danger Zone ───────────────────────────────────────────────────────────────

function DangerZone({ onResetInventoryQty, onClearInventoryLog, logCount, onResetAllPlayerData }: { onResetInventoryQty: () => Promise<void>; onClearInventoryLog: () => Promise<void>; logCount: number; onResetAllPlayerData: () => Promise<void> }) {
  return (
    <section>
      <SectionHeading icon={<Icons.Trash size={16} />} title="Danger Zone" color="#f87171" />
      <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5 space-y-5">
        <DangerAction
          title="Full reset — wipe all lance data"
          description="Deletes everything: members, houses, covens, groups, businesses, all character data, inventory, events, bard works, ritual scripts. Only user accounts and login access are preserved. Cannot be undone."
          confirmWord="WIPE"
          buttonLabel="Wipe All Data"
          onConfirm={onResetAllPlayerData}
        />
        <div className="border-t border-red-500/20" />
        <DangerAction
          title="Reset inventory quantities"
          description="Sets every item's current quantity to 0. The required quantities and catalogue are preserved."
          confirmWord="RESET"
          buttonLabel="Reset Quantities"
          onConfirm={onResetInventoryQty}
        />
        <div className="border-t border-red-500/20" />
        <DangerAction
          title={`Clear transaction log${logCount > 0 ? ` (${logCount} entries)` : ''}`}
          description="Permanently deletes all inventory transaction history. Cannot be undone."
          confirmWord="DELETE"
          buttonLabel="Clear Log"
          onConfirm={onClearInventoryLog}
          disabled={logCount === 0}
        />
      </div>
    </section>
  );
}

function DangerAction({ title, description, confirmWord, buttonLabel, onConfirm, disabled }: { title: string; description: string; confirmWord: string; buttonLabel: string; onConfirm: () => Promise<void>; disabled?: boolean }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = input === confirmWord;

  async function run() {
    if (!ready || busy) return;
    setBusy(true);
    try { await onConfirm(); setInput(''); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-red-300">{title}</div>
        <div className="text-sm text-ink-100/50 mt-0.5">{description}</div>
      </div>
      {!disabled && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Type ${confirmWord}`}
            className="w-28 px-2.5 py-1.5 bg-black/40 border border-red-500/30 rounded text-sm text-red-300 placeholder:text-ink-100/30"
          />
          <button onClick={run} disabled={!ready || busy} className="btn btn-danger btn-sm disabled:opacity-30">
            {busy ? 'Working…' : buttonLabel}
          </button>
        </div>
      )}
      {disabled && <span className="text-xs text-ink-100/40 flex-shrink-0 pt-1">Nothing to clear</span>}
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function SectionHeading({ icon, title, color = A }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span style={{ color }}>{icon}</span>
      <h3 className="text-xs uppercase tracking-widest font-bold m-0" style={{ color }}>{title}</h3>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </div>
  );
}

