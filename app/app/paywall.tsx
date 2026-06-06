import { useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { PLAN_LIST, formatBRL, monthlyEquivalentCentavos, type PlanId } from '@anesthequest/core';
import { supabase } from '@/lib/supabase';
import { Screen, Card, Button, SectionTitle } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/colors';

export default function Paywall() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function subscribe(plan: PlanId) {
    setLoadingPlan(plan);
    setErr(null);
    try {
      // Checkout via Stripe (Edge Function). Web-only no MVP.
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { plan } });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error('Checkout indisponível. Tente novamente.');
      if (Platform.OS === 'web') window.location.assign(url);
      else await Linking.openURL(url);
    } catch (e) {
      setErr(
        e instanceof Error
          ? `${e.message} (a Edge Function "create-checkout" precisa estar publicada e o Stripe configurado).`
          : 'Erro ao iniciar o checkout.',
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Acesso completo ao AnestheQuest</Text>
      <Text style={styles.subtitle}>
        Banco de questões comentadas do TEA, com explicação por alternativa, analytics e caderno.
      </Text>

      {PLAN_LIST.map((p) => (
        <Card key={p.id} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{p.nome}</Text>
            <Text style={styles.planPrice}>{formatBRL(p.precoCentavos)}<Text style={styles.per}>/ano</Text></Text>
          </View>
          <Text style={styles.planMonthly}>
            ≈ {formatBRL(monthlyEquivalentCentavos(p))}/mês · {p.publico}
          </Text>
          <Text style={styles.planDesc}>{p.descricao}</Text>
          <Button
            title={`Assinar ${p.nome}`}
            onPress={() => subscribe(p.id)}
            loading={loadingPlan === p.id}
          />
        </Card>
      ))}

      {err && <Text style={styles.err}>{err}</Text>}

      <SectionTitle>Pagamento</SectionTitle>
      <Text style={styles.note}>
        Pagamento seguro via Stripe (cartão){'\n'}Pix em avaliação para o lançamento.{'\n'}
        Compras no app (iOS/Android) chegam na fase mobile via RevenueCat.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { color: colors.textMuted, marginBottom: spacing.md },
  planCard: { gap: spacing.xs, marginBottom: spacing.sm },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  planName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  planPrice: { fontSize: 22, fontWeight: '800', color: colors.primary },
  per: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  planMonthly: { color: colors.textMuted, fontSize: 13 },
  planDesc: { color: colors.textPrimary, marginBottom: spacing.xs },
  err: { color: colors.incorrect, marginTop: spacing.sm },
  note: { color: colors.textMuted, lineHeight: 20 },
});
