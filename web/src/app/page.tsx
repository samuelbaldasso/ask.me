'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Marca que o visitante já passou pela landing, pra não mostrar a
// apresentação de novo em cada visita — quem já conhece o produto vai
// direto pra busca. Ver buscar/page.tsx, que também seta essa flag ao
// carregar (cobre quem chega direto por link compartilhado).
const VISITED_KEY = 'askme_visited';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem(VISITED_KEY)) {
      router.replace('/buscar');
    }
  }, [router]);

  const markVisited = () => localStorage.setItem(VISITED_KEY, 'true');

  return (
    <div className="flex flex-col gap-16 py-4 sm:gap-24 sm:py-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Busca por IA em linguagem natural
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Pergunte como você fala.{' '}
          <span className="bg-gradient-to-br from-primary to-[#a855f7] bg-clip-text text-transparent">
            O ask.me entende.
          </span>
        </h1>
        <p className="max-w-xl text-base text-[#171123]/70 sm:text-lg">
          Nada de filtro por filtro. Pergunte &quot;sushi aberto agora perto de mim que aceite
          pet&quot; e a IA interpreta sua intenção e encontra o lugar certo — usando dados reais
          de estabelecimentos, nunca inventados.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/buscar"
            onClick={markVisited}
            className="rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-8 py-3.5 font-bold text-white transition hover:opacity-90"
          >
            Buscar perto de mim — grátis
          </Link>
          <Link
            href="/ask"
            onClick={markVisited}
            className="rounded-2xl border-2 border-primary px-8 py-3.5 font-bold text-primary transition hover:bg-primary/5"
          >
            Experimentar a IA
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          emoji="💬"
          title="Pergunte com suas palavras"
          text="Sem menus de filtro. Descreva o que você quer, do jeito que falaria com um amigo."
        />
        <FeatureCard
          emoji="📍"
          title="Sempre perto de você"
          text="Busca por proximidade real, com raio ajustável — de 500m a 50km."
        />
        <FeatureCard
          emoji="✅"
          title="Dados reais, sem invenção"
          text="A IA organiza e interpreta, mas nunca inventa estabelecimentos que não existem."
        />
      </section>

      <section className="flex flex-col items-center gap-4 rounded-[28px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-12">
        <span className="text-4xl" aria-hidden>
          👑
        </span>
        <h2 className="text-2xl font-extrabold text-[#171123]">
          Busca tradicional é sempre grátis
        </h2>
        <p className="max-w-md text-[#171123]/70">
          A busca por IA em linguagem natural é o benefício do{' '}
          <strong className="text-primary">ask.me Premium</strong>, por R$ 39,90/mês. Cancele
          quando quiser.
        </p>
        <Link
          href="/subscription"
          className="mt-2 rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
        >
          Ver planos
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[24px] bg-white p-6 shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="font-bold text-[#171123]">{title}</h3>
      <p className="text-sm text-[#171123]/70">{text}</p>
    </div>
  );
}
