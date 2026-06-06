-- =====================================================================
-- AnestheQuest — 0005: Funções de negócio e triggers
-- =====================================================================

-- ----------------------------------------------------------------------
-- is_active_subscriber — usada nas políticas RLS de conteúdo premium.
-- ----------------------------------------------------------------------
create or replace function public.is_active_subscriber(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- ----------------------------------------------------------------------
-- handle_new_user — cria profile automaticamente ao registrar usuário.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------
-- grade_attempt — correção autoritativa no servidor.
-- Valida sessão, assinatura e publicação; grava a tentativa e atualiza
-- os agregados de analytics. is_correct nunca é exposto ao cliente.
-- ----------------------------------------------------------------------
create or replace function public.grade_attempt(
  p_session_id  uuid,
  p_question_id uuid,
  p_choice_id   uuid,
  p_tempo_seg   int     default null,
  p_flagged     boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user        uuid := auth.uid();
  v_correct     boolean;
  v_correct_ids uuid[];
  v_attempt_id  uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.sessions s
    where s.id = p_session_id and s.user_id = v_user
  ) then
    raise exception 'session not found or not owned by user' using errcode = '42501';
  end if;

  if not public.is_active_subscriber(v_user) then
    raise exception 'active subscription required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.questions q
    where q.id = p_question_id and q.status = 'publicada'
  ) then
    raise exception 'question not available' using errcode = '42704';
  end if;

  if exists (
    select 1 from public.attempts a
    where a.session_id = p_session_id and a.question_id = p_question_id
  ) then
    raise exception 'question already answered in this session' using errcode = '23505';
  end if;

  select array_agg(c.id) into v_correct_ids
  from public.choices c
  where c.question_id = p_question_id and c.is_correct;

  v_correct := p_choice_id is not null and p_choice_id = any(v_correct_ids);

  insert into public.attempts
    (session_id, user_id, question_id, choice_id_escolhida, correto, tempo_seg, flagged)
  values
    (p_session_id, v_user, p_question_id, p_choice_id, v_correct, p_tempo_seg, p_flagged)
  returning id into v_attempt_id;

  -- Atualiza agregados por taxonomia diretamente ligada à questão.
  -- (Rollup para ancestrais fica para a Fase 1.)
  -- avg_time é a média APENAS sobre tentativas com tempo (n_timed), não n_total.
  insert into public.analytics_aggregates (user_id, taxonomy_id, n_correct, n_total, n_timed, avg_time, updated_at)
  select v_user, qt.taxonomy_id,
         case when v_correct then 1 else 0 end,
         1,
         case when p_tempo_seg is not null then 1 else 0 end,
         p_tempo_seg, now()
  from public.question_taxonomy qt
  where qt.question_id = p_question_id
  on conflict (user_id, taxonomy_id) do update set
    n_correct = public.analytics_aggregates.n_correct + excluded.n_correct,
    n_total   = public.analytics_aggregates.n_total   + excluded.n_total,
    n_timed   = public.analytics_aggregates.n_timed   + excluded.n_timed,
    avg_time  = case
      when excluded.avg_time is null then public.analytics_aggregates.avg_time
      when public.analytics_aggregates.avg_time is null then excluded.avg_time
      else (public.analytics_aggregates.avg_time * public.analytics_aggregates.n_timed
            + excluded.avg_time)
           / (public.analytics_aggregates.n_timed + excluded.n_timed)
    end,
    updated_at = now();

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'correto', v_correct,
    'correct_choice_ids', to_jsonb(coalesce(v_correct_ids, array[]::uuid[]))
  );
end;
$$;

-- ----------------------------------------------------------------------
-- set_attempt_flag — marca/desmarca uma tentativa (flag) do próprio usuário.
-- ----------------------------------------------------------------------
create or replace function public.set_attempt_flag(p_attempt_id uuid, p_flagged boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.attempts
     set flagged = p_flagged
   where id = p_attempt_id and user_id = auth.uid();
  if not found then
    raise exception 'attempt not found or not owned by user' using errcode = '42501';
  end if;
end;
$$;

-- ----------------------------------------------------------------------
-- init_srs_for_flashcard — cria o estado SRS junto com o flashcard (atômico,
-- evita flashcard órfão se um insert separado falhar).
-- ----------------------------------------------------------------------
create or replace function public.init_srs_for_flashcard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.srs_state (flashcard_id, due_date, state, reps, lapses, learning_steps)
  values (new.id, now(), 0, 0, 0, 0)
  on conflict (flashcard_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_init_srs on public.flashcards;
create trigger trg_init_srs
  after insert on public.flashcards
  for each row execute function public.init_srs_for_flashcard();

-- ----------------------------------------------------------------------
-- Permissões de execução
-- ----------------------------------------------------------------------
grant execute on function public.is_active_subscriber(uuid) to anon, authenticated;
grant execute on function public.grade_attempt(uuid, uuid, uuid, int, boolean) to authenticated;
grant execute on function public.set_attempt_flag(uuid, boolean) to authenticated;
