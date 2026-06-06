-- =====================================================================
-- AnestheQuest — 0003: Conteúdo (catálogo, questões, explicações, mídia)
-- =====================================================================
-- Conteúdo é leitura pública apenas para assinantes ativos (ver 0006_rls).

-- ----------------------------------------------------------------------
-- exams — provas/títulos (MVP: apenas TEA)
-- ----------------------------------------------------------------------
create table public.exams (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  descricao   text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- taxonomy — hierárquica (subject > system > topic), espelha a SBA.
-- A estrutura oficial será definida fora do código; aqui fica flexível.
-- ----------------------------------------------------------------------
create table public.taxonomy (
  id              uuid primary key default gen_random_uuid(),
  parent_id       uuid references public.taxonomy(id) on delete cascade,
  tipo            public.taxonomy_kind not null,
  nome            text not null,
  slug            text,
  ordem           int  not null default 0,
  is_placeholder  boolean not null default false,  -- taxonomia de exemplo (Fase 0)
  created_at      timestamptz not null default now()
);
create index idx_taxonomy_parent on public.taxonomy(parent_id);
-- Unicidade por (pai, nome), tratando raiz (parent_id nulo) corretamente.
create unique index uq_taxonomy_parent_nome
  on public.taxonomy (coalesce(parent_id::text, 'root'), nome);

-- ----------------------------------------------------------------------
-- questions — fluxo de status: rascunho -> em_revisao -> publicada
-- ----------------------------------------------------------------------
create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams(id) on delete restrict,
  enunciado    text not null,
  tipo         public.question_format     not null default 'unica_escolha',
  dificuldade  public.question_difficulty not null default 'media',
  status       public.question_status     not null default 'rascunho',
  versao       int  not null default 1,
  autor_id     uuid references auth.users(id) on delete set null,
  revisor_id   uuid references auth.users(id) on delete set null,
  enunciado_tsv tsvector generated always as
    (to_tsvector('public.pt_unaccent', coalesce(enunciado, ''))) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_questions_exam        on public.questions(exam_id);
create index idx_questions_status      on public.questions(status);
create index idx_questions_dificuldade on public.questions(dificuldade);
create index idx_questions_tsv         on public.questions using gin (enunciado_tsv);
create index idx_questions_trgm        on public.questions using gin (enunciado gin_trgm_ops);
create trigger trg_questions_updated_at before update on public.questions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- question_taxonomy — N:N entre questões e nós da taxonomia
-- ----------------------------------------------------------------------
create table public.question_taxonomy (
  question_id uuid not null references public.questions(id) on delete cascade,
  taxonomy_id uuid not null references public.taxonomy(id) on delete cascade,
  primary key (question_id, taxonomy_id)
);
create index idx_qtax_taxonomy on public.question_taxonomy(taxonomy_id);

-- ----------------------------------------------------------------------
-- choices — alternativas. is_correct é OCULTADO do cliente (ver 0006_rls);
-- a correção acontece no servidor via rpc grade_attempt (ver 0005).
-- ----------------------------------------------------------------------
create table public.choices (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  texto       text not null,
  is_correct  boolean not null default false,
  ordem       int  not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_choices_question on public.choices(question_id);

-- ----------------------------------------------------------------------
-- explanations — explicação geral (1:1 com a questão)
-- ----------------------------------------------------------------------
create table public.explanations (
  id                    uuid primary key default gen_random_uuid(),
  question_id           uuid not null unique references public.questions(id) on delete cascade,
  texto_geral           text not null,
  objetivo_educacional  text,
  referencias           text,
  texto_tsv tsvector generated always as
    (to_tsvector('public.pt_unaccent', coalesce(texto_geral, ''))) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index idx_explanations_question on public.explanations(question_id);
create index idx_explanations_tsv      on public.explanations using gin (texto_tsv);
create trigger trg_explanations_updated_at before update on public.explanations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- choice_explanations — justificativa por alternativa (1:1 com choice)
-- ----------------------------------------------------------------------
create table public.choice_explanations (
  id         uuid primary key default gen_random_uuid(),
  choice_id  uuid not null unique references public.choices(id) on delete cascade,
  texto      text not null,
  created_at timestamptz not null default now()
);
create index idx_choice_expl_choice on public.choice_explanations(choice_id);

-- ----------------------------------------------------------------------
-- media — polimórfica (owner_type + owner_id apontam p/ question ou explanation)
-- ----------------------------------------------------------------------
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  owner_type   public.media_owner not null,
  owner_id     uuid not null,
  tipo         public.media_kind  not null default 'imagem',
  url          text not null,
  storage_path text,           -- caminho no Supabase Storage (bucket question-media)
  alt_text     text,
  ordem        int  not null default 0,
  created_at   timestamptz not null default now()
);
create index idx_media_owner on public.media(owner_type, owner_id);
