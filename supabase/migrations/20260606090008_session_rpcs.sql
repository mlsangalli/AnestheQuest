-- =====================================================================
-- AnestheQuest — 0008: RPCs da Fase 1 (montagem de blocos / "Criar Teste")
-- =====================================================================

-- Expande nós de taxonomia para incluir todos os descendentes
-- (selecionar "Via Aérea" inclui as questões dos subtemas).
create or replace function public.taxonomy_with_descendants(p_ids uuid[])
returns table(id uuid)
language sql stable
set search_path = public
as $$
  with recursive t as (
    select x.id from public.taxonomy x where x.id = any(p_ids)
    union
    select c.id from public.taxonomy c join t on c.parent_id = t.id
  )
  select id from t;
$$;

-- Seleciona ids de questões publicadas conforme tema + filtro de status do
-- usuário. Interna (security definer): NUNCA exponha diretamente ao cliente.
create or replace function public.select_question_ids(
  p_user          uuid,
  p_taxonomy_ids  uuid[],
  p_status_filter text
)
returns table(question_id uuid)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  with tax as (select id from public.taxonomy_with_descendants(p_taxonomy_ids)),
  base as (
    select q.id
    from public.questions q
    where q.status = 'publicada'
      and (
        p_taxonomy_ids is null
        or array_length(p_taxonomy_ids, 1) is null
        or exists (
          select 1 from public.question_taxonomy qt
          join tax on tax.id = qt.taxonomy_id
          where qt.question_id = q.id
        )
      )
  )
  select b.id
  from base b
  where case coalesce(p_status_filter, 'todas')
    when 'nao_usadas' then not exists (
      select 1 from public.attempts a where a.user_id = p_user and a.question_id = b.id)
    when 'erradas' then exists (
      select 1 from public.attempts a
      where a.user_id = p_user and a.question_id = b.id and a.correto = false
    ) and not exists (
      select 1 from public.attempts a2
      where a2.user_id = p_user and a2.question_id = b.id and a2.correto = true
        and a2.created_at > (
          select max(a3.created_at) from public.attempts a3
          where a3.user_id = p_user and a3.question_id = b.id and a3.correto = false)
    )
    when 'marcadas' then exists (
      select 1 from public.attempts a
      where a.user_id = p_user and a.question_id = b.id and a.flagged = true)
    else true
  end;
end;
$$;

-- Contagem para o preview de "Criar Teste".
create or replace function public.count_questions(
  p_taxonomy_ids uuid[], p_status_filter text
)
returns int
language sql stable security definer set search_path = public
as $$
  select count(*)::int
  from public.select_question_ids(auth.uid(), p_taxonomy_ids, p_status_filter);
$$;

-- Cria a sessão e devolve os ids de questões (embaralhados, limitados).
create or replace function public.create_session(
  p_modo          session_mode,
  p_taxonomy_ids  uuid[],
  p_status_filter text,
  p_limit         int
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_session uuid;
  v_ids     uuid[];
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not public.is_active_subscriber(v_user) then
    raise exception 'active subscription required' using errcode = '42501';
  end if;

  select array_agg(question_id) into v_ids
  from (
    select question_id
    from public.select_question_ids(v_user, p_taxonomy_ids, p_status_filter)
    order by random()
    limit greatest(coalesce(p_limit, 10), 1)
  ) s;

  v_ids := coalesce(v_ids, array[]::uuid[]);

  insert into public.sessions (user_id, modo, filtros_json, total_questions)
  values (
    v_user, p_modo,
    jsonb_build_object(
      'taxonomy_ids', to_jsonb(p_taxonomy_ids),
      'status_filter', p_status_filter,
      'limit', p_limit
    ),
    coalesce(array_length(v_ids, 1), 0)
  )
  returning id into v_session;

  return jsonb_build_object('session_id', v_session, 'question_ids', to_jsonb(v_ids));
end;
$$;

-- Marca a sessão como concluída.
create or replace function public.finish_session(p_session_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.sessions
     set finished_at = now()
   where id = p_session_id and user_id = auth.uid();
  if not found then
    raise exception 'session not found or not owned by user' using errcode = '42501';
  end if;
end;
$$;

-- Permissões: as internas NÃO podem ser chamadas pelo cliente. No Supabase os
-- papéis anon/authenticated recebem EXECUTE por default privileges, então é
-- preciso revogar deles explicitamente (revogar de PUBLIC não basta).
revoke execute on function public.select_question_ids(uuid, uuid[], text) from public, anon, authenticated;
revoke execute on function public.taxonomy_with_descendants(uuid[]) from public, anon, authenticated;
grant execute on function public.count_questions(uuid[], text) to authenticated;
grant execute on function public.create_session(session_mode, uuid[], text, int) to authenticated;
grant execute on function public.finish_session(uuid) to authenticated;
