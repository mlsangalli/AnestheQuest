// Funções de acesso a dados (puras: recebem o client). Reusáveis no app
// (Expo), na web e em edge functions. Os hooks React (cache) ficam no app.
import type { AnestheQuestClient } from './supabase';
import type { Tables } from './types/database.types';
import type { QuestionFilter, SessionMode } from './constants';
import { newCardState, reviewCard, type ReviewRating, type SrsState } from './fsrs';

export type Taxonomy = Tables<'taxonomy'>;
export type Choice = Pick<Tables<'choices'>, 'id' | 'question_id' | 'texto' | 'ordem'>;
export type Explanation = Tables<'explanations'>;
export type Media = Tables<'media'>;
export type Subscription = Tables<'subscriptions'>;
export type NotebookNote = Tables<'notebook_notes'>;
export type Attempt = Tables<'attempts'>;

export interface QuestionWithChoices {
  id: string;
  exam_id: string;
  enunciado: string;
  tipo: Tables<'questions'>['tipo'];
  dificuldade: Tables<'questions'>['dificuldade'];
  choices: Choice[];
}

export interface TaxonomyNode extends Taxonomy {
  children: TaxonomyNode[];
}

export interface ExplanationBundle {
  explanation: Explanation | null;
  choiceExplanations: Record<string, string>;
  media: Media[];
}

export interface CreateSessionResult {
  session_id: string;
  question_ids: string[];
}

