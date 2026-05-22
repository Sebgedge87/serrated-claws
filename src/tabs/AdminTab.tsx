import { useState } from 'react';
import type { LanceData, LanceEvent, LanceMembership, LanceSettings, UserRole } from '@/lib/types';
import { useConfirm } from '@/components/ConfirmDialog';
import { Icons } from '@/components/Icons';
import { initials } from '@/lib/utils';
import { exportRosterPdf, exportResourcesPdf } from '@/lib/parchmentPdf';

interface Props {
  data: LanceData;
  memberships: LanceMembership[];
  settings: LanceSettings | null;
  currentUserId: string;
  inviteCode: string | null;
  onUpdateProfile: (id: string, updates: { role?: UserRole; member_id?: string | null; display_name?: string | null }) => Promise<void>;
  onUpsertSettings: (updates: { name?: string; motto?: string | null; description?: string | null }) => Promise<void>;
  onResetInventoryQty: () => Promise<void>;
  onClearInventoryLog: () => Promise<void>;
  onUpsertEvent: (ev: Partial<LanceEvent> & { name: string; start_date: string }) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onClearAttending: () => Promise<void>;
  onRegenerateInviteCode: () => Promise<string>;
}

const A = '#d4b46d';
const ROLE_COLORS: Record<UserRole, string> = { super_admin: '#f0a040', admin: '#d4b46d', member: '#7eb0d4', viewer: '#9ca3af' };

