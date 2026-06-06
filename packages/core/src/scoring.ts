// Lógica pura de pontuação/tentativas e agregação de desempenho.
// Mantida sem dependências para ser facilmente testável e reusável
// no app (Expo), na web (Next.js) e em edge functions.

export interface AttemptLike {
  correto: boolean;
  tempo_seg?: number | null;
}

/** Correção de questão de única escolha. */
export function isSingleCorrect(
  selected: string | null | undefined,
  correctIds: readonly string[],
): boolean {
  if (!selected) return false;
  return correctIds.includes(selected);
}

/** Correção de múltipla escolha: acerta se o conjunto for exatamente igual. */
export function isMultiCorrect(
  selected: readonly string[],
  correctIds: readonly string[],
): boolean {
  const uniqueSelected = new Set(selected);
  if (uniqueSelected.size !== correctIds.length) return false;
  const correctSet = new Set(correctIds);
  for (const id of uniqueSelected) {
    if (!correctSet.has(id)) return false;
  }
  return true;
}

/** Percentual de acerto (0–100, 1 casa decimal). Seguro para total 0. */
export function accuracyPct(nCorrect: number, nTotal: number): number {
  if (nTotal <= 0) return 0;
  return Math.round((nCorrect / nTotal) * 1000) / 10;
}

export interface AttemptsSummary {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  avgTimeSeg: number | null;
}

export function summarizeAttempts(attempts: readonly AttemptLike[]): AttemptsSummary {
  const total = attempts.length;
  const correct = attempts.reduce((acc, a) => acc + (a.correto ? 1 : 0), 0);
  const times = attempts
    .map((a) => a.tempo_seg)
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t));
  const avgTimeSeg = times.length
    ? Math.round((times.reduce((s, t) => s + t, 0) / times.length) * 10) / 10
    : null;
  return {
    total,
    correct,
    incorrect: total - correct,
    accuracy: accuracyPct(correct, total),
    avgTimeSeg,
  };
}

/**
 * Média incremental — espelha a lógica SQL de grade_attempt/analytics_aggregates.
 * Mantida em sincronia para que os agregados pré-computados batam com os testes.
 */
export function runningAverage(
  prevAvg: number | null,
  prevCount: number,
  newValue: number | null,
): number | null {
  if (newValue == null) return prevAvg;
  if (prevAvg == null || prevCount <= 0) return newValue;
  return (prevAvg * prevCount + newValue) / (prevCount + 1);
}

export type Mastery = 'fraco' | 'medio' | 'forte';

export function masteryLevel(accuracy: number): Mastery {
  if (accuracy < 60) return 'fraco';
  if (accuracy < 80) return 'medio';
  return 'forte';
}

export interface TaxonomyStat {
  taxonomyId: string;
  correct: number;
  total: number;
  accuracy: number;
  mastery: Mastery;
}

/** Agrega desempenho por nó de taxonomia (uma tentativa pode contar p/ vários). */
export function aggregateByTaxonomy(
  attempts: readonly (AttemptLike & { taxonomyIds: readonly string[] })[],
): TaxonomyStat[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    for (const t of a.taxonomyIds) {
      const cur = map.get(t) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (a.correto) cur.correct += 1;
      map.set(t, cur);
    }
  }
  return [...map.entries()].map(([taxonomyId, s]) => {
    const accuracy = accuracyPct(s.correct, s.total);
    return {
      taxonomyId,
      correct: s.correct,
      total: s.total,
      accuracy,
      mastery: masteryLevel(accuracy),
    };
  });
}
