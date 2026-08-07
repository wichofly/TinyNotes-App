import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { authClient } from '../lib/auth-client';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) return <LoadingScreen />;
  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <LoadingScreen label="Checking your session…" />;
  if (session) return <Navigate to="/notes" replace />;
  return children;
}
