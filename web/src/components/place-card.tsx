import Link from 'next/link';
import { categoryStyleForSlug } from '@/lib/category-style';
import { distanceLabel, type Place } from '@/lib/types';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-1 text-xs font-bold"
      style={{ color, backgroundColor: `${color}1F` }}
    >
      {label}
    </span>
  );
}

export function PlaceCard({ place }: { place: Place }) {
  const style = categoryStyleForSlug(place.category.slug);

  return (
    <Link
      href={`/places/${place.id}`}
      className="flex items-start gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_6px_16px_rgba(124,58,237,0.06)] transition hover:shadow-[0_8px_20px_rgba(124,58,237,0.1)]"
    >
      <div
        className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ backgroundColor: `${style.color}24`, width: 52, height: 52 }}
      >
        <span aria-hidden>{style.emoji}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate font-bold text-[#171123]">
            {place.name}
          </span>
          <span className="shrink-0 text-xs font-bold text-primary">
            {distanceLabel(place.distanceMeters)}
          </span>
        </div>
        <p className="truncate text-sm text-[#171123]/60">
          {place.category.label} · {place.address}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {place.isOpenNow !== null && (
            <Badge
              label={place.isOpenNow ? 'Aberto agora' : 'Fechado'}
              color={place.isOpenNow ? '#22C55E' : '#EF4444'}
            />
          )}
          {place.acceptsPets && <Badge label="Pets" color="#3B82F6" />}
          {place.acceptsCards && <Badge label="Cartão" color="#64748B" />}
          {place.hasParking && <Badge label="Estacionamento" color="#64748B" />}
        </div>
      </div>
    </Link>
  );
}
