## Ask.me — Plano de Implementação (Flutter + Node.js)

Antes de mergulhar: esse é um projeto grande — vamos tratá-lo como você trataria em uma empresa real, com MVP enxuto e fases de validação. Vou te dar o roadmap completo agora, mas a implementação em si vamos construir etapa por etapa, com revisão de código no caminho (como combinamos).

### Fase 0 — Fundação técnica (1-2 semanas)

**Objetivo:** decisões de arquitetura antes de escrever código de produto.

- Definir stack: Flutter (mobile) + Node.js/TypeScript (backend) — já é o que você domina profissionalmente, boa escolha para produtividade
- Arquitetura backend: API REST ou GraphQL? (para buscas com múltiplos filtros, GraphQL pode valer a pena — vamos discutir trade-offs quando chegar lá)
- Escolha de banco: Postgres com PostGIS (geolocalização) + talvez um vetorial (pgvector) para RAG
- Escolha do provedor de mapas: Google Places API vs OpenStreetMap/Nominatim (custo x cobertura)
- Escolha do LLM: API da Anthropic/OpenAI vs modelo self-hosted (para MVP, API gerenciada é o caminho certo)
- Setup de monorepo ou repositórios separados (mobile / backend)

### Fase 1 — Backend core (sem IA ainda)

**Objetivo:** provar que a busca geográfica básica funciona.

1. Modelagem de dados: estabelecimentos, categorias, horários de funcionamento, localização (lat/lng)
2. Endpoint de busca por proximidade (ex: "restaurantes num raio de 2km")
3. Integração com API de mapas para popular/enriquecer dados de estabelecimentos
4. Testes de integração para os endpoints de busca
5. Autenticação básica (JWT) — mesmo que o app não exija login no MVP, prepare a estrutura

### Fase 2 — App mobile básico (sem IA ainda)

**Objetivo:** app funcional que consome a API tradicional.

1. Setup do projeto Flutter (arquitetura: Clean Architecture ou MVVM — algo que você já está estudando em Kotlin, dá pra transportar os conceitos)
2. Tela de busca simples com filtros (categoria, distância, "aberto agora")
3. Integração com geolocalização do dispositivo (permissões, GPS)
4. Listagem de resultados em lista/mapa
5. Tela de detalhes do estabelecimento

### Fase 3 — Camada de IA (RAG)

**Objetivo:** transformar busca tradicional em busca por linguagem natural.

1. Endpoint que recebe pergunta em linguagem natural do usuário
2. Pipeline RAG: extrair intenção → gerar filtros estruturados (categoria, distância, horário) → consultar banco → montar resposta natural
3. Prompt engineering: o LLM interpreta, mas **nunca inventa dados** — só reorganiza o que veio do banco
4. Testes com perguntas variadas ("onde tem sushi aberto agora perto de mim e que aceite pet")
5. Fallback: quando a IA não entender, cair para busca tradicional com filtros

### Fase 4 — Integração mobile + IA

1. Tela de chat/busca conversacional no app
2. Streaming de resposta (UX de "digitando...")
3. Exibir resultados estruturados junto com a resposta em texto (cards de estabelecimentos)

### Fase 5 — MVP público e validação

1. Onboarding simples
2. Analytics básico (quantas buscas, retenção, taxa de conversão em clique)
3. Beta fechado com usuários reais
4. Métricas de retenção definidas antes de escalar

### Fase 6 — Escala (só depois de validar)

- Cache de buscas frequentes, rate limiting, observabilidade
- Otimização de custo de LLM (cache de embeddings, batch de requisições)
- Estratégia de monetização