import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginPage />;
  return <>{children}</>;
}
