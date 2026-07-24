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
    <div className="flex justify-center py-10 sm:py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-[28px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
        <span className="text-4xl" aria-hidden>
          👋
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#171123]">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-[#171123]/70">
            Entre para favoritar lugares, perguntar em linguagem natural e
            gerenciar sua assinatura.
          </p>
        </div>
        <GoogleSignInButton />
        {errorMessage && <p className="text-sm font-semibold text-[#EF4444]">{errorMessage}</p>}
      </div>
    </div>
  );
}
