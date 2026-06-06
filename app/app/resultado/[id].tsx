import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as core from '@anesthequest/core';
import { supabase } from '@/lib/supabase';
import { Screen, Card, Button, Loading, ErrorState, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme/colors';

export default function Resultado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['result', id],
    queryFn: async () => {
      const [attempts, session] = await Promise.all([
        core.fetchSessionAttempts(supabase, id),
        core.fetchSession(supabase, id),
      ]);
      // Simulado: registra/atualiza o resultado e obtém o percentil de pares.
      let simulado: core.SimuladoResult | null = null;
      if (session?.modo === 'timed' && attempts.length > 0) {
        try {
          simulado = await core.recordSimulado(supabase, id);
        } catch {
          /* ignora se não houver tentativas suficientes */
        }
      }
      return { attempts, session, simulado };
    },
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;

  const { attempts, simulado } = query.data!;
  const summary = core.summarizeAttempts(attempts);
  const mastery = core.masteryLevel(summary.accuracy);
  const masteryColor =
    mastery === 'forte' ? colors.correct : mastery === 'medio' ? colors.accent : colors.incorrect;

  return (
    <Screen>
      <Card style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Acerto</Text>
        <Text style={[styles.score, { color: masteryColor }]}>{summary.accuracy}%</Text>
        <Text style={styles.scoreSub}>
          {summary.correct} de {summary.total} questões
        </Text>
        <Badge
          label={mastery === 'forte' ? 'Forte' : mastery === 'medio' ? 'Médio' : 'A reforçar'}
          color={masteryColor}
          textColor={colors.white}
        />
      </Card>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.incorrect}</Text>
          <Text style={styles.statLabel}>Erros</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.avgTimeSeg ? `${summary.avgTimeSeg}s` : '—'}</Text>
          <Text style={styles.statLabel}>Tempo médio</Text>
        </Card>
      </View>

      {simulado && (
        <Card style={styles.percentileCard}>
          <Text style={styles.percentileTitle}>Simulado · Percentil de pares</Text>
          <Text style={styles.percentileValue}>{simulado.percentile}º percentil</Text>
          <Text style={styles.scoreSub}>
            Você foi melhor que {simulado.percentile}% dos resultados registrados.
          </Text>
        </Card>
      )}

      <Button title="Voltar ao início" onPress={() => router.replace('/(app)')} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  scoreLabel: { color: colors.textMuted },
  score: { fontSize: 56, fontWeight: '800' },
  scoreSub: { color: colors.textMuted },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  percentileCard: { marginTop: spacing.md, alignItems: 'center', borderColor: colors.primary },
  percentileTitle: { fontWeight: '700', color: colors.textPrimary },
  percentileValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
});
