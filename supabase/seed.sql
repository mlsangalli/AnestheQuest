-- =====================================================================
-- AnestheQuest — Seed da Fase 0
-- =====================================================================
-- ATENÇÃO: TODO o conteúdo abaixo é PLACEHOLDER fictício, criado apenas
-- para validação técnica. NÃO é conteúdo clínico e NÃO deve ir a produção.
-- A taxonomia real (matriz da SBA) e as questões autorais (revisadas por
-- anestesiologista) serão fornecidas depois.
--
-- Roda automaticamente em `supabase db reset` (após as migrations).

-- --------------------------------------------------------------------
-- Exame foco do MVP: TEA
-- --------------------------------------------------------------------
insert into public.exams (id, nome, descricao) values
  ('00000000-0000-0000-0000-0000000000e1',
   'TEA',
   'Título de Especialista em Anestesiologia (SBA) — exame foco do MVP')
on conflict (nome) do nothing;

-- --------------------------------------------------------------------
-- Taxonomia PLACEHOLDER (is_placeholder = true)
-- Começamos por 1–2 pontos da matriz: Via Aérea e Farmacologia.
-- --------------------------------------------------------------------
insert into public.taxonomy (id, parent_id, tipo, nome, slug, ordem, is_placeholder) values
  ('00000000-0000-0000-0000-0000000000a0', null,
   'subject', 'Anestesiologia (PLACEHOLDER)', 'anestesiologia-placeholder', 0, true),

  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a0',
   'topic', 'Via Aérea (PLACEHOLDER)', 'via-aerea-placeholder', 0, true),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1',
   'topic', 'Manejo da via aérea difícil (PLACEHOLDER)', 'via-aerea-dificil-placeholder', 0, true),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a1',
   'topic', 'Dispositivos supraglóticos (PLACEHOLDER)', 'dispositivos-supragloticos-placeholder', 1, true),

  ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000a0',
   'topic', 'Farmacologia dos Anestésicos (PLACEHOLDER)', 'farmacologia-placeholder', 1, true),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b0',
   'topic', 'Anestésicos venosos (PLACEHOLDER)', 'anestesicos-venosos-placeholder', 0, true),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b0',
   'topic', 'Anestésicos inalatórios (PLACEHOLDER)', 'anestesicos-inalatorios-placeholder', 1, true)
on conflict do nothing;

-- --------------------------------------------------------------------
-- Helper temporário para inserir questão + alternativas + explicações.
-- Existe só nesta sessão (schema pg_temp).
-- --------------------------------------------------------------------
create or replace function pg_temp.seed_question(
  p_exam        uuid,
  p_taxonomy    uuid,
  p_dificuldade public.question_difficulty,
  p_enunciado   text,
  p_choices     text[],
  p_correct_ix  int,
  p_choice_expl text[],
  p_texto_geral text,
  p_objetivo    text,
  p_referencias text
) returns uuid
language plpgsql as $$
declare
  v_q      uuid;
  v_choice uuid;
  i        int;
begin
  insert into public.questions (exam_id, enunciado, tipo, dificuldade, status, versao)
  values (p_exam, p_enunciado, 'unica_escolha', p_dificuldade, 'publicada', 1)
  returning id into v_q;

  insert into public.question_taxonomy (question_id, taxonomy_id) values (v_q, p_taxonomy);

  insert into public.explanations (question_id, texto_geral, objetivo_educacional, referencias)
  values (v_q, p_texto_geral, p_objetivo, p_referencias);

  for i in 1 .. array_length(p_choices, 1) loop
    insert into public.choices (question_id, texto, is_correct, ordem)
    values (v_q, p_choices[i], i = p_correct_ix, i)
    returning id into v_choice;

    insert into public.choice_explanations (choice_id, texto)
    values (v_choice, p_choice_expl[i]);
  end loop;

  return v_q;
end;
$$;

-- --------------------------------------------------------------------
-- 6 questões PLACEHOLDER
-- --------------------------------------------------------------------
do $$
declare
  ex  uuid := '00000000-0000-0000-0000-0000000000e1';
