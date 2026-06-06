-- =====================================================================
-- AnestheQuest — 0009: Simulados + percentil de pares (Fase 2)
-- =====================================================================

create table public.simulado_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  session_id uuid unique references public.sessions(id) on delete cascade,
  n_correct  int not null,
  n_total    int not null,
  score      numeric(5,2) not null,  -- 0..100
  created_at timestamptz not null default now()
);
create index idx_simulado_user on public.simulado_results(user_id);

alter table public.simulado_results enable row level security;
create policy simulado_select on public.simulado_results
  for select using (user_id = auth.uid());
-- INSERT só via record_simulado (security definer).

-- Calcula score do simulado a partir das tentativas e devolve o percentil
-- de pares (quantos % dos resultados ficaram <= o seu).
create or replace function public.record_simulado(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total int; v_correct int; v_score numeric; v_pct numeric; v_id uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.sessions s where s.id = p_session_id and s.user_id = v_user) then
    raise exception 'session not found or not owned by user' using errcode = '42501';
  end if;

  select count(*), count(*) filter (where correto)
    into v_total, v_correct
    from public.attempts where session_id = p_session_id and user_id = v_user;

  if v_total = 0 then
    raise exception 'no attempts in session' using errcode = '42704';
  end if;

  v_score := round(100.0 * v_correct / v_total, 2);

  insert into public.simulado_results (user_id, session_id, n_correct, n_total, score)
  values (v_user, p_session_id, v_correct, v_total, v_score)
  on conflict (session_id) do update
    set n_correct = excluded.n_correct,
        n_total   = excluded.n_total,
        score     = excluded.score,
        created_at = now()
  returning id into v_id;

  select round(100.0 * count(*) filter (where score <= v_score) / nullif(count(*), 0), 1)
    into v_pct from public.simulado_results;

  return jsonb_build_object(
    'id', v_id, 'score', v_score, 'n_correct', v_correct, 'n_total', v_total,
    'percentile', coalesce(v_pct, 100)
  );
end;
$$;

grant execute on function public.record_simulado(uuid) to authenticated;
