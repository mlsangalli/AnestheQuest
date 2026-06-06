import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import { FEEDBACK_KINDS, type FeedbackKind } from '@anesthequest/core';
import { useSubmitFeedback } from '@/hooks/useData';
import { Button } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/colors';

const LABELS: Record<FeedbackKind, string> = {
  erro_conteudo: 'Erro de conteúdo',
  erro_digitacao: 'Erro de digitação',
  alternativa_incorreta: 'Alternativa incorreta',
  referencia_incorreta: 'Referência incorreta',
  duplicada: 'Questão duplicada',
  outro: 'Outro',
};

export function FeedbackModal({
  visible,
  questionId,
  onClose,
}: {
  visible: boolean;
  questionId: string;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<FeedbackKind>('erro_conteudo');
  const [texto, setTexto] = useState('');
  const [done, setDone] = useState(false);
  const submit = useSubmitFeedback();

  async function send() {
    await submit.mutateAsync({ questionId, tipo, texto: texto.trim() || undefined });
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setTexto('');
      onClose();
    }, 1200);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Reportar erro</Text>
          {done ? (
            <Text style={styles.thanks}>Obrigado! Feedback enviado. ✓</Text>
          ) : (
            <>
              <View style={styles.chips}>
                {FEEDBACK_KINDS.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setTipo(k)}
                    style={[styles.chip, tipo === k && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, tipo === k && styles.chipTextActive]}>{LABELS[k]}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                multiline
                value={texto}
                onChangeText={setTexto}
                placeholder="Descreva o problema (opcional)"
                placeholderTextColor={colors.textLight}
              />
              {submit.error && (
                <Text style={styles.err}>
                  {submit.error instanceof Error ? submit.error.message : 'Erro ao enviar.'}
                </Text>
              )}
              <View style={styles.actions}>
                <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button title="Enviar" onPress={send} loading={submit.isPending} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.bgLight,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  thanks: { color: colors.correct, fontSize: 16, textAlign: 'center', paddingVertical: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textPrimary, fontSize: 13 },
  chipTextActive: { color: colors.white },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  err: { color: colors.incorrect },
});
