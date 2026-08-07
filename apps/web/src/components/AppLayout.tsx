import { LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router';
import { authClient } from '../lib/auth-client';
import { queryClient } from '../lib/query-client';
import { Brand } from './Brand';

export function AppLayout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    queryClient.clear();
    navigate('/');
  }

  return (
    <div className="min-h-dvh bg-paper text-stone-900">
      <header className="border-b border-stone-200/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-500 sm:block">{session?.user.name}</span>
            <button type="button" onClick={signOut} className="btn-ghost" aria-label="Sign out">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
