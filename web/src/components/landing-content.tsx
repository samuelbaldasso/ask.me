import Link from 'next/link';

export function LandingContent({ onNavigate }: { onNavigate?: () => void }) {
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
            onClick={onNavigate}
            className="rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-8 py-3.5 font-bold text-white transition hover:opacity-90"
          >
            Buscar perto de mim — grátis
          </Link>
          <Link
            href="/ask"
            onClick={onNavigate}
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
          🎉
        </span>
        <h2 className="text-2xl font-extrabold text-[#171123]">
          100% grátis para quem busca
        </h2>
        <p className="max-w-md text-[#171123]/70">
          Busca tradicional e busca por IA em linguagem natural — sem mensalidade,
          sem cartão de crédito.
        </p>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-[28px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-12">
        <span className="text-4xl" aria-hidden>
          🏪
        </span>
        <h2 className="text-2xl font-extrabold text-[#171123]">Dono de um negócio?</h2>
        <p className="max-w-md text-[#171123]/70">
          Reivindique seu estabelecimento, gerencie seu perfil e acompanhe quantas
          pessoas te encontraram — assine para aparecer em destaque.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 rounded-2xl border-2 border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
        >
          Painel do lojista
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
