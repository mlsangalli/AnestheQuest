import { View, Text, StyleSheet } from 'react-native';
import type { ExplanationBundle, Choice } from '@anesthequest/core';
import { colors, spacing, radius } from '@/theme/colors';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Painel de explicação (modo tutor): explicação geral + justificativa por
// alternativa + objetivo educacional + referências + mídia (placeholder).
export function ExplanationPanel({
  bundle,
  choices,
  correctIds,
  selectedId,
}: {
  bundle: ExplanationBundle;
  choices: Choice[];
  correctIds: string[];
  selectedId: string | null;
}) {
  const { explanation, choiceExplanations, media } = bundle;
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Explicação</Text>
        {selectedId && (
          <Text style={[styles.verdict, correctIds.includes(selectedId) ? styles.ok : styles.no]}>
            {correctIds.includes(selectedId) ? 'Você acertou' : 'Você errou'}
          </Text>
        )}
      </View>

      {explanation?.texto_geral ? (
        <Text style={styles.body}>{explanation.texto_geral}</Text>
      ) : (
        <Text style={styles.muted}>Explicação ainda não disponível para esta questão.</Text>
      )}

      {media.map((m) => (
        <View key={m.id} style={styles.media}>
          <Text style={styles.mediaText}>🖼 {m.alt_text ?? 'Imagem'} (mídia)</Text>
        </View>
      ))}

      <Text style={styles.subheader}>Por que cada alternativa?</Text>
      {choices.map((c, i) => {
        const isCorrect = correctIds.includes(c.id);
        return (
          <View key={c.id} style={styles.choiceExpl}>
            <Text style={[styles.choiceLetter, isCorrect ? styles.ok : styles.no]}>
              {LETTERS[i] ?? i + 1} {isCorrect ? '✓' : '✗'}
            </Text>
            <Text style={styles.choiceText}>
              {choiceExplanations[c.id] ?? '—'}
            </Text>
          </View>
        );
      })}

      {explanation?.objetivo_educacional && (
        <>
          <Text style={styles.subheader}>Objetivo educacional</Text>
          <Text style={styles.body}>{explanation.objetivo_educacional}</Text>
        </>
      )}
      {explanation?.referencias && (
        <>
          <Text style={styles.subheader}>Referências</Text>
          <Text style={styles.muted}>{explanation.referencias}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  verdict: { fontWeight: '700' },
  ok: { color: colors.correct },
  no: { color: colors.incorrect },
  subheader: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  body: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  media: {
    backgroundColor: colors.bgLight,
    borderRadius: radius.sm,
    padding: spacing.lg,
    alignItems: 'center',
  },
  mediaText: { color: colors.textMuted },
  choiceExpl: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  choiceLetter: { fontWeight: '800', width: 34 },
  choiceText: { flex: 1, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
});
