-- =====================================================================
-- AnestheQuest — 0006: Row-Level Security
-- =====================================================================
-- Modelo:
--   * Catálogo (exams, taxonomy): legível por qualquer usuário autenticado.
--   * Conteúdo (questions, choices, explanations, media...): apenas
--     assinantes ativos E somente questões com status 'publicada'.
--   * Dados do usuário: apenas o próprio dono.
--   * Escritas de conteúdo: somente service role (equipe) — sem policy
--     para authenticated, então o RLS (default-deny) bloqueia o cliente.

-- ====================== CATÁLOGO (leitura ampla) ======================
alter table public.exams enable row level security;
create policy exams_read on public.exams
  for select to authenticated using (true);

alter table public.taxonomy enable row level security;
create policy taxonomy_read on public.taxonomy
  for select to authenticated using (true);

-- ====================== CONTEÚDO (premium) ============================
alter table public.questions enable row level security;
create policy questions_read on public.questions
  for select to authenticated
  using (status = 'publicada' and public.is_active_subscriber());

alter table public.question_taxonomy enable row level security;
create policy qtax_read on public.question_taxonomy
  for select to authenticated
  using (
    public.is_active_subscriber()
    and exists (
      select 1 from public.questions q
      where q.id = question_taxonomy.question_id and q.status = 'publicada'
    )
  );

alter table public.choices enable row level security;
create policy choices_read on public.choices
  for select to authenticated
  using (
    public.is_active_subscriber()
    and exists (
      select 1 from public.questions q
      where q.id = choices.question_id and q.status = 'publicada'
    )
  );

alter table public.explanations enable row level security;
create policy explanations_read on public.explanations
  for select to authenticated
  using (
    public.is_active_subscriber()
    and exists (
      select 1 from public.questions q
      where q.id = explanations.question_id and q.status = 'publicada'
    )
  );

alter table public.choice_explanations enable row level security;
create policy choice_expl_read on public.choice_explanations
  for select to authenticated
  using (
    public.is_active_subscriber()
    and exists (
      select 1
      from public.choices c
      join public.questions q on q.id = c.question_id
      where c.id = choice_explanations.choice_id and q.status = 'publicada'
    )
  );

alter table public.media enable row level security;
create policy media_read on public.media
  for select to authenticated
  using (
    public.is_active_subscriber()
    and (
      (owner_type = 'question' and exists (
        select 1 from public.questions q
        where q.id = media.owner_id and q.status = 'publicada'))
      or
      (owner_type = 'explanation' and exists (
        select 1 from public.explanations e
        join public.questions q on q.id = e.question_id
        where e.id = media.owner_id and q.status = 'publicada'))
    )
  );

-- Oculta a coluna is_correct do cliente: remove o SELECT no nível de tabela
-- e concede apenas as colunas seguras. A correção usa grade_attempt (0005).
revoke select on public.choices from anon, authenticated;
grant  select (id, question_id, texto, ordem, created_at)
  on public.choices to anon, authenticated;

-- ====================== DADOS DO USUÁRIO ==============================
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles
  for select using (user_id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (user_id = auth.uid());
create policy profiles_update on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.sessions enable row level security;
create policy sessions_all on public.sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- attempts: leitura do dono. INSERT é exclusivo da rpc grade_attempt
-- (security definer); sem policy de insert/update/delete para o cliente.
alter table public.attempts enable row level security;
create policy attempts_select on public.attempts
  for select using (user_id = auth.uid());

alter table public.flashcards enable row level security;
create policy flashcards_all on public.flashcards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.srs_state enable row level security;
create policy srs_all on public.srs_state
  for all
  using (exists (
    select 1 from public.flashcards f
    where f.id = srs_state.flashcard_id and f.user_id = auth.uid()))
  with check (exists (
    select 1 from public.flashcards f
    where f.id = srs_state.flashcard_id and f.user_id = auth.uid()));

alter table public.notebook_notes enable row level security;
create policy notes_all on public.notebook_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- subscriptions: leitura do dono; escrita só por service role (webhooks).
alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions
  for select using (user_id = auth.uid());

-- analytics_aggregates: leitura do dono; escrita via grade_attempt / service role.
alter table public.analytics_aggregates enable row level security;
create policy analytics_select on public.analytics_aggregates
  for select using (user_id = auth.uid());

alter table public.question_feedback enable row level security;
create policy feedback_insert on public.question_feedback
  for insert with check (user_id = auth.uid());
create policy feedback_select on public.question_feedback
  for select using (user_id = auth.uid());
