-- =====================================================================
-- AnestheQuest — 0002: Tipos enumerados
-- =====================================================================

-- Taxonomia hierárquica (espelha a matriz da SBA)
create type public.taxonomy_kind as enum ('subject', 'system', 'topic');

-- Questões
create type public.question_format     as enum ('unica_escolha', 'multipla_escolha');
create type public.question_difficulty as enum ('facil', 'media', 'dificil');
create type public.question_status     as enum ('rascunho', 'em_revisao', 'publicada');

-- Sessões / blocos de estudo
create type public.session_mode as enum ('tutor', 'timed', 'timed_tutor', 'untimed');

-- Mídia (polimórfica)
create type public.media_owner as enum ('question', 'explanation');
create type public.media_kind  as enum ('imagem', 'video', 'audio');

-- Assinaturas
create type public.subscription_plan     as enum ('anual', 'residente');
create type public.subscription_provider as enum ('stripe', 'revenuecat');
create type public.subscription_status   as enum (
  'active', 'trialing', 'past_due', 'canceled',
  'incomplete', 'incomplete_expired', 'unpaid', 'paused'
);

-- Feedback de questão
create type public.feedback_kind as enum (
  'erro_conteudo', 'erro_digitacao', 'alternativa_incorreta',
  'referencia_incorreta', 'duplicada', 'outro'
);
