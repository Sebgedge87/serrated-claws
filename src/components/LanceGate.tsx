import { useState } from 'react';
import { Icons } from '@/components/Icons';
import type { MembershipWithLance } from '@/hooks/useLances';

interface Props {
  memberships: MembershipWithLance[];
  loading: boolean;
  currentLanceId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, motto?: string) => Promise<void>;
}

export function LanceGate({ memberships, loading, currentLanceId, onSelect, onCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-100/60">Loading…</div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 grid place-items-center text-gold-300">
          <Icons.Swords size={32} />
        </div>
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-display font-bold text-gold-300 mb-2">No Lance Yet</h1>
          {!creating ? (
            <>
              <p className="text-ink-100/60 text-sm mb-6">You haven't been added to a lance. Ask your admin to add you, or create a new one.</p>
              <button onClick={() => setCreating(true)} className="btn btn-primary">
                <Icons.Plus size={16} /> Create Lance
              </button>
            </>
          ) : (
            <form onSubmit={async e => {
              e.preventDefault();
              if (!name.trim() || busy) return;
              setBusy(true);
              try { await onCreate(name.trim(), motto.trim() || undefined); }
              finally { setBusy(false); }
            }} className="space-y-3 text-left">
              <div>
                <label className="text-xs uppercase tracking-widest text-ink-100/50 mb-1 block">Lance Name</label>
                <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="The Iron Brotherhood" autoFocus />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-ink-100/50 mb-1 block">Motto · optional</label>
                <input className="input w-full" value={motto} onChange={e => setMotto(e.target.value)} placeholder="Forged in fire" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setCreating(false)} className="btn btn-ghost flex-1">Cancel</button>
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

  if (memberships.length > 1 && !currentLanceId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-display font-bold text-gold-300">Select a Lance</h1>
        <div className="grid gap-3 w-full max-w-sm">
          {memberships.map(m => (
            <button key={m.lance_id} onClick={() => onSelect(m.lance_id)}
              className="card card-lift p-5 text-left">
              <div className="font-display font-bold text-lg text-ink-100">{m.lance.name}</div>
              {m.lance.motto && <div className="text-sm text-ink-100/50 italic mt-0.5">"{m.lance.motto}"</div>}
              <div className="text-xs text-gold-300/70 mt-2 capitalize">{m.role}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null; // render children (the app)
}
