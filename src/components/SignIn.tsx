import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/components/Icons';

export function SignIn() {
  const { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) setErr(error);
        else setMsg('Check your email for a sign-in link.');
      } else if (isSignup) {
        const { error } = await signUpWithPassword(email, password);
        if (error) setErr(error);
        else setMsg('Account created. Check your email to confirm, then sign in.');
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) setErr(error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md card p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl border border-gold-500/40 grid place-items-center bg-gradient-to-b from-gold-300/30 to-gold-300/10 text-gold-300 shadow-glow">
            <Icons.Swords size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">
              The Serrated Claws
            </h1>
            <p className="text-xs text-ink-100/60 uppercase tracking-[0.18em]">Lance Management</p>
          </div>
        </div>

        <p className="text-sm text-ink-100/60 mt-3 mb-6">
          Sign in to view rosters, holdings, and the inventory log.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="btn btn-secondary w-full justify-center mb-3"
        >
          <Icons.Google />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gold-500/15" />
          <span className="text-[10px] uppercase tracking-widest text-ink-100/40">or</span>
          <div className="flex-1 h-px bg-gold-500/15" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="[email protected]"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
          )}

          {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{err}</div>}
          {msg && <div className="text-xs text-sage-500 bg-sage-500/10 border border-sage-500/30 rounded-md px-3 py-2">{msg}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center">
            {busy ? 'Working…' : mode === 'magic' ? 'Send magic link' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-ink-100/50">
          <button
            type="button"
            className="hover:text-gold-300 transition-colors"
            onClick={() => setMode(m => (m === 'magic' ? 'password' : 'magic'))}
          >
            {mode === 'magic' ? 'Use password' : 'Use magic link'}
          </button>
          {mode === 'password' && (
            <button
              type="button"
              className="hover:text-gold-300 transition-colors"
              onClick={() => setIsSignup(v => !v)}
            >
              {isSignup ? 'Have an account? Sign in' : 'New here? Create account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
