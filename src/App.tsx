import React from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useLances } from '@/hooks/useLances';
import { useTheme } from '@/hooks/useTheme';
import { SignIn } from '@/components/SignIn';
import { Layout } from '@/components/Layout';
import { CreateCharacterScreen } from '@/components/CreateCharacterScreen';

function Gate() {
  const { loading, session, profile, user } = useAuth();
  const lances = useLances(user?.id ?? null);

  if (loading || lances.loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gold-300 font-display text-2xl tracking-wider">
        ⚔ Awakening
      </div>
    );
  }
  if (!session) return <SignIn />;
  // Only block pure members — admins access via the header "Add Character" button
  if (profile && profile.member_id === null && profile.role === 'member' && lances.currentLanceId) {
    return (
      <CreateCharacterScreen
        userId={user!.id}
        lanceId={lances.currentLanceId}
        onCreated={() => window.location.reload()}
      />
    );
  }
  return <Layout />;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
