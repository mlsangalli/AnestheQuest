import { describe, it, expect } from 'vitest';
import {
  isSingleCorrect,
  isMultiCorrect,
  accuracyPct,
  summarizeAttempts,
  runningAverage,
  masteryLevel,
  aggregateByTaxonomy,
} from './scoring';

describe('isSingleCorrect', () => {
  it('acerta quando a escolhida está entre as corretas', () => {
    expect(isSingleCorrect('c1', ['c1'])).toBe(true);
  });
  it('erra quando a escolhida não é correta', () => {
    expect(isSingleCorrect('c2', ['c1'])).toBe(false);
  });
  it('trata null/undefined como erro (questão pulada)', () => {
    expect(isSingleCorrect(null, ['c1'])).toBe(false);
    expect(isSingleCorrect(undefined, ['c1'])).toBe(false);
  });
});

describe('isMultiCorrect', () => {
  it('acerta com o conjunto exatamente igual (ordem irrelevante)', () => {
    expect(isMultiCorrect(['a', 'b'], ['b', 'a'])).toBe(true);
  });
  it('erra com subconjunto ou superconjunto', () => {
    expect(isMultiCorrect(['a'], ['a', 'b'])).toBe(false);
    expect(isMultiCorrect(['a', 'b', 'c'], ['a', 'b'])).toBe(false);
  });
  it('ignora duplicatas na seleção', () => {
    expect(isMultiCorrect(['a', 'a'], ['a'])).toBe(true);
  });
});

describe('accuracyPct', () => {
  it('calcula o percentual com 1 casa decimal', () => {
    expect(accuracyPct(1, 3)).toBe(33.3);
    expect(accuracyPct(2, 2)).toBe(100);
  });
  it('retorna 0 para total 0 (sem divisão por zero)', () => {
    expect(accuracyPct(0, 0)).toBe(0);
  });
});

describe('summarizeAttempts', () => {
  it('resume total, acertos, erros, acurácia e tempo médio', () => {
    const s = summarizeAttempts([
      { correto: true, tempo_seg: 30 },
      { correto: false, tempo_seg: 60 },
      { correto: true, tempo_seg: null },
    ]);
    expect(s.total).toBe(3);
    expect(s.correct).toBe(2);
    expect(s.incorrect).toBe(1);
    expect(s.accuracy).toBe(66.7);
    expect(s.avgTimeSeg).toBe(45); // média de 30 e 60 (ignora null)
  });
  it('lida com lista vazia', () => {
    expect(summarizeAttempts([])).toEqual({
      total: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      avgTimeSeg: null,
    });
  });
});

describe('runningAverage', () => {
  it('inicializa com o primeiro valor', () => {
    expect(runningAverage(null, 0, 10)).toBe(10);
  });
  it('atualiza a média incrementalmente (espelha o SQL)', () => {
    // média 30 sobre 2 amostras, nova amostra 60 => 40
    expect(runningAverage(30, 2, 60)).toBe(40);
  });
  it('mantém a média quando o novo valor é null', () => {
    expect(runningAverage(30, 2, null)).toBe(30);
  });
});

describe('masteryLevel', () => {
  it('classifica por faixas', () => {
    expect(masteryLevel(59.9)).toBe('fraco');
    expect(masteryLevel(60)).toBe('medio');
    expect(masteryLevel(79.9)).toBe('medio');
    expect(masteryLevel(80)).toBe('forte');
  });
});

describe('aggregateByTaxonomy', () => {
  it('soma por nó de taxonomia, contando em todos os nós da questão', () => {
    const stats = aggregateByTaxonomy([
      { correto: true, taxonomyIds: ['via-aerea', 'farmaco'] },
      { correto: false, taxonomyIds: ['via-aerea'] },
    ]);
    const viaAerea = stats.find((s) => s.taxonomyId === 'via-aerea')!;
    const farmaco = stats.find((s) => s.taxonomyId === 'farmaco')!;
    expect(viaAerea).toMatchObject({ correct: 1, total: 2, accuracy: 50, mastery: 'fraco' });
    expect(farmaco).toMatchObject({ correct: 1, total: 1, accuracy: 100, mastery: 'forte' });
  });
});
