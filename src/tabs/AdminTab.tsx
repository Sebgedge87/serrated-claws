import { useState } from 'react';
import type { LanceData, LanceSettings, Profile, UserRole } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { initials } from '@/lib/utils';

interface Props {
  data: LanceData;
  profiles: Profile[];
  settings: LanceSettings | null;
  currentUserId: string;
  onUpdateProfile: (id: string, updates: { role?: UserRole; member_id?: string | null; display_name?: string | null }) => Promise<void>;
  onUpsertSettings: (updates: { name?: string; motto?: string | null; description?: string | null }) => Promise<void>;
  onResetInventoryQty: () => Promise<void>;
  onClearInventoryLog: () => Promise<void>;
}

const A = '#d4b46d';
const ROLES: UserRole[] = ['admin', 'member', 'viewer'];
const ROLE_COLORS: Record<UserRole, string> = { admin: '#d4b46d', member: '#7eb0d4', viewer: '#9ca3af' };

export function AdminTab({ data, profiles, settings, currentUserId, onUpdateProfile, onUpsertSettings, onResetInventoryQty, onClearInventoryLog }: Props) {
  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
          <Icons.Shield size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Admin</h2>
          <p className="text-sm text-ink-100/60 m-0">Settings, access control, and lance management</p>
        </div>
      </div>

      <StatsSection data={data} profiles={profiles} />
      <SettingsSection settings={settings} onSave={onUpsertSettings} />
      <RolesSection profiles={profiles} data={data} currentUserId={currentUserId} onUpdateProfile={onUpdateProfile} />
      <DangerZone onResetInventoryQty={onResetInventoryQty} onClearInventoryLog={onClearInventoryLog} logCount={data.inventoryLog.length} />
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsSection({ data, profiles }: { data: LanceData; profiles: Profile[] }) {
  const active = data.members.filter(m => m.status === 'active').length;
  const inactive = data.members.filter(m => m.status === 'inactive').length;
  const kia = data.members.filter(m => m.status === 'KIA').length;
  const shortfalls = data.inventory.filter(v => v.required_qty > v.current_qty).length;
  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const memberCount = profiles.filter(p => p.role === 'member').length;
  const viewerCount = profiles.filter(p => p.role === 'viewer').length;

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
        <StatCard label="User Accounts" value={profiles.length} sub={`${adminCount} admin · ${memberCount} member · ${viewerCount} viewer`} color="#b56eb5" />
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

function RolesSection({ profiles, data, currentUserId, onUpdateProfile }: { profiles: Profile[]; data: LanceData; currentUserId: string; onUpdateProfile: Props['onUpdateProfile'] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const adminCount = profiles.filter(p => p.role === 'admin').length;

  async function setRole(id: string, role: UserRole) {
    setBusy(id);
    try { await onUpdateProfile(id, { role }); } finally { setBusy(null); }
  }
  async function setMember(id: string, member_id: string | null) {
    setBusy(id + '-m');
    try { await onUpdateProfile(id, { member_id }); } finally { setBusy(null); }
  }

  return (
    <section>
      <SectionHeading icon={<Icons.Users size={16} />} title={`Roles & Access · ${profiles.length} users`} />
      <div className="flex gap-4 flex-wrap mb-4 text-sm text-ink-100/60">
        {(['admin', 'member', 'viewer'] as UserRole[]).map(r => (
          <span key={r} className="flex items-center gap-2">
            <RolePill role={r} />
            <span>— {r === 'admin' ? 'full access, edits all data' : r === 'member' ? 'can view all, edit own character' : 'read-only'}</span>
          </span>
        ))}
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
            {profiles.map((p, idx) => {
              const isSelf = p.id === currentUserId;
              const linked = p.member_id ? data.members.find(m => m.id === p.member_id) : null;
              return (
                <tr key={p.id} className={idx > 0 ? 'border-t border-gold-500/10' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-sm flex-shrink-0"
                           style={{ background: `${ROLE_COLORS[p.role]}20`, border: `1px solid ${ROLE_COLORS[p.role]}40`, color: ROLE_COLORS[p.role] }}>
                        {initials(p.display_name ?? p.email ?? '?')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-100 truncate">
                          {p.display_name ?? p.email ?? '—'}
                          {isSelf && <span className="ml-2 text-[10px] uppercase tracking-widest text-gold-300/60">(you)</span>}
                        </div>
                        {p.display_name && <div className="text-xs text-ink-100/50 truncate">{p.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      disabled={busy === p.id || (isSelf && adminCount <= 1)}
                      onChange={e => setRole(p.id, e.target.value as UserRole)}
                      className="px-2.5 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm cursor-pointer disabled:opacity-50"
                      style={{ color: ROLE_COLORS[p.role] }}
                      title={isSelf && adminCount <= 1 ? "Can't demote the only admin" : undefined}
                    >
                      {ROLES.map(r => <option key={r} value={r} style={{ color: ROLE_COLORS[r] }}>{r}</option>)}
                    </select>
                    {busy === p.id && <span className="ml-2 text-xs text-ink-100/50">Saving…</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.member_id ?? ''}
                      disabled={busy === p.id + '-m'}
                      onChange={e => setMember(p.id, e.target.value || null)}
                      className="px-2.5 py-1.5 bg-black/40 border border-gold-500/15 rounded text-sm cursor-pointer disabled:opacity-50 max-w-[220px]"
                    >
                      <option value="">— Unlinked —</option>
                      {data.members.map(m => <option key={m.id} value={m.id}>{m.name}{m.player_name ? ` (${m.player_name})` : ''}</option>)}
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
            {profiles.length === 0 && (
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
          style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>{role}</span>
  );
}
