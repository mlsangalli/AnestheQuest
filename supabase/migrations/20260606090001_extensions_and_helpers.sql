-- =====================================================================
-- AnestheQuest — 0001: Extensões, full-text search (PT-BR) e helpers
-- =====================================================================
-- Estas migrations assumem um projeto Supabase (schemas auth e storage
-- já existentes). Rode com `supabase db reset` / `supabase start`.

-- ----------------------------------------------------------------------
-- Extensões
-- ----------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- busca fuzzy / similaridade
create extension if not exists unaccent;   -- busca insensível a acentos

-- ----------------------------------------------------------------------
-- Configuração de full-text search em português, insensível a acentos.
-- Usada nas colunas tsvector geradas (ex.: questions.enunciado_tsv).
-- ----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'pt_unaccent') then
    create text search configuration public.pt_unaccent ( copy = portuguese );
    alter text search configuration public.pt_unaccent
      alter mapping for hword, hword_part, word
      with unaccent, portuguese_stem;
  end if;
end
$$;

-- ----------------------------------------------------------------------
-- Trigger genérico para manter updated_at
-- ----------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