export interface SimuladoResult {
  id: string;
  score: number;
  n_correct: number;
  n_total: number;
  percentile: number;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------------------------------------------------------------- catálogo
export async function fetchExams(c: AnestheQuestClient) {
  return unwrap(await c.from('exams').select('*').order('nome'));
}

export async function fetchTaxonomy(c: AnestheQuestClient): Promise<Taxonomy[]> {
  return unwrap(await c.from('taxonomy').select('*').order('ordem'));
}

export function buildTaxonomyTree(flat: Taxonomy[]): TaxonomyNode[] {
  const byId = new Map<string, TaxonomyNode>();
  flat.forEach((t) => byId.set(t.id, { ...t, children: [] }));
  const roots: TaxonomyNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ------------------------------------------------------------- criar teste
export async function countQuestions(
  c: AnestheQuestClient,
  taxonomyIds: string[] | null,
  statusFilter: QuestionFilter,
): Promise<number> {
  const data = unwrap(
    await c.rpc('count_questions', {
      p_taxonomy_ids: taxonomyIds && taxonomyIds.length ? taxonomyIds : null,
      p_status_filter: statusFilter,
    }),
  );
  return (data as number) ?? 0;
}

export async function createSession(
  c: AnestheQuestClient,
  params: { modo: SessionMode; taxonomyIds: string[] | null; statusFilter: QuestionFilter; limit: number },
): Promise<CreateSessionResult> {
  const data = unwrap(
    await c.rpc('create_session', {
      p_modo: params.modo,
      p_taxonomy_ids: params.taxonomyIds && params.taxonomyIds.length ? params.taxonomyIds : null,
      p_status_filter: params.statusFilter,
      p_limit: params.limit,
    }),
  );
  return data as unknown as CreateSessionResult;
}

export async function finishSession(c: AnestheQuestClient, sessionId: string) {
  const { error } = await c.rpc('finish_session', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
}

// --------------------------------------------------------------- questões
export async function fetchQuestionsByIds(
  c: AnestheQuestClient,
  ids: string[],
): Promise<QuestionWithChoices[]> {
  if (!ids.length) return [];
  const data = unwrap(
    await c
      .from('questions')
      .select('id, exam_id, enunciado, tipo, dificuldade, choices(id, question_id, texto, ordem)')
      .in('id', ids),
  ) as unknown as QuestionWithChoices[];
  data.forEach((q) => q.choices.sort((a, b) => a.ordem - b.ordem));
  // mantém a ordem definida pela sessão
  const order = new Map(ids.map((id, i) => [id, i]));
  return data.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function fetchExplanationBundle(
  c: AnestheQuestClient,
  questionId: string,
): Promise<ExplanationBundle> {
  const expRes = await c.from('explanations').select('*').eq('question_id', questionId).maybeSingle();
  if (expRes.error) throw new Error(expRes.error.message);
  const explanation = expRes.data;
  const ce = unwrap(
    await c
      .from('choice_explanations')
      .select('choice_id, texto, choices!inner(question_id)')
      .eq('choices.question_id', questionId),
  ) as unknown as { choice_id: string; texto: string }[];
  const choiceExplanations: Record<string, string> = {};
  ce.forEach((row) => (choiceExplanations[row.choice_id] = row.texto));

  const media = unwrap(
    await c
      .from('media')
      .select('*')
      .eq('owner_type', 'question')
      .eq('owner_id', questionId)
      .order('ordem'),
  );
  return { explanation, choiceExplanations, media };
}

// ---------------------------------------------------------------- analytics
export interface TaxonomyAnalytics {
  taxonomy_id: string;
  nome: string;
  n_correct: number;
  n_total: number;
  avg_time: number | null;
}

export async function fetchAnalytics(c: AnestheQuestClient): Promise<TaxonomyAnalytics[]> {
  const rows = unwrap(
    await c
      .from('analytics_aggregates')
      .select('taxonomy_id, n_correct, n_total, avg_time, taxonomy:taxonomy_id(nome)'),
  ) as unknown as {
    taxonomy_id: string;
    n_correct: number;
    n_total: number;
    avg_time: number | null;
    taxonomy: { nome: string } | null;
  }[];
  return rows.map((r) => ({
    taxonomy_id: r.taxonomy_id,
    nome: r.taxonomy?.nome ?? '—',
    n_correct: r.n_correct,
    n_total: r.n_total,
    avg_time: r.avg_time,
  }));
}

export async function fetchSessionAttempts(c: AnestheQuestClient, sessionId: string): Promise<Attempt[]> {
  return unwrap(await c.from('attempts').select('*').eq('session_id', sessionId));
}

// Total/acerto geral a partir de attempts (evita contagem dupla de questões
// com múltiplas taxonomias, que ocorreria ao somar analytics_aggregates).
export async function fetchOverallStats(
  c: AnestheQuestClient,
): Promise<{ total: number; correct: number; accuracy: number }> {
  const totalRes = await c.from('attempts').select('id', { count: 'exact', head: true });
  if (totalRes.error) throw new Error(totalRes.error.message);
  const correctRes = await c
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('correto', true);
  if (correctRes.error) throw new Error(correctRes.error.message);
  const total = totalRes.count ?? 0;
  const correct = correctRes.count ?? 0;
  return { total, correct, accuracy: total ? Math.round((1000 * correct) / total) / 10 : 0 };
}

export async function fetchRecentSessions(c: AnestheQuestClient, limit = 20) {
  return unwrap(
    await c.from('sessions').select('*').order('created_at', { ascending: false }).limit(limit),
  );
}

// ----------------------------------------------------------------- caderno
export async function fetchNotes(c: AnestheQuestClient): Promise<NotebookNote[]> {
  return unwrap(await c.from('notebook_notes').select('*').order('updated_at', { ascending: false }));
}

export async function createNote(
  c: AnestheQuestClient,
  note: { titulo: string; conteudo?: string | null; taxonomy_id?: string | null },
) {
  const userId = (await c.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('not authenticated');
  return unwrap(await c.from('notebook_notes').insert({ ...note, user_id: userId }).select().single());
}

export async function updateNote(
  c: AnestheQuestClient,
  id: string,
  patch: Partial<Pick<NotebookNote, 'titulo' | 'conteudo' | 'taxonomy_id'>>,
) {
  return unwrap(await c.from('notebook_notes').update(patch).eq('id', id).select().single());
}

export async function deleteNote(c: AnestheQuestClient, id: string) {
  const { error } = await c.from('notebook_notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------- feedback
export async function submitFeedback(
  c: AnestheQuestClient,
  feedback: { questionId: string; tipo: Tables<'question_feedback'>['tipo']; texto?: string },
) {
  const userId = (await c.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('not authenticated');
  const { error } = await c.from('question_feedback').insert({
    question_id: feedback.questionId,
    user_id: userId,
    tipo: feedback.tipo,
    texto: feedback.texto ?? null,
  });
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------- perfil
export type Profile = Tables<'profiles'>;

export async function fetchProfile(c: AnestheQuestClient): Promise<Profile | null> {
  const res = await c.from('profiles').select('*').maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function updateProfile(
  c: AnestheQuestClient,
  patch: Partial<Pick<Profile, 'nome' | 'crm' | 'especialidade_alvo'>>,
): Promise<Profile> {
  const userId = (await c.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('not authenticated');
  const res = await c.from('profiles').update(patch).eq('user_id', userId).select().single();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ------------------------------------------------------------ assinatura
export async function fetchSubscription(c: AnestheQuestClient): Promise<Subscription | null> {
  const res = await c.from('subscriptions').select('*').maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'active' && sub.status !== 'trialing') return false;
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false;
  return true;
}

export async function fetchSession(c: AnestheQuestClient, id: string) {
  const res = await c.from('sessions').select('*').eq('id', id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ------------------------------------------------------------- simulados
export async function recordSimulado(c: AnestheQuestClient, sessionId: string): Promise<SimuladoResult> {
  const data = unwrap(await c.rpc('record_simulado', { p_session_id: sessionId }));
  return data as unknown as SimuladoResult;
}

// ------------------------------------------------------------ flashcards (Fase 2)
export type Flashcard = Tables<'flashcards'>;
export type SrsRow = Tables<'srs_state'>;
export interface FlashcardWithSrs extends Flashcard {
  srs: SrsRow | null;
}

export async function fetchFlashcards(c: AnestheQuestClient): Promise<FlashcardWithSrs[]> {
  const res = await c
    .from('flashcards')
    .select('*, srs:srs_state(*)')
    .order('created_at', { ascending: false });
  if (res.error) throw new Error(res.error.message);
  const rows = (res.data ?? []) as unknown as (Flashcard & { srs: SrsRow | SrsRow[] | null })[];
  return rows.map((f) => ({
    ...f,
    srs: Array.isArray(f.srs) ? f.srs[0] ?? null : f.srs ?? null,
  }));
}

export function dueFlashcards(list: FlashcardWithSrs[], now: Date = new Date()): FlashcardWithSrs[] {
  return list.filter((f) => !f.srs?.due_date || new Date(f.srs.due_date) <= now);
}

export async function createFlashcard(
  c: AnestheQuestClient,
  input: { frente: string; verso: string; origem_question_id?: string | null },
): Promise<Flashcard> {
  const userId = (await c.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('not authenticated');
  // O srs_state inicial é criado atomicamente pelo trigger trg_init_srs.
  const fres = await c.from('flashcards').insert({ ...input, user_id: userId }).select().single();
  if (fres.error) throw new Error(fres.error.message);
  return fres.data;
}

export async function reviewFlashcard(
  c: AnestheQuestClient,
  flashcardId: string,
  srs: SrsState | null,
  rating: ReviewRating,
): Promise<void> {
  const next = reviewCard(srs ?? newCardState(), rating);
  const res = await c
    .from('srs_state')
    .upsert({ flashcard_id: flashcardId, ...next }, { onConflict: 'flashcard_id' });
  if (res.error) throw new Error(res.error.message);
}

export async function deleteFlashcard(c: AnestheQuestClient, id: string) {
  const { error } = await c.from('flashcards').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
