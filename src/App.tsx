import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SignIn } from '@/components/SignIn';
import { Layout } from '@/components/Layout';

function Gate() {
  const { loading, session } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gold-300 font-display text-2xl tracking-wider">
        ⚔ Awakening
      </div>
    );
  }
  return session ? <Layout /> : <SignIn />;
}

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
