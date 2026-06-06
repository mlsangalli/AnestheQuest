import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing, radius } from '@/theme/colors';

// Tela mínima de autenticação (Supabase Auth). O fluxo completo de perfil
// e recuperação de senha entra na Fase 1.
export default function SignIn() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(action: () => Promise<{ error: { message: string } | null }>) {
    setLoading(true);
    setMsg(null);
    const { error } = await action();
    setLoading(false);
    if (error) setMsg(error.message);
    else router.replace('/');
  }

  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Logado como {session.user.email}</Text>
        <Pressable style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
      />
      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
      />

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />}
      {msg && <Text style={styles.error}>{msg}</Text>}

      <Pressable
        style={styles.button}
        onPress={() => run(() => supabase.auth.signInWithPassword({ email, password }))}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.secondary]}
        onPress={() => run(() => supabase.auth.signUp({ email, password }))}
      >
        <Text style={[styles.buttonText, styles.secondaryText]}>Criar conta</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          run(async () => {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (!error) setMsg('Magic link enviado para o seu e-mail.');
            return { error };
          })
        }
      >
        <Text style={styles.link}>Entrar com magic link</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.xs, backgroundColor: colors.bgLight },
  label: { fontSize: 14, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  buttonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  secondaryText: { color: colors.primary },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  error: { color: colors.incorrect, marginTop: spacing.xs },
});
