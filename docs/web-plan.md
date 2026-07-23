# Ask.me Web — Plano de conversão Flutter → Next.js (React)

Objetivo: reconstruir o app Flutter (`front/`) como um site em Next.js (React + TypeScript), consumindo o mesmo backend Node/Express já existente em `backend/` (API REST, `/api/v1/...`). O backend **não muda** — só o cliente.

Novo código vai em `web/` (irmão de `front/` e `backend/`), para não misturar com o app mobile existente.

Mapeamento de features (Flutter → Web):

| Flutter (`front/lib/features`) | Rota web equivalente |
|---|---|
| `search/` (lista + filtros) | `/` (busca tradicional) |
| `ai_search/` (chat RAG) | `/ask` (busca por linguagem natural) |
| `place_detail/` | `/places/[id]` |
| `favorites/` | `/favorites` (autenticado) |
| `account/` (login Google) | `/login`, NextAuth ou fluxo próprio |
| `subscription/` (Stripe) | `/subscription` (checkout + portal) |

APIs do backend já existentes e reaproveitadas como estão: `GET /places`, `POST /ask`, `POST /auth/google`, `GET/POST/DELETE /favorites`, `POST /subscriptions/checkout|portal`, `GET /subscriptions/me`.

---

## Fase 1 — Fundação do projeto Next.js (esta fase, implementada agora)

**Objetivo:** projeto Next.js rodando, com estrutura, tema, cliente HTTP e tipos — sem telas de produto ainda.

1. Scaffold Next.js 14+ (App Router) + TypeScript + Tailwind em `web/`
2. Variáveis de ambiente (`NEXT_PUBLIC_API_BASE_URL`) espelhando `AppConfig` do Flutter
3. Cliente HTTP central (`lib/api/client.ts`) — equivalente ao `ApiClient` (Dio) do Flutter: baseURL, timeout, injeção de `Authorization: Bearer` a partir do token guardado
4. Tipos TypeScript espelhando os models Dart (`Place`, `Category`, `SearchFilters`, `PaginatedResult`, `User`, `SubscriptionStatus`, `AskResult`)
5. Tema global (paleta `#7C3AED` / `#FBF9FF`, já usada no branding do app) via Tailwind config
6. Layout raiz (header/nav com links para Busca, Perguntar, Favoritos, Conta) sem lógica de auth ainda
7. Lint/format (ESLint + Prettier) e scripts (`dev`, `build`, `lint`, `typecheck`)

## Fase 2 — Busca tradicional (sem IA)

1. Página `/` com formulário de filtros (categoria, raio, "aberto agora", aceita pets) — equivalente a `filter_bar.dart`
2. Geolocalização do navegador (`navigator.geolocation`) substituindo `geolocator`/`location_service.dart`
3. Consumo de `GET /places`, paginação, cards de resultado (`place_card.dart` → componente React)
4. Página `/places/[id]` com detalhe do estabelecimento

## Fase 3 — Autenticação

1. Login com Google (OAuth no browser) → `POST /auth/google` com idToken, guarda JWT (cookie httpOnly ou localStorage)
2. Estado de sessão global (context/provider) equivalente a `auth_view_model.dart`
3. Proteção de rotas autenticadas (`/favorites`, `/subscription`)

## Fase 4 — Busca por IA (RAG)

1. Página `/ask` com UI de chat (bolhas de mensagem, indicador de "digitando") — porta de `chat_bubble.dart`/`typing_indicator.dart`
2. Streaming/polling de `POST /ask`, exibindo resposta em texto + cards estruturados dos places retornados
3. Histórico de conversa em memória (client-side)

## Fase 5 — Favoritos e assinatura

1. `/favorites`: listar, adicionar, remover (`GET/POST/DELETE /favorites`)
2. `/subscription`: status atual (`GET /subscriptions/me`), iniciar Checkout (`POST /subscriptions/checkout`), abrir Billing Portal (`POST /subscriptions/portal`)

## Fase 6 — Polimento e deploy

1. Responsividade mobile-first (site deve funcionar tão bem quanto o app)
2. SEO básico (metadata, sitemap) — vantagem do Next.js sobre o app
3. Deploy (Vercel ou similar) + CORS no backend liberado para o domínio do site
4. Página de privacidade já existe (`docs/privacy-policy.html`) — portar/link para o site
