'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingContent } from '@/components/landing-content';

// Marca que o visitante já passou pela landing, pra não mostrar a
// apresentação de novo em cada visita — quem já conhece o produto vai
// direto pra busca. Ver buscar/page.tsx, que também seta essa flag ao
// carregar (cobre quem chega direto por link compartilhado). A landing
// continua acessível a qualquer momento em /sobre, sem esse redirect.
const VISITED_KEY = 'askme_visited';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem(VISITED_KEY)) {
      router.replace('/buscar');
    }
  }, [router]);

  const markVisited = () => localStorage.setItem(VISITED_KEY, 'true');

  return <LandingContent onNavigate={markVisited} />;
}
