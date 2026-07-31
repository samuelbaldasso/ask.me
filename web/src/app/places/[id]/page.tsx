'use client';

import Link from 'next/link';
import { use, useEffect } from 'react';
import { categoryStyleForSlug } from '@/lib/category-style';
import { trackPlaceEvent } from '@/lib/api/endpoints';
import { usePlaceCache } from '@/lib/place-cache';
import { distanceLabel } from '@/lib/types';

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const place = usePlaceCache().get(id);

  // Base do relatório do painel do lojista — visualização do perfil do
  // estabelecimento; nunca bloqueia a navegação se a chamada falhar.
  useEffect(() => {
    if (place) trackPlaceEvent(id, 'view').catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!place]);

  if (!place) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-foreground/70">
        <p>
          Não encontramos os detalhes desse lugar — volte para a busca e
          selecione-o novamente.
        </p>
        <Link href="/buscar" className="font-bold text-primary">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  const style = categoryStyleForSlug(place.category.slug);
  const isOpen = place.isOpenNow;

  const routeHref = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const whatsappNumber = place.whatsappNumber ?? place.phone;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-[28px] bg-gradient-to-br from-primary to-[#ec4899] p-8 text-white">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-4xl">
          <span aria-hidden>{style.emoji}</span>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest">
            {place.category.label}
          </p>
          <h1 className="text-2xl font-extrabold">
            {place.isFeatured && (
              <span aria-label="Destaque" title="Estabelecimento em destaque">
                👑{' '}
              </span>
            )}
            {place.name}
          </h1>
        </div>
      </div>

      {isOpen !== null && (
        <span
          className="w-fit rounded-full px-3 py-1.5 text-sm font-bold"
          style={{
            color: isOpen ? '#22C55E' : '#EF4444',
            backgroundColor: isOpen ? '#22C55E1F' : '#EF44441F',
          }}
        >
          {isOpen ? 'Aberto agora' : 'Fechado agora'}
        </span>
      )}

      {place.description && (
        <p className="leading-relaxed text-foreground/80">{place.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton
          icon="🧭"
          label="Ver rota"
          href={routeHref}
          onClick={() => trackPlaceEvent(id, 'route_click').catch(() => {})}
        />
        {whatsappHref && (
          <ActionButton
            icon="💬"
            label="WhatsApp"
            href={whatsappHref}
            onClick={() => trackPlaceEvent(id, 'whatsapp_click').catch(() => {})}
          />
        )}
        {place.menuUrl && (
          <ActionButton
            icon="📋"
            label="Ver cardápio"
            href={place.menuUrl}
            onClick={() => trackPlaceEvent(id, 'menu_click').catch(() => {})}
          />
        )}
      </div>

      <div className="divide-y divide-[#EDE7FB] rounded-[20px] bg-white px-2 shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
        <InfoRow icon="📍" text={`${place.address}, ${place.city}`} />
        <InfoRow icon="🧭" text={`A ${distanceLabel(place.distanceMeters)} de você`} />
        {place.phone && (
          <InfoRow
            icon="📞"
            text={place.phone}
            href={`tel:${place.phone}`}
            onClick={() => trackPlaceEvent(id, 'phone_click').catch(() => {})}
          />
        )}
        {place.website && (
          <InfoRow
            icon="🌐"
            text={place.website}
            href={place.website}
            external
            onClick={() => trackPlaceEvent(id, 'website_click').catch(() => {})}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {place.acceptsPets && <Tag label="Aceita pets" />}
        {place.acceptsCards && <Tag label="Aceita cartão" />}
        {place.hasParking && <Tag label="Estacionamento" />}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  href,
  onClick,
}: {
  icon: string;
  label: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
    >
      <span aria-hidden>{icon}</span>
      {label}
    </a>
  );
}

function InfoRow({
  icon,
  text,
  href,
  external,
  onClick,
}: {
  icon: string;
  text: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3.5 px-3 py-3">
      <span aria-hidden className="text-lg">
        {icon}
      </span>
      <span className={href ? 'font-semibold text-primary' : 'text-[#171123]'}>
        {text}
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target={external ? '_blank' : undefined} rel="noreferrer" onClick={onClick}>
      {content}
    </a>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#64748B1A] px-3 py-2 text-sm font-bold text-[#64748B]">
      {label}
    </span>
  );
}