begin
  -- 1) Via aérea difícil (difícil)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000a2', 'dificil',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo sobre manejo de via aérea difícil. ' ||
      'Substituir por enunciado autoral revisado. Lorem ipsum dolor sit amet.',
    array['Alternativa A (placeholder)', 'Alternativa B (placeholder)',
          'Alternativa C (placeholder)', 'Alternativa D (placeholder)'],
    2,
    array['Justificativa placeholder — por que A está errada.',
          'Justificativa placeholder — por que B é a correta.',
          'Justificativa placeholder — por que C está errada.',
          'Justificativa placeholder — por que D está errada.'],
    'Explicação geral placeholder. Substituir por conteúdo autoral revisado por anestesiologista.',
    'Objetivo educacional placeholder.',
    'Referências placeholder (citar adequadamente quando houver conteúdo real).'
  );

  -- 2) Dispositivos supraglóticos (média)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000a3', 'media',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo sobre dispositivos supraglóticos.',
    array['Opção 1 (placeholder)', 'Opção 2 (placeholder)',
          'Opção 3 (placeholder)', 'Opção 4 (placeholder)'],
    1,
    array['Justificativa placeholder — opção 1 (correta).',
          'Justificativa placeholder — opção 2.',
          'Justificativa placeholder — opção 3.',
          'Justificativa placeholder — opção 4.'],
    'Explicação geral placeholder sobre dispositivos supraglóticos.',
    'Objetivo educacional placeholder.', 'Referências placeholder.'
  );

  -- 3) Via aérea (fácil)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000a1', 'facil',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo geral sobre via aérea.',
    array['Resposta A (placeholder)', 'Resposta B (placeholder)',
          'Resposta C (placeholder)', 'Resposta D (placeholder)'],
    3,
    array['Justificativa placeholder A.', 'Justificativa placeholder B.',
          'Justificativa placeholder C (correta).', 'Justificativa placeholder D.'],
    'Explicação geral placeholder sobre via aérea.',
    'Objetivo educacional placeholder.', 'Referências placeholder.'
  );

  -- 4) Anestésicos venosos (média)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000b1', 'media',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo sobre anestésicos venosos.',
    array['Item A (placeholder)', 'Item B (placeholder)',
          'Item C (placeholder)', 'Item D (placeholder)'],
    4,
    array['Justificativa placeholder A.', 'Justificativa placeholder B.',
          'Justificativa placeholder C.', 'Justificativa placeholder D (correta).'],
    'Explicação geral placeholder sobre anestésicos venosos.',
    'Objetivo educacional placeholder.', 'Referências placeholder.'
  );

  -- 5) Anestésicos inalatórios (difícil)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000b2', 'dificil',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo sobre anestésicos inalatórios.',
    array['Alternativa A (placeholder)', 'Alternativa B (placeholder)',
          'Alternativa C (placeholder)', 'Alternativa D (placeholder)'],
    1,
    array['Justificativa placeholder A (correta).', 'Justificativa placeholder B.',
          'Justificativa placeholder C.', 'Justificativa placeholder D.'],
    'Explicação geral placeholder sobre anestésicos inalatórios.',
    'Objetivo educacional placeholder.', 'Referências placeholder.'
  );

  -- 6) Farmacologia (média)
  perform pg_temp.seed_question(
    ex, '00000000-0000-0000-0000-0000000000b0', 'media',
    '[PLACEHOLDER — fictício, não-clínico] Questão exemplo geral de farmacologia dos anestésicos.',
    array['Escolha A (placeholder)', 'Escolha B (placeholder)',
          'Escolha C (placeholder)', 'Escolha D (placeholder)'],
    2,
    array['Justificativa placeholder A.', 'Justificativa placeholder B (correta).',
          'Justificativa placeholder C.', 'Justificativa placeholder D.'],
    'Explicação geral placeholder de farmacologia.',
    'Objetivo educacional placeholder.', 'Referências placeholder.'
  );
end
$$;
