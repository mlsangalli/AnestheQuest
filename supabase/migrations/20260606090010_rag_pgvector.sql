-- =====================================================================
-- AnestheQuest — 0010: RAG sobre explicações com pgvector (Fase 3)
-- =====================================================================
-- Embeddings gerados por edge function (supabase/functions/embed-explanations).
-- Dimensão 1536 (ex.: text-embedding-3-small). Ajuste se trocar o modelo.

create extension if not exists vector;

create table public.explanation_embeddings (
  explanation_id uuid primary key references public.explanations(id) on delete cascade,
  embedding      vector(1536),
  updated_at     timestamptz not null default now()
);
create index idx_expl_emb on public.explanation_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.explanation_embeddings enable row level security;
-- Sem leitura direta pelo cliente; acesso só via match_explanations (gated).

-- Busca semântica gateada por assinatura ativa.
create or replace function public.match_explanations(
  query_embedding vector(1536),
  match_count int default 5
)
returns table(explanation_id uuid, question_id uuid, texto_geral text, similarity float)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_active_subscriber(auth.uid()) then
    raise exception 'active subscription required' using errcode = '42501';
  end if;
  return query
    select e.id, e.question_id, e.texto_geral,
           1 - (emb.embedding <=> query_embedding) as similarity
    from public.explanation_embeddings emb
    join public.explanations e on e.id = emb.explanation_id
    join public.questions q on q.id = e.question_id and q.status = 'publicada'
    order by emb.embedding <=> query_embedding
    limit match_count;
end;
$$;

grant execute on function public.match_explanations(vector, int) to authenticated;
