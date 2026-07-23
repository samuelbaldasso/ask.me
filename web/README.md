# ask.me — web (Next.js)

Reconstrução do app Flutter (`../front`) como site, consumindo a mesma API
Node/Express em `../backend`. Ver plano completo em `../docs/web-plan.md`.

## Rodando localmente

1. Backend em `../backend` rodando em `http://localhost:3000`
2. `cp .env.local.example .env.local` e ajuste `NEXT_PUBLIC_API_BASE_URL` se necessário
3. `npm install`
4. `npm run dev` — abre em [http://localhost:3000](http://localhost:3000) (ou outra porta, se o backend já ocupar a 3000)

## Estrutura (Fase 1)

- `src/app/` — rotas (App Router) e layout raiz com tema/nav
- `src/components/nav-bar.tsx` — navegação global
- `src/lib/types.ts` — tipos espelhando os models do app Flutter (`Place`, `SearchFilters`, etc.)
- `src/lib/api/client.ts` — cliente HTTP fino sobre `fetch`, equivalente ao `ApiClient` (Dio) do Flutter
- `src/lib/api/endpoints.ts` — wrappers tipados para cada endpoint do backend
