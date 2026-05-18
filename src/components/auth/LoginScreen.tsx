import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/lib/icons';

export function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === 'sign-in' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="card w-full max-w-md p-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-2 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gold-gradient text-ink-900 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(201,169,97,0.6)]">
            <Icons.Swords size={24} />
          </div>
        </div>
        <h1 className="font-display text-3xl text-center gold-text mb-1">The Serrated Claws</h1>
        <p className="text-center text-xs text-ink-300 uppercase tracking-widest mb-8">Lance Management System</p>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" />
          </div>

          {error && <div className="text-danger-400 text-sm p-3 bg-danger-500/10 rounded-lg border border-danger-500/20">{error}</div>}

          <Button type="submit" variant="primary" disabled={busy} className="mt-1">
            {busy ? '…' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="flex items-center my-5 gap-3">
          <div className="flex-1 h-px bg-gold-500/15" />
          <span className="text-xs text-ink-300 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gold-500/15" />
        </div>

        <Button variant="secondary" className="w-full justify-center" onClick={() => signInWithGoogle()} icon={<Icons.Google size={18} />}>
          Continue with Google
        </Button>

        <button
          onClick={() => setMode(m => (m === 'sign-in' ? 'sign-up' : 'sign-in'))}
          className="w-full text-center text-xs text-ink-300 hover:text-gold-400 mt-6 transition-colors"
          type="button"
        >
          {mode === 'sign-in' ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
