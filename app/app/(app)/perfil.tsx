import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as core from '@anesthequest/core';
import { Screen, Card, Button, SectionTitle, Badge, Loading } from '@/components/ui';
import { useProfile, useUpdateProfile, useSubscription } from '@/hooks/useData';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing, radius } from '@/theme/colors';

export default function Perfil() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const subscription = useSubscription();

  const [nome, setNome] = useState('');
  const [crm, setCrm] = useState('');
  const [alvo, setAlvo] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setNome(profile.data.nome ?? '');
      setCrm(profile.data.crm ?? '');
      setAlvo(profile.data.especialidade_alvo ?? '');
    }
  }, [profile.data]);

  if (profile.isLoading) return <Loading />;

  const active = core.isSubscriptionActive(subscription.data ?? null);

  async function save() {
    await updateProfile.mutateAsync({ nome, crm, especialidade_alvo: alvo });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <Text style={styles.email}>{user?.email}</Text>
        <Badge
          label={active ? 'Assinatura ativa' : 'Sem assinatura'}
          color={active ? colors.correct : colors.textLight}
          textColor={colors.white}
        />
        {active && subscription.data?.current_period_end && (
          <Text style={styles.renew}>
            Renova em {new Date(subscription.data.current_period_end).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </Card>

      <SectionTitle>Dados</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />
        <Field label="CRM" value={crm} onChangeText={setCrm} placeholder="CRM/UF" />
        <Field
          label="Especialidade-alvo"
          value={alvo}
          onChangeText={setAlvo}
          placeholder="Ex.: Anestesiologia (TEA)"
        />
        <Button title={saved ? 'Salvo ✓' : 'Salvar'} onPress={save} loading={updateProfile.isPending} />
      </Card>

      <SectionTitle>Assinatura</SectionTitle>
      <Button
        title={active ? 'Gerenciar assinatura' : 'Ver planos'}
        variant="secondary"
        onPress={() => router.push('/paywall')}
      />

      <Button title="Sair" variant="danger" onPress={signOut} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center', gap: spacing.sm },
  email: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  renew: { color: colors.textMuted, fontSize: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
});
