# Deploy — colocar o AnestheQuest no ar

São 3 partes independentes:

| Parte | O que é | Onde hospedar |
|---|---|---|
| **Backend** | Supabase (Postgres + Auth + Storage + Edge Functions) | Supabase Cloud |
| **App** | Produto (Expo Web, SPA) | EAS Hosting (recomendado) ou Netlify/Vercel |
| **Landing** | Página de marketing (Next.js estático) | Vercel (ou qualquer host estático) |

> A **landing** sobe sozinha e funciona sem backend. O **app** precisa do
> Supabase configurado para login e conteúdo.

---

## Caminho mais rápido (só ver a UI no ar)

**Landing → Vercel** (≈2 min, totalmente funcional):
1. Importe o repo no Vercel.
2. **Root Directory = `web`**. Framework: Next.js (detectado). Deploy.
3. Pronto: URL pública da landing.

O app também pode subir como site estático (mostra a tela de login), mas só
loga/abre conteúdo depois do backend abaixo.

---

## 1) Backend — Supabase Cloud

```bash
npm i -g supabase
supabase login
supabase projects create anesthequest        # ou crie pelo dashboard
supabase link --project-ref <PROJECT_REF>

# aplica todas as migrations (schema + RLS + RPCs + pgvector)
supabase db push

# seed de exemplo (placeholder) — rode o conteúdo de supabase/seed.sql
#   via SQL Editor do dashboard, OU:
supabase db execute --file supabase/seed.sql   # (ou psql "$DATABASE_URL" -f supabase/seed.sql)

# edge functions
supabase functions deploy create-checkout stripe-webhook ai-assistant embed-explanations
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... \
  STRIPE_PRICE_ANUAL=price_... STRIPE_PRICE_RESIDENTE=price_... \
  SITE_URL=https://SEU-APP OPENAI_API_KEY=sk-...
```

Pegue **Project URL** e **anon key** em *Project Settings → API*.

**Usuário de teste com assinatura** (para ver o conteúdo gateado) — no SQL Editor:
```sql
-- crie um usuário em Authentication → Add user, copie o id e:
insert into public.subscriptions (user_id, plano, status, provider, current_period_end)
values ('<USER_ID>', 'anual', 'active', 'stripe', now() + interval '1 year');
```

Stripe (opcional p/ pagamento real): crie os preços, aponte o webhook para
`https://<PROJECT_REF>.functions.supabase.co/stripe-webhook` e copie o
*signing secret* para `STRIPE_WEBHOOK_SECRET`.

---

## 2) App — Expo Web (SPA)

O build precisa do monorepo (pacote `@anesthequest/core`), então **instale na raiz**.

### Opção A — EAS Hosting (recomendado: entende Expo Router + monorepo)
```bash
npm i -g eas-cli && eas login
# variáveis públicas (inlined no build):
export EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
export EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
npm ci
cd app && npx expo export -p web && npx eas deploy   # gera a URL
```

### Opção B — Netlify / Cloudflare Pages
- **Base/Root**: raiz do repo · **Build**: `npm ci && cd app && npx expo export -p web`
- **Publish dir**: `app/dist`
- Variáveis de build: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- O fallback SPA já vem de `app/public/_redirects` (copiado para `dist/`).

### Opção C — Vercel
- **Root Directory**: raiz do repo · **Install**: `npm ci`
- **Build**: `cd app && npx expo export -p web` · **Output**: `app/dist`
- Adicione um `vercel.json` (no projeto) com:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

---

## 3) Landing — Next.js (estático)

- **Vercel**: Root Directory = `web` (detecta Next.js). Deploy.
- **Estático em qualquer host**: `npm run web:build` → publique `web/out/`.

---

## Variáveis de ambiente (resumo)

| Variável | Onde | Observação |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | build do app | inlined; pode ir ao cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | secrets do Supabase (functions) | **nunca** no cliente |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` / `SITE_URL` | secrets do Supabase | edge functions |
| `OPENAI_API_KEY` (+ `OPENAI_*_MODEL`) | secrets do Supabase | RAG / embeddings |

Depois de publicar conteúdo, rode `embed-explanations` uma vez para habilitar o assistente de IA.
