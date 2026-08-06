import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Anuncie seu negócio',
  description:
    'Apareça em destaque para quem já está buscando o seu tipo de negócio perto de casa. Assinatura fixa de R$ 99,90/mês, sem complexidade de gestão de campanhas.',
};

export default function AnunciePage() {
  return (
    <div className="flex flex-col gap-16 py-4 sm:gap-24 sm:py-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Para donos de estabelecimentos locais
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Capturando a{' '}
          <span className="bg-gradient-to-br from-primary to-[#a855f7] bg-clip-text text-transparent">
            demanda local
          </span>
        </h1>
        <p className="max-w-xl text-base text-[#171123]/70 sm:text-lg">
          Todos os dias, pessoas do seu bairro pesquisam ativamente por
          negócios como o seu. O ask.me conecta essa intenção de busca
          diretamente à sua porta — sem o custo e a complexidade dos anúncios
          tradicionais.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-8 py-3.5 font-bold text-white transition hover:opacity-90"
          >
            Seja um parceiro fundador
          </Link>
          <Link
            href="/buscar"
            className="rounded-2xl border-2 border-primary px-8 py-3.5 font-bold text-primary transition hover:bg-primary/5"
          >
            Ver como funciona a busca
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard value="1.120" label="Cliques intencionais em 7 dias" />
        <StatCard value="R$ 0,19" label="Custo médio por clique" />
        <StatCard value="8%+" label="Taxa de engajamento (CTR)" />
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-12">
        <h2 className="text-2xl font-extrabold text-[#171123]">Como funciona para você</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <StepCard
            emoji="🔎"
            title="1. Usuário busca"
            text="O cliente pesquisa ativamente por serviços e restaurantes locais na nossa plataforma, de forma 100% gratuita."
          />
          <StepCard
            emoji="🤖"
            title="2. IA recomenda"
            text="Nossa IA processa a intenção de busca, cruza dados de localização e dá preferência aos parceiros premium."
          />
          <StepCard
            emoji="🏪"
            title="3. Você fatura"
            text="Seu negócio ganha destaque nas sugestões, capturando o cliente no momento exato da necessidade."
          />
        </div>
      </section>

      <section className="overflow-x-auto rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-8">
        <h2 className="mb-4 text-2xl font-extrabold text-[#171123]">
          Por que ser um parceiro fundador?
        </h2>
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#EDE7FB] text-[#171123]/50">
              <th className="py-2 pr-4 font-bold">Critério</th>
              <th className="py-2 pr-4 font-bold">Anúncios tradicionais</th>
              <th className="py-2 font-bold">Parceria ask.me</th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Custo de aquisição"
              traditional="R$ 2,00 a R$ 10,00 por clique"
              askme="Diluído na assinatura mensal"
            />
            <ComparisonRow
              label="Complexidade técnica"
              traditional="Alta — gestão de campanhas, tags, etc."
              askme="Zero. O ask.me gera o tráfego."
            />
            <ComparisonRow
              label="Previsibilidade de gastos"
              traditional="Flutuante, orçamento diário"
              askme="Taxa fixa e controlada"
            />
            <ComparisonRow
              label="Público-alvo"
              traditional="Genérico"
              askme="Hiper-localizado (fundo de funil)"
            />
          </tbody>
        </table>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-[28px] bg-gradient-to-br from-primary to-[#a855f7] p-8 text-center text-white sm:p-12">
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">
          Riscos mínimos. Retorno imediato.
        </p>
        <p className="text-5xl font-extrabold sm:text-6xl">
          R$ 99,90<span className="text-lg font-bold opacity-80">/mês</span>
        </p>
        <p className="max-w-md text-sm opacity-90 sm:text-base">
          Se a plataforma direcionar apenas um único cliente novo para a sua
          porta a cada 30 dias, a assinatura já se pagou. Daí em diante, é
          lucro puro e fidelização em escala.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 rounded-2xl bg-white px-8 py-3.5 font-bold text-primary transition hover:opacity-90"
        >
          Junte-se ao grupo de parceiros fundadores
        </Link>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[24px] bg-white p-6 text-center shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
      <span className="text-3xl font-extrabold text-primary">{value}</span>
      <span className="text-sm font-semibold text-[#171123]/70">{label}</span>
    </div>
  );
}

function StepCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="font-bold text-[#171123]">{title}</h3>
      <p className="text-sm text-[#171123]/70">{text}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  traditional,
  askme,
}: {
  label: string;
  traditional: string;
  askme: string;
}) {
  return (
    <tr className="border-b border-[#EDE7FB]/60">
      <td className="py-3 pr-4 font-bold text-[#171123]">{label}</td>
      <td className="py-3 pr-4 text-[#171123]/60">{traditional}</td>
      <td className="py-3 font-semibold text-primary">{askme}</td>
    </tr>
  );
}
