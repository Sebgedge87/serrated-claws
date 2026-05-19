import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SignIn } from '@/components/SignIn';
import { Layout } from '@/components/Layout';
import { CreateCharacterScreen } from '@/components/CreateCharacterScreen';

function Gate() {
  const { loading, session, profile, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gold-300 font-display text-2xl tracking-wider">
        ⚔ Awakening
      </div>
    );
  }
  if (!session) return <SignIn />;
  const skipKey = user ? `skip_create_char_${user.id}` : null;
  const skipped = skipKey ? localStorage.getItem(skipKey) === '1' : false;
  if (profile && profile.member_id === null && profile.role !== 'viewer' && !skipped) {
    const canSkip = profile.role === 'admin' || profile.role === 'super_admin';
    return (
      <CreateCharacterScreen
        userId={user!.id}
        canSkip={canSkip}
        onCreated={() => window.location.reload()}
        onSkip={() => {
          if (skipKey) localStorage.setItem(skipKey, '1');
          window.location.reload();
        }}
      />
    );
  }
  return <Layout />;
}

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
