import { View, Text, StyleSheet } from 'react-native';
import * as core from '@anesthequest/core';
import { Screen, Card, SectionTitle, Loading, ErrorState, EmptyState } from '@/components/ui';
import { useAnalytics, useOverallStats } from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

export default function Desempenho() {
  const analytics = useAnalytics();
  const overall = useOverallStats();

  if (analytics.isLoading) return <Loading />;
  if (analytics.error) return <ErrorState error={analytics.error} />;

  const rows = (analytics.data ?? []).slice().sort((a, b) => {
    const accA = core.accuracyPct(a.n_correct, a.n_total);
    const accB = core.accuracyPct(b.n_correct, b.n_total);
    return accA - accB; // pontos fracos primeiro
  });

  if (rows.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Sem dados ainda"
          subtitle="Responda alguns blocos para ver seu desempenho por tema."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.overallCard}>
        <Text style={styles.overallValue}>{Math.round(overall.data?.accuracy ?? 0)}%</Text>
        <Text style={styles.overallLabel}>acerto geral · {overall.data?.total ?? 0} questões</Text>
      </Card>

      <SectionTitle>Por tema (pontos fracos primeiro)</SectionTitle>
      {rows.map((r) => {
        const acc = core.accuracyPct(r.n_correct, r.n_total);
        const mastery = core.masteryLevel(acc);
        const color =
          mastery === 'forte' ? colors.correct : mastery === 'medio' ? colors.accent : colors.incorrect;
        return (
          <Card key={r.taxonomy_id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.theme}>{r.nome}</Text>
              <Text style={[styles.acc, { color }]}>{acc}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${acc}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.meta}>
              {r.n_correct}/{r.n_total} acertos
              {r.avg_time ? ` · ${Math.round(r.avg_time)}s/questão` : ''}
            </Text>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overallCard: { alignItems: 'center', paddingVertical: spacing.lg },
  overallValue: { fontSize: 44, fontWeight: '800', color: colors.primary },
  overallLabel: { color: colors.textMuted },
  row: { gap: spacing.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  theme: { fontWeight: '600', color: colors.textPrimary, flex: 1 },
  acc: { fontWeight: '700' },
  barBg: { height: 8, backgroundColor: colors.bgLight, borderRadius: radius.sm, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: radius.sm },
  meta: { fontSize: 12, color: colors.textMuted },
});
