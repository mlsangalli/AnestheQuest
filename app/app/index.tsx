import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { PLAN_LIST, formatBRL } from '@anesthequest/core';
import { useAuth } from '@/providers/AuthProvider';
import { isSupabaseConfigured } from '@/lib/env';
import { colors, spacing, radius } from '@/theme/colors';

// Telas da Fase 1 (ainda não implementadas) — ganchos visíveis no MVP.
const FASE1 = [
  'Criar Teste (filtros por tema/status, modo tutor/timed)',
  'Player de questões (timer, flag, highlight, strikethrough, grade numerada)',
  'Explicação (tutor): geral + justificativa por alternativa + referências',
  'Meu Desempenho (analytics por tema)',
  'Meu Caderno (notas por tema)',
  'Reportar erro / feedback',
  'Paywall / Assinatura (Stripe web)',
];

export default function Home() {
  const { session, loading } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AnestheQuest</Text>
      <Text style={styles.subtitle}>
        Questões comentadas de Anestesiologia — foco TEA/SBA
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Fase 0 — Fundação</Text>
      </View>

      <Text style={styles.section}>Status</Text>
      <Text style={styles.body}>
        Supabase: {isSupabaseConfigured ? 'configurado ✓' : 'não configurado (ver .env)'}
      </Text>
      <Text style={styles.body}>
        Sessão:{' '}
        {loading
          ? 'carregando…'
          : session
            ? `logado como ${session.user.email ?? session.user.id}`
            : 'não autenticado'}
      </Text>

      <Link href="/sign-in" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Entrar / Criar conta</Text>
        </Pressable>
      </Link>

      <Text style={styles.section}>Planos (configuráveis)</Text>
      {PLAN_LIST.map((p) => (
        <Text key={p.id} style={styles.body}>
          • {p.nome}: {formatBRL(p.precoCentavos)}/{p.intervalo} — {p.publico}
        </Text>
      ))}

      <Text style={styles.section}>Próximas telas (Fase 1)</Text>
      {FASE1.map((s) => (
        <Text key={s} style={styles.todo}>
          ◻︎ {s}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.xs },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  badgeText: { color: colors.bgDark, fontWeight: '600', fontSize: 12 },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  todo: { fontSize: 15, color: colors.textMuted, lineHeight: 24 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
});
