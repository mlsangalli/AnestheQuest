# AnestheQuest

Plataforma de **questões médicas comentadas de Anestesiologia** para o mercado
brasileiro (foco inicial: **TEA** — Título de Especialista em Anestesiologia/SBA).
Replica a *lógica de aprendizado* do UWorld — **não** o conteúdo.

> **Status:** Fase 0 (Fundação) concluída. Veja [Roadmap](#roadmap).

Os três pilares do produto: **explicação como produto** (justificativa por
alternativa), **realismo de prova** (timer, flag, highlight, strikethrough) e
**analytics que orientam o estudo**.

---

## Arquitetura (monorepo)

```
app/              # Produto — Expo (React Native + Web) com Expo Router
web/              # Landing page — Next.js 15 (estática)
packages/core/    # Lógica compartilhada: tipos do banco, pontuação, preços, client Supabase
supabase/
  migrations/     # Schema versionado + RLS (SQL)
  tests/          # Testes de RLS (pgTAP)
  seed.sql        # Taxonomia + questões PLACEHOLDER (Fase 0)
  config.toml     # Config do Supabase CLI (dev local)
.env.example      # Template de variáveis de ambiente
```

**Stack:** TypeScript em tudo · Expo/Expo Router · Next.js · Supabase
(Postgres + Auth + Storage + RLS) · busca FTS em português (`tsvector` +
`pg_trgm` + `unaccent`) · Stripe (web, Fase 1) · RevenueCat (mobile, gancho).

---

## Pré-requisitos

- **Node.js** ≥ 20 e npm ≥ 10 (workspaces)
- **Supabase CLI** — https://supabase.com/docs/guides/cli
- **Docker** (necessário para o Supabase local)

---

## Setup rápido

```bash
# 1. Dependências (instala todos os workspaces)
npm install

# 2. Variáveis de ambiente
cp .env.example app/.env          # app Expo
cp .env.example web/.env.local    # web Next.js (opcional na Fase 0)

# 3. Sobe o Supabase local (Postgres + Auth + Studio)
npm run db:start
#    -> copie a "anon key" e a "service_role key" exibidas para os .env
#    -> Studio: http://localhost:54323 | API: http://localhost:54321

# 4. Aplica migrations + seed
npm run db:reset
```

### Rodar o app (produto)

```bash
npm run app          # Expo (escolha web/iOS/Android no menu)
npm run app:web      # direto no navegador (http://localhost:8081)
```

### Rodar a landing (web)

```bash
npm run web          # http://localhost:3000
```

> Em monorepo, o Expo às vezes precisa reconciliar versões nativas:
> `cd app && npx expo install --fix`.

---

## Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Onde | Observação |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | `app/.env` | cliente Expo |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | `web/.env.local` | cliente web |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | **nunca** no cliente |
| `STRIPE_*` | servidor (Fase 1) | chaves de teste |

A `anon key` e a `service_role key` locais aparecem no output de `npm run db:start`.

---

## Banco de dados

Migrations versionadas em `supabase/migrations/` (rodam em ordem):

| Arquivo | Conteúdo |
|---|---|
| `…_extensions_and_helpers` | `pgcrypto`, `pg_trgm`, `unaccent`, config FTS `pt_unaccent`, `set_updated_at()` |
| `…_enums` | tipos enumerados |
| `…_content` | catálogo, questões, alternativas, explicações, mídia |
| `…_user_data` | perfis, sessões, tentativas, flashcards, caderno, assinaturas, analytics |
| `…_functions` | `is_active_subscriber()`, `handle_new_user()`, `grade_attempt()`, `set_attempt_flag()` |
| `…_rls` | Row-Level Security + ocultação da coluna `is_correct` |
| `…_storage` | bucket `question-media` + policy |
| `…_session_rpcs` | `create_session` / `count_questions` / `finish_session` (filtros + taxonomia) |
| `…_simulados` | `simulado_results` + `record_simulado` (percentil de pares) |
| `…_rag_pgvector` | `explanation_embeddings` + `match_explanations` (RAG, Fase 3) |

Comandos:

```bash
npm run db:reset     # recria o schema e roda o seed
npm run db:test      # testes de RLS (pgTAP)
npm run gen:types    # regenera packages/core/src/types/database.types.ts
```

### Segurança (RLS) — resumo

- **Catálogo** (`exams`, `taxonomy`): legível por qualquer autenticado.
- **Conteúdo** (`questions`, `choices`, `explanations`, `media`…): apenas
  **assinantes ativos** e somente questões **`publicada`**.
- **`choices.is_correct` nunca vai ao cliente** (privilégio de coluna revogado);
  a correção acontece no servidor via `grade_attempt()` — que valida sessão,
  assinatura e publicação, grava a tentativa e atualiza os agregados.
- **Dados do usuário** (tentativas, notas, flashcards, assinatura): só o dono.
- **Escritas de conteúdo/assinatura**: só via service role (equipe/webhooks).

### Criar um usuário de teste com assinatura (dev)

Crie um usuário no Studio (Auth → Add user), copie o `user_id` e rode no SQL Editor:

```sql
insert into public.subscriptions (user_id, plano, status, provider, current_period_end)
values ('<USER_ID>', 'anual', 'active', 'stripe', now() + interval '1 year');
```

---

## Edge Functions (Supabase, Deno)

Em `supabase/functions/`:

| Função | Uso | Env |
|---|---|---|
| `create-checkout` | Stripe Checkout para um plano (web) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `SITE_URL` |
| `stripe-webhook` | Sincroniza `subscriptions` (service role) | `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| `embed-explanations` | Gera embeddings das explicações (RAG) | `OPENAI_API_KEY` |
| `ai-assistant` | Assistente RAG (gateado por assinatura) | `OPENAI_API_KEY` |

```bash
supabase functions serve            # local
supabase functions deploy create-checkout stripe-webhook ai-assistant embed-explanations
supabase secrets set STRIPE_SECRET_KEY=... OPENAI_API_KEY=...   # produção
```

`stripe-webhook` e `embed-explanations` rodam sem JWT de usuário (ver `config.toml`).

## Testes

```bash
npm test             # lógica de pontuação/tentativas (Vitest, em packages/core)
npm run db:test      # políticas de RLS (pgTAP, requer Supabase local)
```

---

## Conteúdo: original e revisado

Todo enunciado, explicação e ilustração é **autoral** e passa por **revisão de
anestesiologista**. O fluxo de status reflete isso: `rascunho → em_revisao →
publicada`. O seed da Fase 0 usa **apenas placeholders fictícios** (marcados),
e a taxonomia é provisória — a matriz oficial da SBA será inserida depois.

---

## Roadmap

- [x] **Fase 0 — Fundação:** monorepo, schema + RLS, seed placeholder, scaffold Expo, client tipado, testes de pontuação e RLS.
- [x] **Fase 1 — MVP:** auth + perfil, Criar Teste, player (timer/flag/highlight/strikethrough/grade), explicação tutor, analytics, caderno, feedback, paywall (Stripe via edge function).
- [x] **Fase 2 — Retenção:** flashcards + FSRS (`ts-fsrs`), simulados, percentil de pares.
- [x] **Fase 3 — IA e offline:** RAG (`pgvector`) + assistente de IA, cache offline (React Query + AsyncStorage), plano de estudos.

> O conteúdo (questões/explicações) continua placeholder até a curadoria
> clínica. Stripe/OpenAI exigem chaves para funcionar de ponta a ponta; o
> código já está pronto e os fluxos degradam com mensagens claras quando
> as chaves/funções não estão configuradas.

### Estrutura do app (Expo Router)

```
app/app/
  (auth)/sign-in        login / cadastro / magic link
  (app)/                tabs: Início · Desempenho · Caderno · Perfil
  criar-teste           montagem de bloco
  sessao/[id]           player de questões
  resultado/[id]        resultado + percentil
  flashcards            revisão FSRS
  assistente            assistente de IA (RAG)
  plano                 plano de estudos
  paywall               planos / assinatura
```
