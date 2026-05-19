import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Icons } from '@/components/Icons';
import type { House } from '@/lib/types';

interface Props {
  userId: string;
  onCreated: () => void;
  onClose?: () => void;
}

export function CreateCharacterScreen({ userId, onCreated, onClose }: Props) {
  const [houses, setHouses] = useState<House[]>([]);
  const [form, setForm] = useState({
    name: '',
    player_name: '',
    pid: '',
    house_id: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('houses').select('*').order('sort_order').then(({ data }) => {
      if (data) setHouses(data as House[]);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data: member, error: memberErr } = await supabase
        .from('members')
        .insert({
          name: form.name.trim(),
          player_name: form.player_name.trim() || null,
          pid: form.pid.trim() || null,
          house_id: form.house_id || null,
          rank: 'Member',
          is_noble: false,
          status: 'active',
          attending_event: false,
        })
        .select()
        .single();

      if (memberErr) throw new Error(memberErr.message);

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ member_id: member.id })
        .eq('id', userId);

      if (profileErr) throw new Error(profileErr.message);

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl text-ink-800 grid place-items-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #d4b46d 0%, #b8954c 100%)', boxShadow: '0 8px 24px -8px rgba(201,169,97,0.6)' }}>
            <Icons.Users size={28} />
          </div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text mb-2">
            Create Your Character
          </h1>
          <p className="text-sm text-ink-100/60">Set up your Empire LARP character to join the lance roster.</p>
        </div>

        <div className="card px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1.5">
                Character Name <span className="text-red-400">*</span>
              </label>
              <input
                className="input font-display font-semibold"
                autoFocus
                placeholder="Your character's in-character name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1.5">
                Player Name
              </label>
              <input
                className="input"
                placeholder="Your out-of-character name (optional)"
                value={form.player_name}
                onChange={e => setForm(f => ({ ...f, player_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1.5">
                PID
              </label>
              <input
                className="input font-mono"
                placeholder="Profound Decisions ID (optional)"
                value={form.pid}
                onChange={e => setForm(f => ({ ...f, pid: e.target.value }))}
              />
            </div>

            {houses.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold block mb-1.5">
                  House
                </label>
                <select
                  className="input"
                  value={form.house_id}
                  onChange={e => setForm(f => ({ ...f, house_id: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            )}

            {error && (
              <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!form.name.trim() || busy}
              className="btn btn-primary w-full justify-center"
            >
              <Icons.Plus size={16} />
              {busy ? 'Creating character…' : 'Create Character'}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost w-full justify-center text-ink-100/50"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
