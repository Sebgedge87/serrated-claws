import { useState } from 'react';
import { useLance } from '@/contexts/LanceContext';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icons } from '@/components/Icons';
import type { LanceData, LanceMembership, Member } from '@/lib/types';

export function AttendingBanner() {
  const { data, memberships, upsertMember, upsertProfile } = useLance();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextEvent = [...data.events]
    .filter(ev => !ev.cleared)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .find(ev => new Date(ev.start_date) >= today);

  if (!nextEvent) return null;

  const currentMember = profile?.member_id
    ? data.members.find(m => m.id === profile.member_id)
    : null;

  // Only show if unanswered (null) — true/false means they already responded
  if (currentMember && currentMember.attending_event !== null) return null;

  // If no member and not a member role, skip (admins without characters)
  if (!currentMember && profile?.role !== 'member') return null;

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <>
      <div
        className="bg-gold-500/10 border-b border-gold-500/25 cursor-pointer hover:bg-gold-500/15 transition-colors"
        onClick={() => setOpen(true)}
      >
        <div className="page-wrap py-2.5 flex items-center gap-3">
          <Icons.Scroll size={15} className="text-gold-300 flex-shrink-0" />
          <p className="text-sm text-ink-100/80 flex-1 min-w-0">
            <span className="font-semibold text-gold-300">{nextEvent.name}</span>
            {' '}·{' '}
            <span className="text-ink-100/60">
              {fmtDate(nextEvent.start_date)}
              {nextEvent.end_date ? ` – ${fmtDate(nextEvent.end_date)}` : ''}
            </span>
            {currentMember
              ? ' — Will you be attending?'
              : ' — Link your character to mark attendance.'}
          </p>
          <span className="text-xs text-gold-300/70 font-semibold flex-shrink-0">Mark attendance →</span>
        </div>
      </div>

      {open && (
        <AttendingModal
          nextEvent={nextEvent}
          currentMember={currentMember ?? null}
          data={data}
          memberships={memberships}
          onMarkAttending={async (memberId: string, attending: boolean) => {
            const m = data.members.find(mem => mem.id === memberId);
            if (m) await upsertMember({ ...m, attending_event: attending });
            setOpen(false);
          }}
          onLinkAndMark={async (memberId: string, attending: boolean) => {
            const m = data.members.find(mem => mem.id === memberId);
            await upsertProfile(profile!.id, { member_id: memberId });
            if (m) await upsertMember({ ...m, attending_event: attending });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AttendingModal({
  nextEvent,
  currentMember,
  data,
  memberships,
  onMarkAttending,
  onLinkAndMark,
  onClose,
}: {
  nextEvent: { name: string; start_date: string; end_date: string | null };
  currentMember: Member | null;
  data: LanceData;
  memberships: LanceMembership[];
  onMarkAttending: (memberId: string, attending: boolean) => Promise<void>;
  onLinkAndMark: (memberId: string, attending: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const claimedMemberIds = new Set(memberships.filter(m => m.member_id).map(m => m.member_id!));
  const unclaimedMembers = data.members.filter(
    m => m.status === 'active' && !claimedMemberIds.has(m.id)
  ).sort((a, b) => a.name.localeCompare(b.name));

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function respond(attending: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (currentMember) {
        await onMarkAttending(currentMember.id, attending);
      } else if (selectedMemberId) {
        await onLinkAndMark(selectedMemberId, attending);
      }
    } finally {
      setBusy(false);
    }
  }

  const canRespond = !!currentMember || !!selectedMemberId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-sm space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-gold-300/70 font-semibold mb-1">Upcoming Event</div>
          <h3 className="font-display font-bold text-xl text-gold-300 m-0">{nextEvent.name}</h3>
          <p className="text-sm text-ink-100/50 mt-0.5">
            {fmtDate(nextEvent.start_date)}
            {nextEvent.end_date ? ` – ${fmtDate(nextEvent.end_date)}` : ''}
          </p>
        </div>

        {/* Character */}
        {currentMember ? (
          <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(212,180,109,0.08)', border: '1px solid rgba(212,180,109,0.2)' }}>
            <Icons.Users size={16} className="text-gold-300 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-ink-100">{currentMember.name}</div>
              <div className="text-xs text-ink-100/50">Your character</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-ink-100/50 uppercase tracking-widest font-semibold">Select your character</div>
            {unclaimedMembers.length === 0 ? (
              <p className="text-sm text-ink-100/40 italic">No unclaimed characters available. Ask an admin to create one for you.</p>
            ) : (
              <CustomSelect
                value={selectedMemberId}
                onChange={setSelectedMemberId}
                options={unclaimedMembers.map(m => ({
                  value: m.id,
                  label: `${m.name}${m.rank ? ` · ${m.rank}` : ''}`,
                }))}
                placeholder="— Choose a character —"
              />
            )}
          </div>
        )}

        {/* Yes / No */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => respond(true)}
            disabled={busy || !canRespond}
            className="btn btn-primary py-3 justify-center disabled:opacity-40"
          >
            {busy ? '…' : '⚔ Yes, attending'}
          </button>
          <button
            onClick={() => respond(false)}
            disabled={busy || !canRespond}
            className="btn btn-ghost py-3 justify-center disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            {busy ? '…' : '✕ Can\'t make it'}
          </button>
        </div>

        <button onClick={onClose} className="text-xs text-ink-100/30 hover:text-ink-100/60 transition-colors w-full text-center">
          Decide later
        </button>
      </div>
    </div>
  );
}
