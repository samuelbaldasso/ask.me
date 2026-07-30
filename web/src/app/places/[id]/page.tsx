'use client';

import Link from 'next/link';
import { use } from 'react';
import { categoryStyleForSlug } from '@/lib/category-style';
import { usePlaceCache } from '@/lib/place-cache';
import { distanceLabel } from '@/lib/types';

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const place = usePlaceCache().get(id);

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
          <h1 className="text-2xl font-extrabold">{place.name}</h1>
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

      <div className="divide-y divide-[#EDE7FB] rounded-[20px] bg-white px-2 shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
        <InfoRow icon="📍" text={`${place.address}, ${place.city}`} />
        <InfoRow icon="🧭" text={`A ${distanceLabel(place.distanceMeters)} de você`} />
        {place.phone && (
          <InfoRow icon="📞" text={place.phone} href={`tel:${place.phone}`} />
        )}
        {place.website && (
          <InfoRow icon="🌐" text={place.website} href={place.website} external />
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

function InfoRow({
  icon,
  text,
  href,
  external,
}: {
  icon: string;
  text: string;
  href?: string;
  external?: boolean;
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
    <a href={href} target={external ? '_blank' : undefined} rel="noreferrer">
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
