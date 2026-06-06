import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as core from '@anesthequest/core';
import { Screen, Card, Button, SectionTitle, Loading, EmptyState } from '@/components/ui';
import { useAnalytics } from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

// Plano de estudos simples: prioriza os temas mais fracos a partir do analytics.
export default function Plano() {
  const router = useRouter();
  const analytics = useAnalytics();

  if (analytics.isLoading) return <Loading />;

  const rows = (analytics.data ?? [])
    .map((r) => ({ ...r, acc: core.accuracyPct(r.n_correct, r.n_total) }))
    .sort((a, b) => a.acc - b.acc);

  const weak = rows.filter((r) => core.masteryLevel(r.acc) !== 'forte');

  if (rows.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Sem dados para o plano"
          subtitle="Responda alguns blocos e o plano destacará seus pontos fracos."
        />
        <Button title="Criar teste" onPress={() => router.push('/criar-teste')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>Seu plano desta semana</Text>
        <Text style={styles.summaryText}>
          {weak.length > 0
            ? `Foque em ${weak.length} tema(s) com maior margem de melhora. Sugestão: 1 bloco de 10 questões por dia, começando pelos mais fracos.`
            : 'Mandou bem! Mantenha a revisão espaçada e faça simulados cronometrados.'}
        </Text>
        <Button title="Criar bloco de revisão" onPress={() => router.push('/criar-teste')} />
      </Card>

      <SectionTitle>Prioridades</SectionTitle>
      {(weak.length > 0 ? weak : rows).slice(0, 8).map((r, i) => {
        const mastery = core.masteryLevel(r.acc);
        const color =
          mastery === 'forte' ? colors.correct : mastery === 'medio' ? colors.accent : colors.incorrect;
        return (
          <Card key={r.taxonomy_id} style={styles.row}>
            <View style={styles.rank}>
              <Text style={styles.rankNum}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.theme}>{r.nome}</Text>
              <Text style={styles.meta}>
                {r.acc}% de acerto · {r.n_total} respondidas
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: color }]} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm, borderColor: colors.primary },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  summaryText: { color: colors.textPrimary, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { fontWeight: '700', color: colors.textPrimary },
  theme: { fontWeight: '600', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textMuted },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
