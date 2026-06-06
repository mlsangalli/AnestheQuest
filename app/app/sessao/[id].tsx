import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as core from '@anesthequest/core';
import type { SessionMode } from '@anesthequest/core';
import { supabase } from '@/lib/supabase';
import { Loading, ErrorState, Button } from '@/components/ui';
import { HighlightableText } from '@/components/player/HighlightableText';
import { ChoiceItem } from '@/components/player/ChoiceItem';
import { QuestionGrid, type CellStatus } from '@/components/player/QuestionGrid';
import { ExplanationPanel } from '@/components/player/ExplanationPanel';
import { FeedbackModal } from '@/components/player/FeedbackModal';
import { colors, spacing, radius } from '@/theme/colors';

interface QState {
  selectedId: string | null;
  result: core.GradeAttemptResult | null;
  flagged: boolean;
  struck: string[];
  highlights: number[];
}

const emptyQ = (): QState => ({ selectedId: null, result: null, flagged: false, struck: [], highlights: [] });

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SessionPlayer() {
  const params = useLocalSearchParams<{ id: string; qids?: string; modo?: string }>();
  const router = useRouter();
  const sessionId = params.id;
  const modo = (params.modo as SessionMode) ?? 'tutor';
  const qids = useMemo(() => (params.qids ? params.qids.split(',').filter(Boolean) : []), [params.qids]);

  const isTimed = modo === 'timed' || modo === 'timed_tutor';
  const revealPerQuestion = modo !== 'timed';

  const questionsQuery = useQuery({
    queryKey: ['session-questions', sessionId],
    queryFn: () => core.fetchQuestionsByIds(supabase, qids),
    enabled: qids.length > 0,
  });
  const questions = questionsQuery.data ?? [];

  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<Record<string, QState>>({});
  const [highlightMode, setHighlightMode] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const qStartRef = useRef(Date.now());

  const budget = questions.length * 90; // 1,5 min/questão
  const remaining = Math.max(0, budget - elapsed);

  const q = questions[current];
  const qState = (q && states[q.id]) || emptyQ();

  const setQ = useCallback((qid: string, patch: Partial<QState>) => {
    setStates((prev) => ({ ...prev, [qid]: { ...emptyQ(), ...prev[qid], ...patch } }));
  }, []);

  // cronômetro
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    qStartRef.current = Date.now();
    setSubmitError(null);
  }, [current]);

  const finish = useCallback(async () => {
    setFinishing(true);
    try {
      await core.finishSession(supabase, sessionId);
      // O cálculo de simulado/percentil acontece na tela de resultado.
      router.replace({ pathname: '/resultado/[id]', params: { id: sessionId } });
    } finally {
      setFinishing(false);
    }
  }, [sessionId, router]);

  // auto-encerrar no modo cronometrado
  useEffect(() => {
    if (isTimed && remaining === 0 && questions.length > 0 && !finishing) {
      finish();
    }
  }, [isTimed, remaining, questions.length, finishing, finish]);

  const explanationQuery = useQuery({
    queryKey: ['explanation', q?.id],
    queryFn: () => core.fetchExplanationBundle(supabase, q!.id),
    enabled: Boolean(q && qState.result && revealPerQuestion),
  });

  if (qids.length === 0) return <ErrorState error={new Error('Bloco sem questões.')} />;
  if (questionsQuery.isLoading) return <Loading label="Preparando o bloco…" />;
  if (questionsQuery.error) return <ErrorState error={questionsQuery.error} />;
  if (!q) return <ErrorState error={new Error('Questão não encontrada.')} />;

  const revealed = Boolean(qState.result);
  const correctIds = qState.result?.correct_choice_ids ?? [];

  async function confirm() {
    if (!qState.selectedId || !q || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const tempo = Math.round((Date.now() - qStartRef.current) / 1000);
      const result = await core.gradeAttempt(supabase, {
        sessionId,
        questionId: q.id,
        choiceId: qState.selectedId,
        tempoSeg: tempo,
        flagged: qState.flagged,
      });
      setQ(q.id, { result });
      if (!revealPerQuestion) goNext();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erro ao registrar a resposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else finish();
  }

  async function toggleFlag() {
    if (!q) return;
    const next = !qState.flagged;
    setQ(q.id, { flagged: next });
    if (qState.result?.attempt_id) {
      await supabase.rpc('set_attempt_flag', { p_attempt_id: qState.result.attempt_id, p_flagged: next });
    }
  }

  function toggleStrike(choiceId: string) {
    const set = new Set(qState.struck);
    set.has(choiceId) ? set.delete(choiceId) : set.add(choiceId);
    setQ(q.id, { struck: [...set] });
  }

  function toggleHighlight(tokenIndex: number) {
    const set = new Set(qState.highlights);
    set.has(tokenIndex) ? set.delete(tokenIndex) : set.add(tokenIndex);
    setQ(q.id, { highlights: [...set] });
  }

  const gridStatuses: CellStatus[] = questions.map((qq) => {
    const st = states[qq.id];
    if (!st?.result) return 'unanswered';
    return st.result.correto ? 'correct' : 'incorrect';
  });
  const gridFlags = questions.map((qq) => states[qq.id]?.flagged ?? false);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Barra superior */}
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.topIcon}>✕</Text>
        </Pressable>
        <Text style={styles.progress}>
          {current + 1}/{questions.length}
        </Text>
        {isTimed ? (
          <Text style={[styles.timer, remaining < 60 && styles.timerLow]}>⏱ {fmt(remaining)}</Text>
        ) : (
          <Text style={styles.timer}>⏱ {fmt(elapsed)}</Text>
        )}
        <View style={styles.topActions}>
          <ToolBtn label="🚩" active={qState.flagged} onPress={toggleFlag} />
          <ToolBtn label="🖊" active={highlightMode} onPress={() => setHighlightMode((v) => !v)} />
          <ToolBtn label="▦" onPress={() => setGridOpen(true)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <HighlightableText
          text={q.enunciado}
          highlighted={new Set(qState.highlights)}
          onToggle={toggleHighlight}
          enabled={highlightMode}
          style={styles.stem}
        />
        {highlightMode && <Text style={styles.hintHl}>Modo destaque ativo — toque nas palavras.</Text>}

        <View style={styles.choices}>
          {q.choices.map((c, i) => (
            <ChoiceItem
              key={c.id}
              index={i}
              texto={c.texto}
              selected={qState.selectedId === c.id}
              struck={qState.struck.includes(c.id)}
              reveal={revealed}
              isCorrect={correctIds.includes(c.id)}
              onSelect={() => setQ(q.id, { selectedId: c.id })}
              onToggleStrike={() => toggleStrike(c.id)}
            />
          ))}
        </View>

        {revealed && revealPerQuestion && (
          <View style={{ marginTop: spacing.md }}>
            {explanationQuery.isLoading ? (
              <Loading />
            ) : explanationQuery.data ? (
              <ExplanationPanel
                bundle={explanationQuery.data}
                choices={q.choices}
                correctIds={correctIds}
                selectedId={qState.selectedId}
              />
            ) : null}
            <Pressable onPress={() => setFeedbackOpen(true)} style={styles.report}>
              <Text style={styles.reportText}>Reportar erro nesta questão</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Barra inferior */}
      {submitError && <Text style={styles.submitError}>{submitError}</Text>}
      <View style={styles.bottombar}>
        {!revealed ? (
          <Button
            title="Confirmar resposta"
            onPress={confirm}
            disabled={!qState.selectedId || submitting}
            loading={submitting}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title={current < questions.length - 1 ? 'Próxima →' : 'Finalizar'}
            onPress={goNext}
            loading={finishing}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Grade de navegação */}
      <Modal visible={gridOpen} animationType="slide" transparent onRequestClose={() => setGridOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Navegação</Text>
            <ScrollView>
              <QuestionGrid
                statuses={gridStatuses}
                flagged={gridFlags}
                current={current}
                reveal={revealPerQuestion}
                onSelect={(i) => {
                  setCurrent(i);
                  setGridOpen(false);
                }}
              />
            </ScrollView>
            <Button title="Fechar" variant="secondary" onPress={() => setGridOpen(false)} />
          </View>
        </View>
      </Modal>

      <FeedbackModal
        visible={feedbackOpen}
        questionId={q.id}
        onClose={() => setFeedbackOpen(false)}
      />
    </SafeAreaView>
  );
}

function ToolBtn({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toolBtn, active && styles.toolBtnActive]} hitSlop={6}>
      <Text style={styles.toolIcon}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgLight },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topIcon: { fontSize: 20, color: colors.textPrimary, fontWeight: '700' },
  progress: { fontWeight: '700', color: colors.textPrimary },
  timer: { fontVariant: ['tabular-nums'], color: colors.textPrimary, fontWeight: '600' },
  timerLow: { color: colors.incorrect },
  topActions: { flexDirection: 'row', gap: spacing.xs, marginLeft: 'auto' },
  toolBtn: { padding: spacing.xs, borderRadius: radius.sm },
  toolBtnActive: { backgroundColor: '#E8F2FD' },
  toolIcon: { fontSize: 18 },
  content: { padding: spacing.lg, gap: spacing.sm },
  stem: { fontSize: 17, lineHeight: 26, color: colors.textPrimary },
  hintHl: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  choices: { gap: spacing.sm, marginTop: spacing.md },
  report: { padding: spacing.md, alignItems: 'center' },
  reportText: { color: colors.textMuted, textDecorationLine: 'underline' },
  submitError: {
    color: colors.incorrect,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
  },
  bottombar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bgLight,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
});
