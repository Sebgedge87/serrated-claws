import { useState } from 'react';
import { Icons } from '@/components/Icons';
import type { MembershipWithLance } from '@/hooks/useLances';

interface Props {
  memberships: MembershipWithLance[];
  loading: boolean;
  currentLanceId: string | null;
  memberIdToMove: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, motto?: string) => Promise<string>;
  onJoin: (code: string) => Promise<void>;
  onMoveCharacter: (memberId: string, lanceId: string) => Promise<void>;
}

type Mode = 'choose' | 'create' | 'join';

export function LanceGate({ memberships, loading, currentLanceId, memberIdToMove, onSelect, onCreate, onJoin, onMoveCharacter }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [code, setCode] = useState('');
  const [moveCharacter, setMoveCharacter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const newLanceId = await onCreate(name.trim(), motto.trim() || undefined);
      if (moveCharacter && memberIdToMove) {
        await onMoveCharacter(memberIdToMove, newLanceId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-100/60">Loading…</div>
      </div>
    );
  }

  // Lance picker when user has multiple memberships but none selected
  if (memberships.length > 1 && !currentLanceId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-display font-bold text-gold-300">Select a Lance</h1>
        <div className="grid gap-3 w-full max-w-sm">
          {memberships.map(m => (
            <button key={m.lance_id} onClick={() => onSelect(m.lance_id)} className="card card-lift p-5 text-left">
              <div className="font-display font-bold text-lg text-ink-100">{m.lance.name}</div>
              {m.lance.motto && <div className="text-sm text-ink-100/50 italic mt-0.5">"{m.lance.motto}"</div>}
              <div className="text-xs text-gold-300/70 mt-2 capitalize">{m.role}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 grid place-items-center text-gold-300">
        <Icons.Swords size={32} />
      </div>

      <div className="text-center max-w-sm w-full">
        <h1 className="text-2xl font-display font-bold text-gold-300 mb-6">No Lance Yet</h1>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button onClick={() => reset('join')} className="btn btn-primary w-full justify-center">
              <Icons.Users size={16} /> Join with Invite Code
            </button>
            <button onClick={() => reset('create')} className="btn btn-ghost w-full justify-center border border-gold-500/20">
              <Icons.Plus size={16} /> Create New Lance
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-3 text-left">
            <div>
              <label className="text-xs uppercase tracking-widest text-ink-100/50 mb-1 block">Invite Code</label>
              <input
                className="input w-full font-mono tracking-widest text-center"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. a3f9c1b2"
                maxLength={12}
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => reset('choose')} className="btn btn-ghost flex-1">Back</button>
              <button type="submit" disabled={!code.trim() || busy} className="btn btn-primary flex-1">
                {busy ? 'Joining…' : 'Join Lance'}
              </button>
            </div>
          </form>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3 text-left">
            <div>
              <label className="text-xs uppercase tracking-widest text-ink-100/50 mb-1 block">Lance Name</label>
              <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="The Iron Brotherhood" autoFocus />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-ink-100/50 mb-1 block">Motto · optional</label>
              <input className="input w-full" value={motto} onChange={e => setMotto(e.target.value)} placeholder="Forged in fire" />
            </div>
            {memberIdToMove && (
              <label className="flex items-center gap-2.5 px-3 py-2.5 border border-gold-500/20 rounded-lg cursor-pointer text-sm text-ink-100/80 bg-gold-500/5">
                <input type="checkbox" checked={moveCharacter} onChange={e => setMoveCharacter(e.target.checked)} className="accent-gold-400" />
                Move my character to the new lance
              </label>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => reset('choose')} className="btn btn-ghost flex-1">Back</button>
              <button type="submit" disabled={!name.trim() || busy} className="btn btn-primary flex-1">
                {busy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
