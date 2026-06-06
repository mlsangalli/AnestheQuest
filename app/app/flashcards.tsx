import { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Modal } from 'react-native';
import * as core from '@anesthequest/core';
import { Screen, Card, Button, SectionTitle, Loading, ErrorState, EmptyState } from '@/components/ui';
import {
  useFlashcards,
  useCreateFlashcard,
  useReviewFlashcard,
  useDeleteFlashcard,
} from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

const RATINGS: { key: core.ReviewRating; label: string; color: string }[] = [
  { key: 'again', label: 'Errei', color: colors.incorrect },
  { key: 'hard', label: 'Difícil', color: '#E08600' },
  { key: 'good', label: 'Bom', color: colors.primary },
  { key: 'easy', label: 'Fácil', color: colors.correct },
];

function relativo(d: Date): string {
  const ms = d.getTime() - Date.now();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)}min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function Flashcards() {
  const all = useFlashcards();
  const review = useReviewFlashcard();
  const create = useCreateFlashcard();
  const del = useDeleteFlashcard();
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState(false);
  const [adding, setAdding] = useState(false);

  const due = useMemo(() => core.dueFlashcards(all.data ?? []), [all.data]);
  const queue = due.filter((c) => !reviewed.has(c.id));
  const current = queue[0];

  if (all.isLoading) return <Loading />;
  if (all.error) return <ErrorState error={all.error} />;

  function rate(rating: core.ReviewRating) {
    if (!current) return;
    review.mutate({ flashcardId: current.id, srs: current.srs, rating });
    setReviewed((prev) => new Set(prev).add(current.id));
    setFlipped(false);
  }

  const intervals = current
    ? core.previewIntervals(current.srs ?? core.newCardState())
    : null;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.due}>{queue.length} para revisar hoje</Text>
        <Button title="＋ Cartão" variant="secondary" onPress={() => setAdding(true)} style={styles.addBtn} />
      </View>

      {current ? (
        <Pressable onPress={() => setFlipped((f) => !f)}>
          <Card style={styles.flashcard}>
            <Text style={styles.face}>{flipped ? 'Verso' : 'Frente'}</Text>
            <Text style={styles.cardText}>{flipped ? current.verso : current.frente}</Text>
            {!flipped && <Text style={styles.tap}>toque para virar</Text>}
          </Card>
        </Pressable>
      ) : (
        <Card style={styles.flashcard}>
          <Text style={styles.done}>🎉</Text>
          <Text style={styles.cardText}>
            {(all.data ?? []).length === 0
              ? 'Nenhum cartão ainda. Crie o primeiro!'
              : 'Tudo revisado por hoje!'}
          </Text>
        </Card>
      )}

      {current && flipped && intervals && (
        <View style={styles.ratings}>
          {RATINGS.map((r) => (
            <Pressable key={r.key} onPress={() => rate(r.key)} style={[styles.rateBtn, { borderColor: r.color }]}>
              <Text style={[styles.rateLabel, { color: r.color }]}>{r.label}</Text>
              <Text style={styles.rateInt}>{relativo(intervals[r.key])}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <SectionTitle>Seus cartões ({(all.data ?? []).length})</SectionTitle>
      {(all.data ?? []).length === 0 ? (
        <EmptyState title="Sem cartões" subtitle="Use flashcards para fixar pontos-chave." />
      ) : (
        (all.data ?? []).map((f) => (
          <Card key={f.id} style={styles.listRow}>
            <Text style={styles.listText} numberOfLines={1}>
              {f.frente}
            </Text>
            <Pressable onPress={() => del.mutate(f.id)} hitSlop={8}>
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
          </Card>
        ))
      )}

      <AddCardModal
        visible={adding}
        saving={create.isPending}
        onClose={() => setAdding(false)}
        onSave={async (frente, verso) => {
          await create.mutateAsync({ frente, verso });
          setAdding(false);
        }}
      />
    </Screen>
  );
}

function AddCardModal({
  visible,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (frente: string, verso: string) => void;
}) {
  const [frente, setFrente] = useState('');
  const [verso, setVerso] = useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Novo cartão</Text>
          <TextInput style={styles.input} placeholder="Frente (pergunta)" placeholderTextColor={colors.textLight} onChangeText={setFrente} multiline />
          <TextInput style={[styles.input, { minHeight: 90 }]} placeholder="Verso (resposta)" placeholderTextColor={colors.textLight} onChangeText={setVerso} multiline />
          <View style={styles.actions}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Salvar" onPress={() => onSave(frente.trim() || '—', verso.trim() || '—')} loading={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  due: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  addBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  flashcard: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  face: { fontSize: 12, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  cardText: { fontSize: 18, color: colors.textPrimary, textAlign: 'center', lineHeight: 26 },
  tap: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  done: { fontSize: 40 },
  ratings: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rateBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  rateLabel: { fontWeight: '700' },
  rateInt: { fontSize: 11, color: colors.textMuted },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listText: { flex: 1, color: colors.textPrimary },
  delete: { fontSize: 18 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bgLight,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
