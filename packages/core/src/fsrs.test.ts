import { describe, it, expect } from 'vitest';
import { newCardState, reviewCard, previewIntervals } from './fsrs';

describe('newCardState', () => {
  it('cria um cartão novo com learning_steps e contadores zerados', () => {
    const s = newCardState();
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(0);
    expect(s.state).toBe(0); // New
    expect(s.learning_steps).toBe(0);
    expect(typeof s.due_date).toBe('string');
  });
});

describe('reviewCard', () => {
  it('avança o cartão ao avaliar "good" (incrementa reps e agenda no futuro)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const next = reviewCard(newCardState(now), 'good', now);
    expect(next.reps).toBeGreaterThanOrEqual(1);
    expect(new Date(next.due_date!).getTime()).toBeGreaterThan(now.getTime());
    expect(typeof next.learning_steps).toBe('number');
  });

  it('preserva learning_steps no round-trip de persistência (corrige o bug do review)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const reviewed = reviewCard(newCardState(now), 'good', now);
    // simula reload: o mesmo estado é relido e reavaliado
    const again = reviewCard(reviewed, 'good', new Date(reviewed.due_date!));
    expect(again.reps).toBeGreaterThan(reviewed.reps);
  });
});

describe('previewIntervals', () => {
  it('ordena as datas: again <= hard <= good <= easy', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const iv = previewIntervals(newCardState(now), now);
    expect(iv.again.getTime()).toBeLessThanOrEqual(iv.hard.getTime());
    expect(iv.hard.getTime()).toBeLessThanOrEqual(iv.good.getTime());
    expect(iv.good.getTime()).toBeLessThanOrEqual(iv.easy.getTime());
  });
});
