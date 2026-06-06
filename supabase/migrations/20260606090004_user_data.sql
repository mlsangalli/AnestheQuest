-- =====================================================================
-- AnestheQuest — 0004: Dados do usuário (privados ao dono)
-- =====================================================================

-- ----------------------------------------------------------------------
-- profiles — 1:1 com auth.users (criado por trigger, ver 0005)
-- ----------------------------------------------------------------------
create table public.profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  nome                text,
  crm                 text,
  especialidade_alvo  text,
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- sessions — blocos de estudo ("Criar Teste")
-- ----------------------------------------------------------------------
create table public.sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  modo            public.session_mode not null,
  filtros_json    jsonb not null default '{}'::jsonb,
  total_questions int,
  created_at      timestamptz not null default now(),
  finished_at     timestamptz
);
create index idx_sessions_user on public.sessions(user_id);

-- ----------------------------------------------------------------------
-- attempts — tentativas. INSERT só via rpc grade_attempt (ver 0005/0006).
-- ----------------------------------------------------------------------
create table public.attempts (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.sessions(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  question_id         uuid not null references public.questions(id) on delete cascade,
  choice_id_escolhida uuid references public.choices(id) on delete set null,
  correto             boolean not null,
  tempo_seg           int,
  flagged             boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (session_id, question_id)   -- uma resposta por questão por bloco
);
create index idx_attempts_user          on public.attempts(user_id);
create index idx_attempts_session       on public.attempts(session_id);
create index idx_attempts_question      on public.attempts(question_id);
create index idx_attempts_user_question on public.attempts(user_id, question_id);

-- ----------------------------------------------------------------------
-- flashcards — Fase 2 (tabela criada agora p/ compatibilidade do modelo)
-- ----------------------------------------------------------------------
create table public.flashcards (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  frente             text not null,
  verso              text not null,
  origem_question_id uuid references public.questions(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_flashcards_user on public.flashcards(user_id);
create trigger trg_flashcards_updated_at before update on public.flashcards
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- srs_state — Fase 2 (FSRS). 1:1 com flashcard.
-- ----------------------------------------------------------------------
create table public.srs_state (
  id           uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null unique references public.flashcards(id) on delete cascade,
  difficulty   double precision,
  stability    double precision,
  due_date     timestamptz,
  last_review  timestamptz,
  reps         int not null default 0,
  lapses       int not null default 0,
  state        int not null default 0,  -- FSRS: 0=new 1=learning 2=review 3=relearning
  learning_steps int not null default 0, -- passo atual na fase de aprendizado (FSRS short-term)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_srs_due on public.srs_state(due_date);
create trigger trg_srs_updated_at before update on public.srs_state
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- notebook_notes — "Meu Caderno"
-- ----------------------------------------------------------------------
create table public.notebook_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null,
  conteudo    text,
  taxonomy_id uuid references public.taxonomy(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_notes_user     on public.notebook_notes(user_id);
create index idx_notes_taxonomy on public.notebook_notes(taxonomy_id);
create trigger trg_notes_updated_at before update on public.notebook_notes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- subscriptions — 1 linha por usuário; escrita só via service role (webhooks)
-- ----------------------------------------------------------------------
create table public.subscriptions (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  plano                    public.subscription_plan     not null,
  status                   public.subscription_status   not null,
  provider                 public.subscription_provider not null,
  provider_customer_id     text,
  provider_subscription_id text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index idx_subscriptions_status on public.subscriptions(status);
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- analytics_aggregates — pré-computada por (usuário, nó de taxonomia)
-- ----------------------------------------------------------------------
create table public.analytics_aggregates (
  user_id     uuid not null references auth.users(id) on delete cascade,
  taxonomy_id uuid not null references public.taxonomy(id) on delete cascade,
  n_correct   int not null default 0,
  n_total     int not null default 0,
  n_timed     int not null default 0,   -- nº de tentativas com tempo_seg não-nulo (peso de avg_time)
  avg_time    double precision,
  updated_at  timestamptz not null default now(),
  primary key (user_id, taxonomy_id)
);
create index idx_analytics_user on public.analytics_aggregates(user_id);

-- ----------------------------------------------------------------------
-- question_feedback — "Reportar erro"
-- ----------------------------------------------------------------------
create table public.question_feedback (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        public.feedback_kind not null default 'outro',
  texto       text,
  resolvido   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_feedback_question on public.question_feedback(question_id);
create index idx_feedback_user     on public.question_feedback(user_id);
