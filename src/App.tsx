import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useLances } from '@/hooks/useLances';
import { ThemeProvider } from '@/hooks/useTheme';
import { SignIn } from '@/components/SignIn';
import { Layout } from '@/components/Layout';
import { CreateCharacterScreen } from '@/components/CreateCharacterScreen';
import { UpdatePrompt } from '@/components/UpdatePrompt';

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
  if (!user) return null;
  // Only block pure members — admins access via the header "Add Character" button
  if (profile && profile.member_id === null && profile.role === 'member' && lances.currentLanceId) {
    return (
      <CreateCharacterScreen
        userId={user.id}
        lanceId={lances.currentLanceId}
        onCreated={() => lances.reloadMemberships()}
      />
    );
  }
  return <Layout />;
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-display font-bold text-gold-300 mb-4">404 — Page not found</h1>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Gate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <UpdatePrompt />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
