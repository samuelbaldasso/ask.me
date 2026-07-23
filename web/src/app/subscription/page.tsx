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
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {isActive ? (
        <>
          <span className="text-5xl">✅</span>
          <h1 className="text-xl font-extrabold">Sua assinatura está ativa!</h1>
          {subscription?.currentPeriodEnd && (
            <p className="text-foreground/70">
              Próxima renovação: {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <p className="text-[#F97316]">
              Cancelamento agendado — ativa até o fim do período.
            </p>
          )}
          {errorMessage && <p className="text-[#EF4444]">{errorMessage}</p>}
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={status === 'opening-portal'}
            className="mt-2 rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary disabled:opacity-50"
          >
            Gerenciar assinatura
          </button>
        </>
      ) : (
        <>
          <span className="text-5xl">👑</span>
          <h1 className="text-xl font-extrabold">ask.me Premium</h1>
          <p className="text-foreground/70">
            R$ 20,00/mês · cartão de crédito · cancele quando quiser
          </p>
          {errorMessage && <p className="text-[#EF4444]">{errorMessage}</p>}
          <button
            type="button"
            onClick={startCheckout}
            disabled={status === 'opening-checkout'}
            className="mt-2 rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            Assinar com cartão
          </button>
          <button
            type="button"
            onClick={loadStatus}
            className="text-sm font-semibold text-primary"
          >
            Já paguei, atualizar status
          </button>
        </>
      )}
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
