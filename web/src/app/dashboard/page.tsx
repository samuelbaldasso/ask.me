'use client';

import { useEffect, useState } from 'react';
import {
  claimBusinessPlace,
  createBillingPortalSession,
  createCheckoutSession,
  getBusinessPlaceStats,
  getMyBusiness,
  searchClaimablePlaces,
  updateBusinessPlace,
} from '@/lib/api/endpoints';
import { RequireAuth } from '@/lib/auth/require-auth';
import type {
  BusinessPlace,
  ClaimableBusinessPlace,
  MyBusiness,
  PlaceStats,
  UpdatePlaceProfileInput,
} from '@/lib/types';

type LoadStatus = 'loading' | 'loaded' | 'error';

function DashboardBody() {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [business, setBusiness] = useState<MyBusiness | null>(null);

  const reload = async () => {
    setStatus('loading');
    try {
      setBusiness(await getMyBusiness());
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, []);

  if (status === 'loading') {
    return <p className="py-16 text-center text-foreground/70">Carregando...</p>;
  }

  if (status === 'error' || !business) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-foreground/70">
        <p>Não foi possível carregar o painel.</p>
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
          Para empresas
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Painel do lojista
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[#171123]/70">
          Gerencie seus estabelecimentos, veja quantas pessoas encontraram
          seu negócio no ask.me e assine para aparecer em destaque.
        </p>
      </div>

      <SubscriptionBanner subscription={business.subscription} />

      {business.places.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-[#171123]">Seus estabelecimentos</h2>
          {business.places.map((place) => (
            <PlaceManageCard key={place.id} place={place} onUpdated={reload} />
          ))}
        </div>
      )}

      <ClaimSection onClaimed={reload} />
    </div>
  );
}

function SubscriptionBanner({
  subscription,
}: {
  subscription: MyBusiness['subscription'];
}) {
  const [status, setStatus] = useState<'idle' | 'opening-checkout' | 'opening-portal'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isActive = subscription.status === 'active';

  const startCheckout = async () => {
    setStatus('opening-checkout');
    setErrorMessage(null);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setErrorMessage('Não foi possível abrir a página de pagamento.');
      setStatus('idle');
    }
  };

  const openBillingPortal = async () => {
    setStatus('opening-portal');
    setErrorMessage(null);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch {
      setErrorMessage('Não foi possível abrir o gerenciamento da assinatura.');
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#171123]/40">
          Plano
        </p>
        <p className="mt-1 text-lg font-extrabold text-[#171123]">
          {isActive ? '👑 Destaque ativo' : 'Plano gratuito'}
        </p>
        <p className="mt-1 text-sm text-[#171123]/70">
          {isActive
            ? 'Seu negócio aparece em destaque nas buscas do ask.me.'
            : 'R$ 99,90/mês · apareça em destaque nas buscas · cancele quando quiser.'}
        </p>
        {errorMessage && (
          <p className="mt-1 text-sm font-semibold text-[#EF4444]">{errorMessage}</p>
        )}
      </div>
      <button
        type="button"
        onClick={isActive ? openBillingPortal : startCheckout}
        disabled={status !== 'idle'}
        className={
          isActive
            ? 'shrink-0 rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50'
            : 'shrink-0 rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50'
        }
      >
        {status !== 'idle' ? 'Abrindo...' : isActive ? 'Gerenciar assinatura' : 'Assinar'}
      </button>
    </div>
  );
}

function PlaceManageCard({
  place,
  onUpdated,
}: {
  place: BusinessPlace;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<UpdatePlaceProfileInput>({
    description: place.description,
    phone: place.phone,
    website: place.website,
    acceptsPets: place.acceptsPets,
    acceptsCards: place.acceptsCards,
    hasParking: place.hasParking,
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [stats, setStats] = useState<PlaceStats | null>(null);

  useEffect(() => {
    if (!expanded || stats) return;
    getBusinessPlaceStats(place.id)
      .then(setStats)
      .catch(() => {});
  }, [expanded, stats, place.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await updateBusinessPlace(place.id, form);
      setSaveStatus('idle');
      onUpdated();
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="rounded-[24px] bg-white shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {place.category.label}
          </p>
          <p className="font-extrabold text-[#171123]">{place.name}</p>
          <p className="text-sm text-[#171123]/60">{place.address}, {place.city}</p>
        </div>
        <span className="shrink-0 text-xl text-primary" aria-hidden>
          {expanded ? '︿' : '﹀'}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-6 border-t border-[#EDE7FB] px-6 py-5">
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Visualizações (30d)" value={stats.viewsLast30Days} />
              <StatTile label="Cliques (30d)" value={stats.clicksLast30Days} />
              <StatTile label="Visualizações (total)" value={stats.viewsTotal} />
              <StatTile label="Cliques (total)" value={stats.clicksTotal} />
            </div>
          )}

          <form onSubmit={save} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-[#171123]/80">
              Descrição
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Conte o que torna seu negócio especial"
                className="rounded-2xl bg-surface-dim px-4 py-3 text-sm font-normal text-[#171123] outline-none ring-primary/40 transition focus:ring-2"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-[#171123]/80">
                Telefone
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="rounded-full bg-surface-dim px-4 py-2.5 text-sm font-normal text-[#171123] outline-none ring-primary/40 transition focus:ring-2"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-[#171123]/80">
                Site
                <input
                  value={form.website ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                  className="rounded-full bg-surface-dim px-4 py-2.5 text-sm font-normal text-[#171123] outline-none ring-primary/40 transition focus:ring-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4">
              <ToggleField
                label="Aceita pets"
                checked={form.acceptsPets ?? false}
                onChange={(v) => setForm((f) => ({ ...f, acceptsPets: v }))}
              />
              <ToggleField
                label="Aceita cartão"
                checked={form.acceptsCards ?? false}
                onChange={(v) => setForm((f) => ({ ...f, acceptsCards: v }))}
              />
              <ToggleField
                label="Estacionamento"
                checked={form.hasParking ?? false}
                onChange={(v) => setForm((f) => ({ ...f, hasParking: v }))}
              />
            </div>

            {saveStatus === 'error' && (
              <p className="text-sm font-semibold text-[#EF4444]">
                Não foi possível salvar. Tente novamente.
              </p>
            )}

            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="w-fit rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface-dim px-4 py-3">
      <p className="text-2xl font-extrabold text-primary">{value}</p>
      <p className="text-xs font-semibold text-[#171123]/60">{label}</p>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-[#171123]/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[color:var(--color-primary)]"
      />
      {label}
    </label>
  );
}

function ClaimSection({ onClaimed }: { onClaimed: () => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [results, setResults] = useState<ClaimableBusinessPlace[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setStatus('loading');
    try {
      const { data } = await searchClaimablePlaces(trimmed);
      setResults(data);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const claim = async (placeId: string) => {
    setClaimingId(placeId);
    try {
      await claimBusinessPlace(placeId);
      setResults((prev) =>
        prev.map((p) => (p.id === placeId ? { ...p, isClaimed: true, isMine: true } : p)),
      );
      onClaimed();
    } catch {
      setStatus('error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
      <div>
        <h2 className="text-lg font-extrabold text-[#171123]">Reivindicar meu negócio</h2>
        <p className="mt-1 text-sm text-[#171123]/70">
          Encontre seu estabelecimento na nossa base e vincule à sua conta para
          gerenciar o perfil e ver relatórios.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome do estabelecimento"
          className="min-w-0 flex-1 rounded-full bg-surface-dim px-4 py-2.5 text-sm outline-none ring-primary/40 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === 'loading' || query.trim().length < 2}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-sm font-semibold text-[#EF4444]">
          Não foi possível concluir a ação. Tente novamente.
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col divide-y divide-[#EDE7FB]">
          {results.map((place) => (
            <div key={place.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-bold text-[#171123]">{place.name}</p>
                <p className="text-sm text-[#171123]/60">{place.address}, {place.city}</p>
              </div>
              {place.isMine ? (
                <span className="shrink-0 text-sm font-bold text-primary">Seu negócio</span>
              ) : place.isClaimed ? (
                <span className="shrink-0 text-sm font-semibold text-[#171123]/40">
                  Já reivindicado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => claim(place.id)}
                  disabled={claimingId === place.id}
                  className="shrink-0 rounded-full border-2 border-primary px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
                >
                  {claimingId === place.id ? 'Vinculando...' : 'Esse é o meu negócio'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardBody />
    </RequireAuth>
  );
}
