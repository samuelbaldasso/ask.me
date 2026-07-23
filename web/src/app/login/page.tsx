'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginPage() {
  const { isAuthenticated, errorMessage } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Entrar</h1>
      <p className="max-w-sm text-foreground/70">
        Faça login para favoritar lugares, perguntar em linguagem natural e
        gerenciar sua assinatura.
      </p>
      <GoogleSignInButton />
      {errorMessage && <p className="text-sm text-[#EF4444]">{errorMessage}</p>}
    </div>
  );
}
