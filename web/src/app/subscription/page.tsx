'use client';

import { useEffect, useState } from 'react';
import {
  createBillingPortalSession,
  createCheckoutSession,
  getSubscriptionStatus,
} from '@/lib/api/endpoints';
import { RequireAuth } from '@/lib/auth/require-auth';
import type { SubscriptionStatus } from '@/lib/types';

type ViewStatus = 'loading' | 'loaded' | 'error' | 'opening-checkout' | 'opening-portal';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR');
}

function SubscriptionBody() {
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      setSubscription(await getSubscriptionStatus());
      setStatus('loaded');
    } catch {
      setErrorMessage('Não foi possível carregar sua assinatura.');
      setStatus('error');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, []);

  // Como o site não escuta um retorno automático da Stripe, o usuário volta
  // manualmente e clica em "Já paguei, atualizar status" (mesma estratégia
  // do app Flutter, que abre o Checkout/Portal no navegador externo).
  const startCheckout = async () => {
    setStatus('opening-checkout');
    setErrorMessage(null);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setErrorMessage('Não foi possível abrir a página de pagamento.');
      setStatus('error');
    }
  };

  const openBillingPortal = async () => {
    setStatus('opening-portal');
    setErrorMessage(null);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch {
      setErrorMessage('Não foi possível abrir a página de gerenciamento da assinatura.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <p className="py-16 text-center text-foreground/70">Carregando...</p>;
  }

  const isActive = subscription?.status === 'active';

  return (
    <div className="flex justify-center py-6 sm:py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[28px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
        {isActive ? (
          <>
            <span className="text-5xl" aria-hidden>
              ✅
            </span>
            <h1 className="text-xl font-extrabold text-[#171123]">
              Sua assinatura está ativa!
            </h1>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-[#171123]/70">
                Próxima renovação: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p className="rounded-xl bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#C2410C]">
                Cancelamento agendado — ativa até o fim do período.
              </p>
            )}
            {errorMessage && (
              <p className="text-sm font-semibold text-[#EF4444]">{errorMessage}</p>
            )}
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={status === 'opening-portal'}
              className="mt-2 w-full rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              {status === 'opening-portal' ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          </>
        ) : (
          <>
            <span className="text-5xl" aria-hidden>
              👑
            </span>
            <h1 className="text-xl font-extrabold text-[#171123]">ask.me Premium</h1>
            <p className="text-sm text-[#171123]/70">
              R$ 39,90/mês · cartão de crédito · cancele quando quiser
            </p>
            {errorMessage && (
              <p className="text-sm font-semibold text-[#EF4444]">{errorMessage}</p>
            )}
            <button
              type="button"
              onClick={startCheckout}
              disabled={status === 'opening-checkout'}
              className="mt-2 w-full rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {status === 'opening-checkout' ? 'Abrindo...' : 'Assinar com cartão'}
            </button>
            <button
              type="button"
              onClick={loadStatus}
              className="text-sm font-semibold text-primary transition hover:opacity-70"
            >
              Já paguei, atualizar status
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <RequireAuth>
      <SubscriptionBody />
    </RequireAuth>
  );
}
