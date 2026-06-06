import { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button, Card, Loading } from '@/components/ui';
import { useIsSubscriber } from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  sources?: number;
}

export default function Assistente() {
  const router = useRouter();
  const { isSubscriber, isLoading } = useIsSubscriber();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (isLoading) return <Loading />;

  if (!isSubscriber) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>Assistente de IA</Text>
        <Text style={styles.gateText}>
          Disponível para assinantes. Tire dúvidas com base nas explicações do banco.
        </Text>
        <Button title="Ver planos" onPress={() => router.push('/paywall')} />
      </View>
    );
  }

  async function send() {
    const question = input.trim();
    if (!question || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { question },
      });
      if (error) throw error;
      const d = data as { answer: string; sources?: string[] };
      setMessages((m) => [...m, { role: 'assistant', content: d.answer, sources: d.sources?.length }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'Não consegui responder agora. O assistente requer a edge function "ai-assistant" publicada e a OPENAI_API_KEY configurada.',
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {messages.length === 0 && (
          <Card style={styles.hint}>
            <Text style={styles.hintText}>
              Pergunte sobre via aérea, farmacologia, etc. As respostas usam apenas as explicações
              autorais do AnestheQuest (RAG).
            </Text>
          </Card>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === 'user' ? styles.user : styles.assistant]}
          >
            <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>{m.content}</Text>
            {m.sources != null && (
              <Text style={styles.sources}>{m.sources} fonte(s) do banco</Text>
            )}
          </View>
        ))}
        {busy && <Text style={styles.typing}>Pensando…</Text>}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Sua dúvida…"
          placeholderTextColor={colors.textLight}
          onSubmitEditing={send}
        />
        <Button title="Enviar" onPress={send} loading={busy} style={styles.sendBtn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  messages: { padding: spacing.md, gap: spacing.sm },
  hint: { backgroundColor: '#E8F2FD', borderColor: colors.primary },
  hintText: { color: colors.textPrimary },
  bubble: { padding: spacing.md, borderRadius: radius.md, maxWidth: '90%' },
  user: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  assistant: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  userText: { color: colors.white, fontSize: 15, lineHeight: 21 },
  assistantText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  sources: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  typing: { color: colors.textMuted, fontStyle: 'italic', paddingHorizontal: spacing.sm },
  inputBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
  },
  sendBtn: { paddingHorizontal: spacing.lg },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  gateTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  gateText: { color: colors.textMuted, textAlign: 'center' },
});
