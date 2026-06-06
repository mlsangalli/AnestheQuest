import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as core from '@anesthequest/core';
import {
  MODE_LABELS,
  FILTER_LABELS,
  type SessionMode,
  type QuestionFilter,
  type TaxonomyNode,
} from '@anesthequest/core';
import { supabase } from '@/lib/supabase';
import { Screen, Button, Card, SectionTitle, Loading, ErrorState } from '@/components/ui';
import { useTaxonomyTree } from '@/hooks/useData';
import { colors, spacing, radius } from '@/theme/colors';

const MODES: SessionMode[] = ['tutor', 'timed', 'timed_tutor', 'untimed'];
const FILTERS: QuestionFilter[] = ['nao_usadas', 'erradas', 'marcadas', 'todas'];
const SIZES = [5, 10, 20, 40];

export default function CriarTeste() {
  const router = useRouter();
  const tree = useTaxonomyTree();
  const [modo, setModo] = useState<SessionMode>('tutor');
  const [statusFilter, setStatusFilter] = useState<QuestionFilter>('nao_usadas');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(10);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const taxIds = useMemo(() => [...selected], [selected]);

  const count = useQuery({
    queryKey: ['count', taxIds, statusFilter],
    queryFn: () => core.countQuestions(supabase, taxIds, statusFilter),
  });

  const available = count.data ?? 0;
  const effectiveLimit = Math.min(limit, available || limit);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function start() {
    setStarting(true);
    setErr(null);
    try {
      const res = await core.createSession(supabase, {
        modo,
        taxonomyIds: taxIds,
        statusFilter,
        limit,
      });
      if (!res.question_ids.length) {
        setErr('Nenhuma questão encontrada com esses filtros.');
        return;
      }
      router.replace({
        pathname: '/sessao/[id]',
        params: { id: res.session_id, qids: res.question_ids.join(','), modo },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar o teste.');
    } finally {
      setStarting(false);
    }
  }

  if (tree.isLoading) return <Loading label="Carregando temas…" />;
  if (tree.error) return <ErrorState error={tree.error} />;

  return (
    <Screen>
      <SectionTitle>Modo</SectionTitle>
      <View style={styles.chips}>
        {MODES.map((m) => (
          <Chip key={m} label={MODE_LABELS[m]} active={modo === m} onPress={() => setModo(m)} />
        ))}
      </View>

      <SectionTitle>Filtrar questões</SectionTitle>
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={FILTER_LABELS[f]}
            active={statusFilter === f}
            onPress={() => setStatusFilter(f)}
          />
        ))}
      </View>

      <SectionTitle>Temas</SectionTitle>
      <Text style={styles.hint}>Sem seleção = todos os temas. Selecionar um tema inclui os subtemas.</Text>
      <Card>
        {(tree.data ?? []).map((node) => (
          <TaxRow key={node.id} node={node} depth={0} selected={selected} onToggle={toggle} />
        ))}
      </Card>

      <SectionTitle>Quantidade</SectionTitle>
      <View style={styles.chips}>
        {SIZES.map((n) => (
          <Chip key={n} label={String(n)} active={limit === n} onPress={() => setLimit(n)} />
        ))}
      </View>

      <Card style={styles.previewCard}>
        <Text style={styles.previewText}>
          {count.isLoading ? 'Calculando…' : `${available} questões disponíveis`}
        </Text>
        <Text style={styles.previewSub}>O bloco terá até {effectiveLimit} questões.</Text>
      </Card>

      {err && <Text style={styles.err}>{err}</Text>}

      <Button
        title="Iniciar bloco"
        onPress={start}
        loading={starting}
        disabled={available === 0}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

function TaxRow({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: TaxonomyNode;
  depth: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isOn = selected.has(node.id);
  return (
    <>
      <Pressable
        onPress={() => onToggle(node.id)}
        style={[styles.taxRow, { paddingLeft: spacing.sm + depth * spacing.lg }]}
      >
        <View style={[styles.checkbox, isOn && styles.checkboxOn]}>
          {isOn && <Text style={styles.check}>✓</Text>}
        </View>
        <Text style={styles.taxLabel}>{node.nome}</Text>
      </Pressable>
      {node.children.map((c) => (
        <TaxRow key={c.id} node={c} depth={depth + 1} selected={selected} onToggle={onToggle} />
      ))}
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: colors.white },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  taxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.white, fontSize: 14, fontWeight: '700' },
  taxLabel: { color: colors.textPrimary, flex: 1 },
  previewCard: { marginTop: spacing.md, alignItems: 'center' },
  previewText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  previewSub: { fontSize: 12, color: colors.textMuted },
  err: { color: colors.incorrect, marginTop: spacing.sm, textAlign: 'center' },
});
