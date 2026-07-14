# Ask.me Backend

API REST em Node.js + TypeScript para a plataforma Ask.me.

## Stack

- **Runtime**: Node.js 20+
- **Linguagem**: TypeScript 5
- **Framework**: Express 4
- **Banco**: PostgreSQL 16 + PostGIS + pgvector
- **ORM**: Prisma 5
- **Validação**: Zod
- **Testes**: Jest + Supertest

## Setup rápido

### Pré-requisitos

- Node.js 20+
- Docker + Docker Compose

### 1. Banco de dados

```bash
docker-compose up -d
```

### 2. Dependências

```bash
npm install
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com seus valores
```

### 4. Migrations + extensões PostGIS

```bash
npm run db:migrate
# Aplica schema Prisma + extensões PostGIS via SQL customizado
```

### 5. Dados

Seed fictício (desenvolvimento/testes):

```bash
npm run db:seed
```

Dados reais por geolocalização (requer `GOOGLE_PLACES_API_KEY` no `.env`):

```bash
npm run places:discover -- --lat=-22.3711 --lng=-41.7867 --city=Macaé --radius=5000
npm run places:enrich   # completa telefone/website dos places descobertos
```

`places:discover` busca estabelecimentos reais via Google Places Nearby Search
para as categorias do produto (restaurante, farmácia, pet-shop, supermercado)
e faz upsert idempotente por `google_place_id` — pode ser executado de novo
com segurança para atualizar nome/endereço/coordenadas.

### 6. Rodar em desenvolvimento

```bash
npm run dev
```

API disponível em `http://localhost:3000`.

---

## Endpoints

### `GET /health`

Verifica se o servidor está ativo.

```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### `GET /api/v1/places`

Busca estabelecimentos por proximidade.

**Parâmetros:**

| Parâmetro    | Tipo    | Obrigatório | Descrição                          |
|-------------|---------|-------------|-------------------------------------|
| `lat`        | float   | ✅           | Latitude do ponto central           |
| `lng`        | float   | ✅           | Longitude do ponto central          |
| `radius`     | int     | ❌           | Raio em metros (default: 5000)      |
| `category`   | string  | ❌           | Slug da categoria (ex: restaurante) |
| `openNow`    | boolean | ❌           | Filtrar apenas abertos agora        |
| `acceptsPets`| boolean | ❌           | Filtrar que aceitam pets            |
| `limit`      | int     | ❌           | Itens por página (default: 20)      |
| `offset`     | int     | ❌           | Offset para paginação               |

**Exemplo:**

```
GET /api/v1/places?lat=-23.5505&lng=-46.6333&radius=2000&category=restaurante&openNow=true
```

**Resposta:**

```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Sushi Sakura",
      "distanceMeters": 342,
      "category": { "slug": "restaurante", "label": "Restaurante" },
      "isOpenNow": true,
      "acceptsPets": true,
      ...
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

---

## Testes

```bash
npm test              # todos os testes
npm run test:unit     # unitários (sem banco)
npm run test:integration  # integração (requer banco)
```

---

## Arquitetura

```
src/
  config/       — variáveis de ambiente (Zod)
  controllers/  — recebe request, delega ao service, retorna response
  services/     — lógica de negócio e validação de entrada
  repositories/ — acesso ao banco (Prisma + SQL raw PostGIS)
  routes/       — registro de rotas Express
  middleware/   — auth JWT, error handler
  types/        — interfaces de domínio
  utils/        — helpers (schedule, etc.)
  db/           — cliente Prisma singleton + seed
```

## Dívidas técnicas (para a Fase 6)

- [ ] Filtro `openNow` atualmente aplicado em memória após busca — mover para SQL quando volume > 10k places
- [ ] Timezone por estabelecimento (hoje usa timezone do servidor)
- [ ] Cache de buscas frequentes (Redis)
- [ ] Observabilidade (traces, métricas de latência)
- [ ] Rate limiting por usuário autenticado (hoje é por IP)
