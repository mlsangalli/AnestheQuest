import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/colors';

type Mode = 'entrar' | 'criar';

export default function SignIn() {
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  async function submit() {
    setLoading(true);
    setMsg(null);
    const { error } =
      mode === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMsg({ type: 'error', text: error.message });
    else if (mode === 'criar') setMsg({ type: 'info', text: 'Conta criada! Verifique o e-mail se a confirmação estiver ativa.' });
  }

  async function magicLink() {
    if (!email) return setMsg({ type: 'error', text: 'Informe o e-mail para o magic link.' });
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    setMsg(
      error
        ? { type: 'error', text: error.message }
        : { type: 'info', text: 'Magic link enviado para o seu e-mail.' },
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.logo}>AnestheQuest</Text>
        <Text style={styles.tagline}>Questões comentadas de Anestesiologia · TEA/SBA</Text>
      </View>

      <View style={styles.tabs}>
        {(['entrar', 'criar'] as Mode[]).map((m) => (
          <Button
            key={m}
            title={m === 'entrar' ? 'Entrar' : 'Criar conta'}
            variant={mode === m ? 'primary' : 'ghost'}
            onPress={() => setMode(m)}
            style={styles.tabBtn}
          />
        ))}
      </View>

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        placeholderTextColor={colors.textLight}
      />
      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={colors.textLight}
      />

      {msg && (
        <Text style={[styles.msg, msg.type === 'error' ? styles.error : styles.info]}>{msg.text}</Text>
      )}

      <Button
        title={mode === 'entrar' ? 'Entrar' : 'Criar conta'}
        onPress={submit}
        loading={loading}
        style={{ marginTop: spacing.md }}
      />
      <Button title="Entrar com magic link" variant="ghost" onPress={magicLink} disabled={loading} />

      {!isSupabaseConfigured && (
        <Text style={styles.warn}>⚠︎ Supabase não configurado — defina EXPO_PUBLIC_SUPABASE_* no .env</Text>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center', backgroundColor: colors.bgLight },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 34, fontWeight: '800', color: colors.primary },
  tagline: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tabBtn: { flex: 1 },
  label: { fontSize: 14, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  msg: { marginTop: spacing.sm, textAlign: 'center' },
  error: { color: colors.incorrect },
  info: { color: colors.correct },
  warn: { color: colors.incorrect, marginTop: spacing.lg, textAlign: 'center', fontSize: 12 },
});
