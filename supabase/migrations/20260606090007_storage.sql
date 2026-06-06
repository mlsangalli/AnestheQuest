-- =====================================================================
-- AnestheQuest — 0007: Storage (mídia de questões/explicações)
-- =====================================================================
-- Bucket privado: leitura só para assinantes ativos; upload só por service
-- role (equipe de conteúdo). Imagens autorais revisadas por anestesiologista.

insert into storage.buckets (id, name, public)
values ('question-media', 'question-media', false)
on conflict (id) do nothing;

drop policy if exists "question-media read for subscribers" on storage.objects;
create policy "question-media read for subscribers"
  on storage.objects
  for select to authenticated
  using (bucket_id = 'question-media' and public.is_active_subscriber());
