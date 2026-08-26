import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlace } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { PlaceDetailView } from './place-detail-view';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function loadPlace(id: string) {
  try {
    return await getPlace(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    // Erro de rede/timeout: não derruba a página com notFound() — mostra
    // um estado de erro recuperável em vez de um 404 incorreto.
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = await loadPlace(id).catch(() => null);

  if (!place) {
    return { title: 'Estabelecimento não encontrado — ask.me' };
  }

  const title = `${place.name} — ${place.category.label} em ${place.city} | ask.me`;
  const description =
    place.description ??
    `${place.name} é um estabelecimento de ${place.category.label.toLowerCase()} em ${place.city}. Veja endereço, horário de funcionamento e contato no ask.me.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/places/${place.id}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/places/${place.id}`,
      type: 'website',
      images: place.photoUrls.length > 0 ? place.photoUrls.slice(0, 1) : undefined,
    },
    twitter: {
      card: place.photoUrls.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let place;
  try {
    place = await loadPlace(id);
  } catch {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-foreground/70">
        <p>Não foi possível carregar esse estabelecimento agora. Tente novamente.</p>
        <Link href="/buscar" className="font-bold text-primary">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  if (!place) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: place.name,
    description: place.description ?? undefined,
    image: place.photoUrls.length > 0 ? place.photoUrls : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address,
      addressLocality: place.city,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
    telephone: place.phone ?? undefined,
    url: place.website ?? `${BASE_URL}/places/${place.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escapa "<" para impedir que texto controlado pelo lojista (nome/descrição)
        // feche a tag <script> prematuramente e injete HTML/JS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PlaceDetailView place={place} />
    </>
  );
}
