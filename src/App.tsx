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
  if (profile && profile.member_id === null && profile.role === 'member') {
    return (
      <CreateCharacterScreen
        userId={user!.id}
        onCreated={() => window.location.reload()}
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