export function AdminTab({ data, memberships, settings, currentUserId, inviteCode, onUpdateProfile, onUpsertSettings, onResetInventoryQty, onClearInventoryLog, onUpsertEvent, onDeleteEvent, onClearAttending, onRegenerateInviteCode }: Props) {
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

      <StatsSection data={data} memberships={memberships} isSuperAdmin={isSuperAdmin} />
      <EventsSection events={data.events} data={data} onUpsert={onUpsertEvent} onDelete={onDeleteEvent} onClearAttending={onClearAttending} />
      <SettingsSection settings={settings} onSave={onUpsertSettings} />
      <RolesSection memberships={memberships} data={data} currentUserId={currentUserId} currentRole={currentRole} inviteCode={inviteCode} onUpdateProfile={onUpdateProfile} onRegenerateInviteCode={onRegenerateInviteCode} />
      {isSuperAdmin && <DangerZone onResetInventoryQty={onResetInventoryQty} onClearInventoryLog={onClearInventoryLog} logCount={data.inventoryLog.length} />}
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsSection({ data, memberships, isSuperAdmin }: { data: LanceData; memberships: LanceMembership[]; isSuperAdmin: boolean }) {
  const active = data.members.filter(m => m.status === 'active').length;
  const inactive = data.members.filter(m => m.status === 'inactive').length;
  const kia = data.members.filter(m => m.status === 'KIA').length;
  const shortfalls = data.inventory.filter(v => v.required_qty > v.current_qty).length;
  const superAdminCount = memberships.filter(m => m.role === 'super_admin').length;
  const adminCount = memberships.filter(m => m.role === 'admin').length;
  const memberCount = memberships.filter(m => m.role === 'member').length;
  const viewerCount = memberships.filter(m => m.role === 'viewer').length;
  const linkedActive = memberships.filter(m =>
    m.member_id && data.members.find(mem => mem.id === m.member_id && mem.status === 'active')
  ).length;

  const houseRows = data.houses.map(h => ({
    name: h.name,
    count: data.members.filter(m => m.house_id === h.id).length,
    color: h.primary_color
  }));
  const unassigned = data.members.filter(m => !m.house_id).length;

  return (
    <section>
      <SectionHeading icon={<Icons.House size={16} />} title="Overview" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-6">
        <StatCard label="Total Members" value={data.members.length} sub={`${active} active · ${inactive} inactive · ${kia} KIA`} color={A} />
        <StatCard label="Houses" value={data.houses.length} sub={`${unassigned} unassigned member${unassigned !== 1 ? 's' : ''}`} color="#7eb0d4" />
        <StatCard label="User Accounts" value={memberships.length}
          sub={isSuperAdmin
            ? `${linkedActive} active · ${superAdminCount > 0 ? `${superAdminCount} super · ` : ''}${adminCount} admin · ${memberCount} member · ${viewerCount} viewer`
            : `${adminCount} admin · ${memberCount} member · ${viewerCount} viewer`}
          color="#b56eb5" />
        <StatCard label="Inventory" value={data.inventory.filter(v => v.current_qty > 0).length + ' held'} sub={shortfalls > 0 ? `${shortfalls} shortfall${shortfalls !== 1 ? 's' : ''}` : 'No shortfalls'} color={shortfalls > 0 ? '#f87171' : '#6dd47e'} />
      </div>

      {houseRows.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gold-500/10">
              <tr>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">House</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-right text-ink-100">Members</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100 w-48">Share</th>
              </tr>
            </thead>
            <tbody>
              {houseRows.map((h, i) => (
                <tr key={h.name} className={i > 0 ? 'border-t border-gold-500/10' : ''}>
                  <td className="px-4 py-2.5 font-semibold text-sm">{h.name}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-sm">{h.count}</td>
                  <td className="px-4 py-2.5">
                    <div className="h-2 rounded-full overflow-hidden bg-black/30 w-40">
                      <div className="h-full rounded-full" style={{ width: `${data.members.length ? (h.count / data.members.length) * 100 : 0}%`, background: h.color || A }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="card p-5" style={{ borderTop: `2px solid ${color}50` }}>
      <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-1">{label}</div>
      <div className="text-3xl font-display font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs text-ink-100/50">{sub}</div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

// ── Events ────────────────────────────────────────────────────────────────────

function EventsSection({ events, data, onUpsert, onDelete, onClearAttending }: { events: LanceEvent[]; data: LanceData; onUpsert: Props['onUpsertEvent']; onDelete: Props['onDeleteEvent']; onClearAttending: Props['onClearAttending'] }) {
  const [editing, setEditing] = useState<Partial<LanceEvent> | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirm();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendingMembers = data.members.filter(m => m.attending_event);
  const nextEvent = events.find(ev => !ev.cleared);

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  function exportRoster() { exportRosterPdf(data, nextEvent); }
  function exportResources() { exportResourcesPdf(data); }

  return (
    <section>
      <SectionHeading icon={<Icons.Package size={16} />} title="Events" />
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
  const { confirm, Dialog: ConfirmDialog } = useConfirm();

  async function save() {
    if (!name.trim() || !startDate || busy) return;
    setBusy(true);
    try { await onSave({ ...initial, name: name.trim(), start_date: startDate, end_date: endDate || null, sort_order: order }); } finally { setBusy(false); }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold text-lg text-gold-300">{initial.id ? 'Edit Event' : 'New Event'}</h3>
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
  name text not null default 'The Serrated Claws',
  motto text,
  description text
);
insert into public.lance_settings (id) values ('default') on conflict do nothing;
alter table public.lance_settings enable row level security;
create policy settings_read on public.lance_settings for select using (auth.role() = 'authenticated');
create policy settings_admin_write on public.lance_settings for all using (public.is_admin()) with check (public.is_admin());`;

function SettingsSection({ settings, onSave }: { settings: LanceSettings | null; onSave: Props['onUpsertSettings'] }) {
  const [form, setForm] = useState({ name: settings?.name ?? '', motto: settings?.motto ?? '', description: settings?.description ?? '' });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!form.name.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({ name: form.name.trim(), motto: form.motto || null, description: form.description || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Edit size={16} />} title="Lance Settings" />
      {settings === null ? (
        <div className="card p-5">
          <p className="text-sm text-ink-100/60 mb-3">The <code className="text-gold-300 bg-black/30 px-1 rounded">lance_settings</code> table hasn't been created yet. Run this SQL in your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-gold-300 underline">Supabase SQL editor</a>:</p>
          <pre className="bg-black/50 border border-gold-500/15 rounded-lg p-4 text-xs text-ink-100/80 overflow-x-auto whitespace-pre">{SETTINGS_SQL}</pre>
          <p className="text-xs text-ink-100/50 mt-3">After running, reload the page and this form will appear.</p>
        </div>
      ) : (
        <div className="card p-6 space-y-4 max-w-xl">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">Lance Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="The Serrated Claws" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">Motto <span className="normal-case font-normal text-ink-100/40">(optional)</span></label>
            <input className="input" value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} placeholder="Your lance motto…" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-100/50 font-semibold mb-1.5">Description <span className="normal-case font-normal text-ink-100/40">(optional)</span></label>
            <textarea rows={2} className="input resize-y" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A short description of the lance…" />
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

function RolesSection({ memberships, data, currentUserId, currentRole, inviteCode, onUpdateProfile, onRegenerateInviteCode }: { memberships: LanceMembership[]; data: LanceData; currentUserId: string; currentRole: UserRole; inviteCode: string | null; onUpdateProfile: Props['onUpdateProfile']; onRegenerateInviteCode: Props['onRegenerateInviteCode'] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [localCode, setLocalCode] = useState<string | null>(inviteCode);
  const [regenBusy, setRegenBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSuperAdmin = currentRole === 'super_admin';
  const adminCount = memberships.filter(m => m.role === 'admin' || m.role === 'super_admin').length;
  const availableRoles: UserRole[] = isSuperAdmin ? ['super_admin', 'admin', 'member', 'viewer'] : ['admin', 'member', 'viewer'];
  const claimedMemberIds = new Set(memberships.filter(m => m.member_id).map(m => m.member_id!));

  async function setRole(id: string, role: UserRole) {
    setBusy(id);
    try { await onUpdateProfile(id, { role }); } finally { setBusy(null); }
  }
  async function setMember(id: string, member_id: string | null) {
    setBusy(id + '-m');
    try { await onUpdateProfile(id, { member_id }); } finally { setBusy(null); }
  }

  const displayCode = localCode ?? inviteCode;

  async function handleRegen() {
    setRegenBusy(true);
    try {
      const newCode = await onRegenerateInviteCode();
      setLocalCode(newCode);
    } finally {
      setRegenBusy(false);
    }
  }

  function handleCopy() {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Users size={16} />} title={`Roles & Access · ${memberships.length} users`} />

      {/* Invite code */}
      <div className="card p-4 mb-4 flex items-center gap-4 flex-wrap" style={{ borderLeft: `3px solid ${A}` }}>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-gold-300/70 mb-1">Invite Code</div>
          <div className="font-mono text-lg font-bold tracking-widest text-ink-100 select-all">
            {displayCode ?? '—'}
          </div>
          <div className="text-xs text-ink-100/50 mt-0.5">Share this code with new members so they can join from the "No Lance Yet" screen.</div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleCopy} className="btn btn-ghost btn-sm" disabled={!displayCode}>
            <Icons.Copy size={13} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleRegen} disabled={regenBusy} className="btn btn-ghost btn-sm text-red-400/70 hover:text-red-400">
            <Icons.Refresh size={13} />
            {regenBusy ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gold-500/10">
            <tr>
              <th className="px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">Permission</th>
              {(['super_admin', 'admin', 'member', 'viewer'] as UserRole[]).map(r => (
                <th key={r} className="px-4 py-2.5 text-center"><RolePill role={r} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['View all data (members, houses, inventory…)', true, true, true, true],
              ['Edit own linked character', true, true, true, false],
              ['Add / edit / delete members', true, true, false, false],
              ['Manage houses, covens, functions, businesses', true, true, false, false],
              ['Edit inventory quantities & log transactions', true, true, false, false],
              ['Access admin page (roles)', true, true, false, false],
              ['Danger zone (bulk resets)', true, false, false, false],
              ['Assign super_admin role', true, false, false, false],
            ].map(([label, superAdmin, admin, member, viewer], i) => (
              <tr key={i} className={i > 0 ? 'border-t border-gold-500/10' : ''}>
                <td className="px-4 py-2.5 text-ink-100/70">{label as string}</td>
                {[superAdmin, admin, member, viewer].map((allowed, j) => (
                  <td key={j} className="px-4 py-2.5 text-center">
                    {allowed
                      ? <span className="text-green-400 font-bold">✓</span>
                      : <span className="text-ink-100/25">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gold-500/10">
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Linked Character</Th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m, idx) => {
              const isSelf = m.profile_id === currentUserId;
              const displayName = m.profile?.display_name ?? null;
              const email = m.profile?.email ?? null;
              const linked = m.member_id ? data.members.find(dm => dm.id === m.member_id) : null;
              return (
                <tr key={m.id} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-sm flex-shrink-0"
                           style={{ background: `${ROLE_COLORS[m.role]}20`, border: `1px solid ${ROLE_COLORS[m.role]}40`, color: ROLE_COLORS[m.role] }}>
                        {initials(displayName ?? email ?? '?')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-100 truncate">
                          {displayName ?? email ?? '—'}
                          {isSelf && <span className="ml-2 text-[10px] uppercase tracking-widest text-gold-300/60">(you)</span>}
                        </div>
                        {displayName && <div className="text-xs text-ink-100/50 truncate">{email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      disabled={busy === m.id || (isSelf && adminCount <= 1) || (!isSuperAdmin && m.role === 'super_admin')}
                      onChange={e => setRole(m.id, e.target.value as UserRole)}
                      className="px-2.5 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm cursor-pointer disabled:opacity-50"
                      style={{ color: ROLE_COLORS[m.role] }}
                      title={!isSuperAdmin && m.role === 'super_admin' ? "Only super admins can change this role" : isSelf && adminCount <= 1 ? "Can't demote the only admin" : undefined}
                    >
                      {availableRoles.map(r => <option key={r} value={r} style={{ color: ROLE_COLORS[r] }}>{r.replace('_', ' ')}</option>)}
                    </select>
                    {busy === m.id && <span className="ml-2 text-xs text-ink-100/50">Saving…</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.member_id ?? ''}
                      disabled={busy === m.id + '-m'}
                      onChange={e => setMember(m.id, e.target.value || null)}
                      className="px-2.5 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm cursor-pointer disabled:opacity-50 max-w-[220px]"
                    >
                      <option value="">— Unlinked —</option>
                      {data.members
                        .filter(dm => !claimedMemberIds.has(dm.id) || dm.id === m.member_id)
                        .map(dm => <option key={dm.id} value={dm.id}>{dm.name}{dm.player_name ? ` (${dm.player_name})` : ''}</option>)}
                    </select>
                    {linked && (
                      <div className="text-xs text-ink-100/50 mt-0.5">
                        {data.houses.find(h => h.id === linked.house_id)?.name ?? 'Unassigned'}
                        {linked.rank ? ` · ${linked.rank}` : ''}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {memberships.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-ink-100/40 text-sm">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Danger Zone ───────────────────────────────────────────────────────────────

function DangerZone({ onResetInventoryQty, onClearInventoryLog, logCount }: { onResetInventoryQty: () => Promise<void>; onClearInventoryLog: () => Promise<void>; logCount: number }) {
  return (
    <section>
      <SectionHeading icon={<Icons.Trash size={16} />} title="Danger Zone" color="#f87171" />
      <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5 space-y-5">
        <DangerAction
          title="Reset all inventory quantities"
          description="Sets every item's current quantity to 0. Useful after an event reset. The required quantities and catalogue are preserved."
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">{children}</th>;
}

function RolePill({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
          style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>{role.replace('_', ' ')}</span>
  );
}
