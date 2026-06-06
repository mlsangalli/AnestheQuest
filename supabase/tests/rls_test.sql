-- =====================================================================
-- AnestheQuest — Testes de RLS (pgTAP)
-- Rodar com: `supabase test db`
-- Cobre: gating de conteúdo premium e isolamento de dados do usuário.
-- =====================================================================
begin;
create extension if not exists pgtap;
select plan(10);

-- ---------------------------------------------------------------------
-- Fixtures (executadas como superusuário, antes de trocar de papel)
-- ---------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, confirmation_token, recovery_token,
   email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'assinante@test.dev', '', now(),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'gratis@test.dev', '', now(),
   now(), now(), '', '', '', '');

-- Usuário A é assinante ativo; B não tem assinatura.
insert into public.subscriptions (user_id, plano, status, provider, current_period_end)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'anual', 'active', 'stripe',
        now() + interval '1 year');

-- Conteúdo de teste (1 questão publicada com 2 alternativas).
insert into public.exams (id, nome)
values ('eeeeeeee-0000-0000-0000-000000000003', 'TEST-EXAM');
insert into public.taxonomy (id, tipo, nome)
values ('dddddddd-0000-0000-0000-000000000004', 'topic', 'Tema de teste');
insert into public.questions (id, exam_id, enunciado, status)
values ('cccccccc-0000-0000-0000-000000000005',
        'eeeeeeee-0000-0000-0000-000000000003', 'Enunciado de teste', 'publicada');
insert into public.question_taxonomy (question_id, taxonomy_id)
values ('cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000004');
insert into public.choices (id, question_id, texto, is_correct, ordem) values
  ('cccccccc-0000-0000-0000-000000000006', 'cccccccc-0000-0000-0000-000000000005', 'Correta',  true,  1),
  ('cccccccc-0000-0000-0000-000000000007', 'cccccccc-0000-0000-0000-000000000005', 'Errada',   false, 2);
insert into public.explanations (question_id, texto_geral)
values ('cccccccc-0000-0000-0000-000000000005', 'Explicação de teste');

-- ---------------------------------------------------------------------
-- 1) Anônimo não vê conteúdo
-- ---------------------------------------------------------------------
set local role anon;
select is(
  (select count(*)::int from public.questions),
  0, 'anônimo não vê questões'
);

-- ---------------------------------------------------------------------
-- 2-3) Usuário autenticado SEM assinatura
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::int from public.questions),
  0, 'não-assinante não vê questões (gating premium)'
);

select throws_ok(
  $$ insert into public.subscriptions (user_id, plano, status, provider)
     values ('bbbbbbbb-0000-0000-0000-000000000002','anual','active','stripe') $$,
  '42501', null, 'não-assinante não cria subscription (RLS)'
);

-- ---------------------------------------------------------------------
-- 4-9) Usuário assinante ativo
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::int from public.questions),
  1, 'assinante vê questão publicada'
);

select throws_ok(
  $$ select is_correct from public.choices limit 1 $$,
  '42501', null, 'coluna is_correct não é exposta ao cliente'
);

select lives_ok(
  $$ insert into public.sessions (id, user_id, modo)
     values ('55555555-0000-0000-0000-000000000008',
             'aaaaaaaa-0000-0000-0000-000000000001', 'tutor') $$,
  'assinante cria sessão própria'
);

select is(
  (select public.grade_attempt(
     '55555555-0000-0000-0000-000000000008',
     'cccccccc-0000-0000-0000-000000000005',
     'cccccccc-0000-0000-0000-000000000006') ->> 'correto'),
  'true', 'grade_attempt corrige a alternativa correta'
);

select is(
  (select count(*)::int from public.attempts),
  1, 'assinante vê a própria tentativa'
);

select throws_ok(
  $$ insert into public.attempts (session_id, user_id, question_id, correto)
     values ('55555555-0000-0000-0000-000000000008',
             'aaaaaaaa-0000-0000-0000-000000000001',
             'cccccccc-0000-0000-0000-000000000005', true) $$,
  '42501', null, 'insert direto em attempts é bloqueado (só via grade_attempt)'
);

-- ---------------------------------------------------------------------
-- 10) Isolamento: B não enxerga as tentativas de A
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  (select count(*)::int from public.attempts),
  0, 'usuário não vê tentativas de outro usuário'
);

select * from finish();
rollback;
