'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth-context';

/** Redireciona para /login enquanto a sessão não estiver autenticada. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'unknown' || status === 'authenticating') {
    return <p className="py-16 text-center text-foreground/70">Carregando...</p>;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
