import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as core from '@anesthequest/core';
import { supabase } from '@/lib/supabase';

export const keys = {
  subscription: ['subscription'] as const,
  taxonomy: ['taxonomy'] as const,
  analytics: ['analytics'] as const,
  notes: ['notes'] as const,
  sessions: ['sessions'] as const,
  profile: ['profile'] as const,
};

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: () => core.fetchProfile(supabase) });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<{ nome: string; crm: string; especialidade_alvo: string }>) =>
      core.updateProfile(supabase, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.profile }),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: keys.subscription,
    queryFn: () => core.fetchSubscription(supabase),
  });
}

export function useIsSubscriber() {
  const { data, isLoading } = useSubscription();
  return { isSubscriber: core.isSubscriptionActive(data ?? null), isLoading };
}

export function useTaxonomyTree() {
  return useQuery({
    queryKey: keys.taxonomy,
    queryFn: async () => core.buildTaxonomyTree(await core.fetchTaxonomy(supabase)),
  });
}

export function useAnalytics() {
  return useQuery({ queryKey: keys.analytics, queryFn: () => core.fetchAnalytics(supabase) });
}

export function useRecentSessions() {
  return useQuery({ queryKey: keys.sessions, queryFn: () => core.fetchRecentSessions(supabase) });
}

export function useNotes() {
  return useQuery({ queryKey: keys.notes, queryFn: () => core.fetchNotes(supabase) });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: { titulo: string; conteudo?: string | null; taxonomy_id?: string | null }) =>
      core.createNote(supabase, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<{ titulo: string; conteudo: string | null; taxonomy_id: string | null }> }) =>
      core.updateNote(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => core.deleteNote(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes }),
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (f: { questionId: string; tipo: core.FeedbackKind; texto?: string }) =>
      core.submitFeedback(supabase, f),
  });
}
