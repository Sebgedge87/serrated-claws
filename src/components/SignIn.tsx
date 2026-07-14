import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Icons } from '@/components/Icons';

/**
 * Sign-in screen — Google as the single primary CTA, with email/password
 * collapsed behind a disclosure so the page reads as "tap Google to start"
 * by default. Magic-link/signup are sub-toggles inside the disclosure.
 */
export function SignIn() {
  const { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [useMagic, setUseMagic] = useState(false);
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
      if (useMagic) {
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
      <div className="w-full max-w-md card p-9 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="grid place-items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-700 text-ink-900 grid place-items-center
                       shadow-[0_8px_24px_-8px_rgba(201,169,97,0.6),0_1px_0_rgba(255,255,255,0.3)_inset]"
            aria-hidden="true"
          >
            <Icons.Swords size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold mt-3.5 bg-gradient-to-b from-gold-50 to-gold-500
                         text-transparent bg-clip-text text-center">
            The Serrated Claws
          </h1>
          <p className="text-[10px] text-ink-100/50 uppercase tracking-[0.18em] mt-1">Group Management</p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="btn btn-primary w-full justify-center py-3.5 text-sm"
        >
          <Icons.Google />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setShowPwd(v => !v)}
          aria-expanded={showPwd}
          className="mt-3.5 w-full text-xs text-ink-100/55 hover:text-gold-300 transition-colors py-2"
        >
          {showPwd ? '— Hide email & password —' : '— Use email & password instead —'}
        </button>

        {showPwd && (
          <form onSubmit={onSubmit} className="mt-2 pt-4 border-t border-gold-500/10 space-y-3 animate-fade-in">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="[email protected]"
              />
            </div>

            {!useMagic && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-100/60 block mb-1.5">Password</label>
                <input
                  type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="••••••••"
                />
              </div>
            )}

            {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{err}</div>}
            {msg && <div className="text-xs text-sage-500 bg-sage-500/10 border border-sage-500/30 rounded-md px-3 py-2">{msg}</div>}

            <button type="submit" disabled={busy} className="btn btn-secondary w-full justify-center">
              {busy ? 'Working…' : useMagic ? 'Send magic link' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-[11px] text-ink-100/45 pt-1">
              <button type="button" onClick={() => setUseMagic(v => !v)} className="hover:text-gold-300 transition-colors">
                {useMagic ? 'Use password instead' : 'Send me a magic link'}
              </button>
              {!useMagic && (
                <button type="button" onClick={() => setIsSignup(v => !v)} className="hover:text-gold-300 transition-colors">
                  {isSignup ? 'Have an account? Sign in' : 'New here? Create account'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
