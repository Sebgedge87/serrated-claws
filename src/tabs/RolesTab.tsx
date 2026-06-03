import { useState } from 'react';
import type { LanceData, Profile, UserRole } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { initials } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Props {
  profiles: Profile[];
  data: LanceData;
  currentUserId: string;
  onUpdateProfile: (id: string, updates: { role?: UserRole; member_id?: string | null; display_name?: string | null }) => Promise<void>;
}

const ROLES: UserRole[] = ['admin', 'member', 'viewer'];

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#f0a040',
  admin: '#d4b46d',
  member: '#7eb0d4',
  viewer: '#9ca3af'
};

const A = '#d4b46d';

export function RolesTab({ profiles, data, currentUserId, onUpdateProfile }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  async function setRole(id: string, role: UserRole) {
    setBusy(id);
    try { await onUpdateProfile(id, { role }); } finally { setBusy(null); }
  }

  async function setMember(id: string, member_id: string | null) {
    setBusy(id + '-member');
    try { await onUpdateProfile(id, { member_id }); } finally { setBusy(null); }
  }

  const adminCount = profiles.filter(p => p.role === 'admin').length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
          <Icons.Shield size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Roles & Access</h2>
          <p className="text-sm text-ink-100/60 m-0">{profiles.length} users · {adminCount} admin{adminCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mb-4 card p-4 text-sm text-ink-100/60 space-y-1">
        <div className="flex gap-4 flex-wrap">
          <RolePill role="admin" /> <span className="text-ink-100/50">— full access, can edit all data</span>
        </div>
        <div className="flex gap-4 flex-wrap">
          <RolePill role="member" /> <span className="text-ink-100/50">— can view all, edit own character</span>
        </div>
        <div className="flex gap-4 flex-wrap">
          <RolePill role="viewer" /> <span className="text-ink-100/50">— read-only access</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gold-500/10">
            <tr>
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">User</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">Role</th>
              <th className="px-4 py-3 text-[11px] uppercase tracking-widest font-bold text-left text-ink-100">Linked Character</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, idx) => {
              const isSelf = p.id === currentUserId;
              const linkedMember = p.member_id ? data.members.find(m => m.id === p.member_id) : null;
              const isChangingRole = busy === p.id;
              const isChangingMember = busy === p.id + '-member';

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
                    <CustomSelect
                      value={p.role}
                      disabled={isChangingRole || (isSelf && adminCount <= 1)}
                      onChange={v => setRole(p.id, v as UserRole)}
                      options={ROLES.map(r => ({ value: r, label: r, color: ROLE_COLORS[r] }))}
                      placeholder=""
                    />
                    {isChangingRole && <span className="ml-2 text-xs text-ink-100/50">Saving…</span>}
                  </td>
                  <td className="px-4 py-3">
                    <CustomSelect
                      value={p.member_id ?? ''}
                      disabled={isChangingMember}
                      onChange={v => setMember(p.id, v || null)}
                      options={data.members.map(m => ({ value: m.id, label: `${m.name}${m.player_name ? ` (${m.player_name})` : ''}` }))}
                      placeholder="— Unlinked —"
                      className="max-w-[220px]"
                    />
                    {isChangingMember && <span className="ml-2 text-xs text-ink-100/50">Saving…</span>}
                    {linkedMember && (
                      <div className="text-xs text-ink-100/50 mt-0.5">
                        {data.houses.find(h => h.id === linkedMember.house_id)?.name ?? 'Unassigned'}
                        {linkedMember.rank ? ` · ${linkedMember.rank}` : ''}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-ink-100/40 text-sm">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
          style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>
      {role}
    </span>
  );
}
