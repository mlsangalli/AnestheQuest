import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MODE_LABELS } from '@anesthequest/core';
import { Screen, Button, Card, SectionTitle, Badge, EmptyState } from '@/components/ui';
import { useIsSubscriber, useRecentSessions, useAnalytics } from '@/hooks/useData';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing, radius } from '@/theme/colors';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSubscriber } = useIsSubscriber();
  const sessions = useRecentSessions();
  const analytics = useAnalytics();

  const totalAnswered = (analytics.data ?? []).reduce((s, a) => s + a.n_total, 0);
  const totalCorrect = (analytics.data ?? []).reduce((s, a) => s + a.n_correct, 0);
  const overall = totalAnswered ? Math.round((100 * totalCorrect) / totalAnswered) : 0;

  return (
    <Screen>
      <Text style={styles.greeting}>Olá{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋</Text>
      <Text style={styles.sub}>Pronto para praticar?</Text>

      {!isSubscriber && (
        <Card style={styles.paywallCard}>
          <Badge label="Acesso bloqueado" color={colors.accent} />
          <Text style={styles.paywallText}>
            Assine para liberar o banco de questões comentadas do TEA.
          </Text>
          <Button title="Ver planos" onPress={() => router.push('/paywall')} />
        </Card>
      )}

      <Button
        title="＋ Criar teste"
        onPress={() => router.push(isSubscriber ? '/criar-teste' : '/paywall')}
        style={{ marginTop: spacing.md }}
      />

      <Card style={styles.statRow}>
        <Stat label="Questões" value={String(totalAnswered)} />
        <Stat label="Acerto geral" value={`${overall}%`} />
        <Stat label="Temas" value={String((analytics.data ?? []).length)} />
      </Card>

      <SectionTitle>Ferramentas</SectionTitle>
      <View style={styles.tools}>
        <ToolLink emoji="🧠" label="Flashcards" onPress={() => router.push('/flashcards')} />
        <ToolLink emoji="🤖" label="Assistente IA" onPress={() => router.push('/assistente')} />
        <ToolLink emoji="🗺️" label="Plano" onPress={() => router.push('/plano')} />
      </View>

      <SectionTitle>Histórico recente</SectionTitle>
      {(sessions.data ?? []).length === 0 ? (
        <EmptyState title="Nenhum bloco ainda" subtitle="Crie seu primeiro teste para começar." />
      ) : (
        (sessions.data ?? []).map((s) => (
          <Card key={s.id} style={styles.sessionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionTitle}>
                {MODE_LABELS[s.modo]} · {s.total_questions ?? 0} questões
              </Text>
              <Text style={styles.sessionMeta}>
                {new Date(s.created_at).toLocaleDateString('pt-BR')}{' '}
                {s.finished_at ? '· concluído' : '· em aberto'}
              </Text>
            </View>
            <Button
              title="Ver"
              variant="secondary"
              onPress={() => router.push(`/resultado/${s.id}`)}
              style={styles.verBtn}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ToolLink({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tool}>
      <Text style={styles.toolEmoji}>{emoji}</Text>
      <Text style={styles.toolLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  sub: { color: colors.textMuted, marginBottom: spacing.sm },
  paywallCard: { gap: spacing.sm, borderColor: colors.accent },
  paywallText: { color: colors.textPrimary },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionTitle: { fontWeight: '600', color: colors.textPrimary },
  sessionMeta: { fontSize: 12, color: colors.textMuted },
  verBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  tools: { flexDirection: 'row', gap: spacing.sm },
  tool: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolEmoji: { fontSize: 24 },
  toolLabel: { fontSize: 12, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
});
