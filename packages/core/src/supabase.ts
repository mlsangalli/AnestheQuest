import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

export type AnestheQuestClient = SupabaseClient<Database>;

type ClientOptions = Parameters<typeof createClient<Database>>[2];

/**
 * Cria um client Supabase tipado. Use SEMPRE a anon key no cliente —
 * a service-role key nunca deve ir para app/web.
 */
export function createAnestheQuestClient(
  url: string,
  anonKey: string,
  options?: ClientOptions,
): AnestheQuestClient {
  return createClient<Database>(url, anonKey, options);
}

export type GradeAttemptResult = {
  attempt_id: string;
  correto: boolean;
  correct_choice_ids: string[];
};

/** Wrapper tipado para a rpc de correção server-side. */
export async function gradeAttempt(
  client: AnestheQuestClient,
  params: {
    sessionId: string;
    questionId: string;
    choiceId: string | null;
    tempoSeg?: number | null;
    flagged?: boolean;
  },
): Promise<GradeAttemptResult> {
  const { data, error } = await client.rpc('grade_attempt', {
    p_session_id: params.sessionId,
    p_question_id: params.questionId,
    p_choice_id: params.choiceId,
    p_tempo_seg: params.tempoSeg ?? null,
    p_flagged: params.flagged ?? false,
  });
  if (error) throw error;
  return data as unknown as GradeAttemptResult;
}
