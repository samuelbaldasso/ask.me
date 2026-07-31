'use client';

import { useEffect, useState } from 'react';
import {
  approveClaim,
  listApprovedClaims,
  listPendingClaims,
  rejectClaim,
  revokeClaim,
} from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { RequireAuth } from '@/lib/auth/require-auth';
import type { AdminClaim } from '@/lib/types';

type LoadStatus = 'loading' | 'loaded' | 'forbidden' | 'error';

function AdminBody() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [pending, setPending] = useState<AdminClaim[]>([]);
  const [approved, setApproved] = useState<AdminClaim[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = async () => {
    setStatus('loading');
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        listPendingClaims(),
        listApprovedClaims(),
      ]);
      setPending(pendingRes.data);
      setApproved(approvedRes.data);
      setStatus('loaded');
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 403 ? 'forbidden' : 'error');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, []);

  const actOnPending = async (claimId: string, action: 'approve' | 'reject') => {
    setActingId(claimId);
    try {
      await (action === 'approve' ? approveClaim(claimId) : rejectClaim(claimId));
      await reload();
    } catch {
      // mantém o item na lista — o admin tenta de novo
    } finally {
      setActingId(null);
    }
  };

  const revoke = async (claimId: string) => {
    if (!window.confirm('Revogar o acesso desse lojista ao estabelecimento?')) return;

    setActingId(claimId);
    try {
      await revokeClaim(claimId);
      setApproved((prev) => prev.filter((c) => c.id !== claimId));
    } catch {
      // mantém o item na lista — o admin tenta de novo
    } finally {
      setActingId(null);
    }
  };

  if (status === 'loading') {
    return <p className="py-16 text-center text-foreground/70">Carregando...</p>;
  }

  if (status === 'forbidden') {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-foreground/70">
        <p className="text-4xl" aria-hidden>🔒</p>
        <p>Essa página é restrita a administradores.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-foreground/70">
        <p>Não foi possível carregar a fila de revisão.</p>
        <button
          type="button"
          onClick={reload}
          className="rounded-2xl bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Admin
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Reivindicações de estabelecimento
        </h1>
        <p className="mt-1 text-sm text-[#171123]/70">
          Aprove só quem você confirmou ser o dono de fato do estabelecimento.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-[#171123]">
          Pendentes {pending.length > 0 && `(${pending.length})`}
        </h2>

        {pending.length === 0 ? (
          <p className="rounded-[28px] bg-white p-6 text-center text-sm text-[#171123]/60 shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
            Nenhuma reivindicação pendente no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((claim) => (
              <ClaimCard key={claim.id} claim={claim}>
                <button
                  type="button"
                  onClick={() => actOnPending(claim.id, 'reject')}
                  disabled={actingId === claim.id}
                  className="rounded-full border-2 border-[#EF4444] px-4 py-2 text-sm font-bold text-[#EF4444] transition hover:bg-[#EF4444]/5 disabled:opacity-50"
                >
                  Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => actOnPending(claim.id, 'approve')}
                  disabled={actingId === claim.id}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {actingId === claim.id ? 'Processando...' : 'Aprovar'}
                </button>
              </ClaimCard>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold text-[#171123]">
          Aprovados {approved.length > 0 && `(${approved.length})`}
        </h2>

        {approved.length === 0 ? (
          <p className="rounded-[28px] bg-white p-6 text-center text-sm text-[#171123]/60 shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
            Nenhum estabelecimento com dono aprovado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {approved.map((claim) => (
              <ClaimCard key={claim.id} claim={claim}>
                <button
                  type="button"
                  onClick={() => revoke(claim.id)}
                  disabled={actingId === claim.id}
                  className="rounded-full border-2 border-[#EF4444] px-4 py-2 text-sm font-bold text-[#EF4444] transition hover:bg-[#EF4444]/5 disabled:opacity-50"
                >
                  {actingId === claim.id ? 'Processando...' : 'Revogar'}
                </button>
              </ClaimCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ClaimCard({
  claim,
  children,
}: {
  claim: AdminClaim;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] bg-white p-5 shadow-[0_6px_16px_rgba(124,58,237,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-extrabold text-[#171123]">{claim.place.name}</p>
        <p className="text-sm text-[#171123]/60">
          {claim.place.address}, {claim.place.city}
        </p>
        <p className="mt-1 text-sm text-[#171123]/70">
          Pedido de <strong>{claim.user.name ?? claim.user.email}</strong> ({claim.user.email})
        </p>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminBody />
    </RequireAuth>
  );
}
