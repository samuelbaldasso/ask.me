# Ask.me

Plataforma de busca inteligente por estabelecimentos baseada em geolocalização e linguagem natural. O usuário pergunta em linguagem natural (ex: *"sushi aberto agora perto de mim que aceite pet"*) e recebe estabelecimentos reais, filtrados por um pipeline RAG — o LLM interpreta a intenção e organiza a resposta, mas **nunca inventa dados**: tudo vem do banco.

O produto é B2C na entrada (busca gratuita) e B2B na monetização: lojistas pagam por um painel (`/dashboard`) para gerenciar a própria página de estabelecimento.

## Monorepo

```
ask.me/
├── backend/   # API REST — Node.js + TypeScript + Prisma + PostgreSQL/PostGIS
├── front/     # App mobile — Flutter (iOS/Android)
├── web/       # Site — Next.js (React + TypeScript)
└── docs/      # Planejamento, prompt de agente, páginas estáticas (privacidade, como usar)
```

Os três clientes (`front/`, `web/`) consomem a mesma API REST em `backend/`, sob `/api/v1/...`. Não há BFF nem GraphQL — decisão deliberada (ver [ADR-002](#adr-002-rest-em-vez-de-graphql)).

---

## Stack por camada

| Camada | Tecnologia | Detalhe |
|---|---|---|
| Mobile | Flutter/Dart | Clean Architecture por feature (`data`/`presentation`), `provider` para state |
| Web | Next.js 16 (App Router) + React 19 + TypeScript | Tailwind v4, `react-markdown` para respostas do chat |
| Backend | Node.js + TypeScript + Express | Camadas `routes → controllers → services → repositories` |
| Banco | PostgreSQL + PostGIS | Geolocalização nativa (raio de busca) |
| ORM | Prisma | Migrations + client tipado |
| LLM | Anthropic API (`@anthropic-ai/sdk`) | Camada de interpretação/apresentação, não fonte de dados |
| Mapas | Google Places API | Enriquecimento e descoberta automática de estabelecimentos |
| Auth | JWT + Google Sign-In (OAuth) | Token próprio da aplicação emitido após validar `idToken` do Google |
| Pagamentos | Stripe (Checkout + Billing Portal) | Assinatura mensal do plano B2B |
| Deploy | Railway (backend/db) + Vercel (web) | Migrations automatizadas no `preDeployCommand` |

---

## Backend (`backend/`)

API REST em Express, TypeScript e Prisma, organizada em camadas:

```
src/
├── config/        # env.ts (validação de variáveis), categories.ts
├── routes/        # admin, ask, auth, business, favorites, geocode, places, subscriptions
├── controllers/    # tradução HTTP ↔ service
├── services/       # regra de negócio (auth, subscription, discovery, nlSearch, maps...)
├── repositories/   # acesso a dados via Prisma
├── middleware/      # auth (JWT), errorHandler
└── db/             # seed, migrações auxiliares, scripts de enrich/discover de places
```

**Modelo de dados** (`prisma/schema.prisma`): `User`, `Subscription`, `Category`, `Place`, `OpeningHours`, `PlaceAttribute`, `PlaceEvent` (analytics de clique), `Favorite`, `BusinessClaim` (reivindicação de estabelecimento por lojista), `DiscoveredRegion` (controle de áreas já varridas via Google Places).

**Endpoints principais**:
- `GET /places` — busca tradicional (categoria, raio, "aberto agora", aceita pet)
- `POST /ask` — busca por linguagem natural (RAG); sem `ANTHROPIC_API_KEY`, cai automaticamente para busca tradicional; **não exige login** (decisão de produto, ver histórico de commits)
- `POST /auth/google` — troca `idToken` do Google por JWT próprio
- `GET/POST/DELETE /favorites` — autenticado
- `POST /subscriptions/checkout|portal`, `GET /subscriptions/me` — Stripe
- `/business/*` — painel do lojista: reivindicar estabelecimento, editar fotos/horário, fila de revisão manual
- `/admin/*` — restrito a superadmin

**Rodando localmente**:
```bash
cd backend
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET etc.
docker compose up -d   # sobe Postgres + PostGIS via infra/Dockerfile
npm install
npm run db:migrate
npm run dev             # tsx watch src/server.ts
```

**Testes**: `npm test` (Jest, `--runInBand`), com `test:unit` e `test:integration` separados.

---

## Mobile (`front/`)

App Flutter organizado por feature, cada uma com `data/` (repositórios, DTOs) e `presentation/` (telas, view models via `provider`):

```
lib/
├── core/
│   ├── config/     # AppConfig — base URL da API, chaves públicas
│   ├── models/     # Place, Category, SearchFilters, User, SubscriptionStatus...
│   ├── network/    # ApiClient (Dio) — timeout, injeção de Authorization: Bearer
│   ├── services/   # geolocalização, storage seguro do JWT
│   └── theme/      # paleta #7C3AED / #FBF9FF
└── features/
    ├── search/         # busca tradicional, filtros, lista/detalhe
    ├── ai_search/       # chat conversacional (RAG)
    ├── place_detail/
    ├── favorites/
    ├── account/         # login Google, sessão
    ├── business/        # painel do lojista (B2B)
    └── admin/           # área restrita
```

**Autenticação**: Google Sign-In → `idToken` enviado a `POST /auth/google` → JWT guardado em `flutter_secure_storage`.

**Rodando localmente**:
```bash
cd front
flutter pub get
flutter run
```

---

## Web (`web/`)

Site em Next.js (App Router) — reconstrução do app Flutter para browser, consumindo o **mesmo backend**, sem alterar a API (ver [ADR-004](#adr-004-web-como-cliente-adicional-não-como-substituto)).

```
src/
├── app/
│   ├── page.tsx (busca tradicional) │ ask/ (chat RAG) │ places/[id]/
│   ├── favorites/ │ login/ │ dashboard/ (painel do lojista) │ admin/
│   ├── anuncie/ (landing B2B) │ sobre/ (landing pública)
├── components/
└── lib/
    ├── api/       # cliente HTTP central, equivalente ao ApiClient do Flutter
    ├── auth/      # estado de sessão
    └── favorites/
```

**Rodando localmente**:
```bash
cd web
npm install
npm run dev   # NEXT_PUBLIC_API_BASE_URL apontando para o backend local
```

---

## Decisões de arquitetura (ADRs)

Registro leve das decisões que moldaram o projeto — o objetivo é que trade-offs não se percam, mesmo sem um processo formal de ADR por arquivo.

### ADR-001: Stack fixa — Flutter + Node/TypeScript + Postgres/PostGIS
**Contexto:** o fundador mantém emprego CLT durante a fase inicial — prioridade é baixo custo operacional e baixa manutenção sobre soluções "ideais" que exigem dedicação full-time.
**Decisão:** Flutter (mobile, já dominado profissionalmente) + Node.js/TypeScript (backend) + PostgreSQL/PostGIS (geolocalização nativa) + LLM via API gerenciada (Anthropic) em vez de self-hosted.
**Consequência:** produtividade alta no MVP; revisitar self-hosted de LLM só após validar tração (Fase 6 do roadmap em `docs/agent.md`).

### ADR-002: REST em vez de GraphQL
**Contexto:** filtros de busca (categoria, raio, "aberto agora", pet) são conhecidos e limitados no MVP.
**Decisão:** API REST simples (`/places`, `/ask`, etc.) em vez de GraphQL.
**Consequência:** menos infraestrutura para manter; reavaliar GraphQL só se os filtros ficarem combinatorialmente complexos.

### ADR-003: LLM como camada de interpretação, nunca como fonte de dados
**Contexto:** o risco de produto mais crítico é o LLM "alucinar" estabelecimentos que não existem.
**Decisão:** o pipeline RAG (`nlSearchService`) sempre consulta o banco primeiro; o LLM só reorganiza/explica resultados reais. Sem `ANTHROPIC_API_KEY`, `POST /ask` cai automaticamente para busca tradicional (fallback obrigatório, nunca erro).
**Consequência:** toda chamada a LLM tem fallback determinístico; é um padrão de qualidade não-negociável (ver `docs/agent.md`).

### ADR-004: Web como cliente adicional, não como substituto
**Contexto:** o app Flutter (`front/`) já existia; era preciso alcançar usuários sem instalar app e ganhar SEO.
**Decisão:** `web/` em Next.js consome o backend existente sem modificá-lo — mesmo contrato de API dos dois clientes. Mapeamento completo de features em `docs/web-plan.md`.
**Consequência:** zero duplicação de regra de negócio no backend; o custo é manter dois clientes com UX equivalente.

### ADR-005: Pivô de monetização — B2C grátis, B2B pago
**Contexto:** cobrar do consumidor final (`R$ 39,90` → depois `R$ 20`) mostrou fricção alta em validação.
**Decisão:** busca por IA fica 100% aberta e grátis para o consumidor; monetização passa a ser um painel B2B (`/dashboard`) para lojistas gerenciarem a própria página (fotos, horário, canais de contato), com plano de `R$ 99,90/mês`.
**Consequência:** removeu paywall e checagem de assinatura do lado consumidor; adicionou fluxo de reivindicação de estabelecimento (`BusinessClaim`) com fila de revisão manual antes de aprovação automática.

### ADR-006: Descoberta de estabelecimentos via Google Places, não curadoria manual
**Contexto:** popular o banco de estabelecimentos manualmente não escala.
**Decisão:** `discoveryService` varre regiões via Google Places API e persiste em `DiscoveredRegion` para não reprocessar a mesma área; `placeService`/`mapsService` enriquecem dados (horário, atributos) sob demanda.
**Consequência:** dependência de custo/cota da API do Google — é uma decisão de custo x cobertura assumida conscientemente (ver `docs/plan.md`, Fase 0).

### ADR-007: Segurança tratada como dívida ativa, corrigida incrementalmente
**Contexto:** commits recentes corrigiram: XSS armazenado via `javascript:` URL (cardápio/JSON-LD no site), CORS aberto sem allowlist, ausência de security headers, URL interna da Vercel vazando em sitemap/robots/Stripe, `.env` vazando em testes de integração.
**Decisão:** cada achado de segurança vira commit dedicado e imediato, não backlog; `helmet`, `express-rate-limit` e `ALLOWED_ORIGIN` (CORS restrito) são padrão desde o início da API.
**Consequência:** superfície de ataque revisada continuamente; qualquer nova rota/cliente deve manter CORS restrito e nunca reintroduzir segredos em código versionado.

---

## Documentação complementar

- [`docs/plan.md`](docs/plan.md) — roadmap de implementação por fases (fundação → backend → mobile → RAG → MVP → escala)
- [`docs/web-plan.md`](docs/web-plan.md) — plano de conversão Flutter → Next.js, mapeamento de features
- [`docs/agent.md`](docs/agent.md) — prompt de referência para agentes de IA atuando como tech lead no projeto (padrões de qualidade, restrições de negócio)
- [`docs/privacy-policy.html`](docs/privacy-policy.html), [`docs/how-to-use.html`](docs/how-to-use.html) — páginas estáticas públicas
