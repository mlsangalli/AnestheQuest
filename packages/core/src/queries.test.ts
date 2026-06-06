import { describe, it, expect } from 'vitest';
import {
  buildTaxonomyTree,
  dueFlashcards,
  isSubscriptionActive,
  type Taxonomy,
  type FlashcardWithSrs,
  type Subscription,
} from './queries';

function tax(id: string, parent_id: string | null, nome: string): Taxonomy {
  return { id, parent_id, tipo: 'topic', nome, slug: null, ordem: 0, is_placeholder: false, created_at: '' };
}

describe('buildTaxonomyTree', () => {
  it('aninha filhos sob os pais e mantém raízes no topo', () => {
    const flat = [
      tax('root', null, 'Anestesiologia'),
      tax('via', 'root', 'Via Aérea'),
      tax('dificil', 'via', 'Via aérea difícil'),
      tax('farmaco', 'root', 'Farmacologia'),
    ];
    const tree = buildTaxonomyTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('root');
    expect(tree[0].children.map((c) => c.id).sort()).toEqual(['farmaco', 'via']);
    const via = tree[0].children.find((c) => c.id === 'via')!;
    expect(via.children[0].id).toBe('dificil');
  });

  it('trata pai ausente como raiz', () => {
    const tree = buildTaxonomyTree([tax('orfa', 'inexistente', 'Órfã')]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('orfa');
  });
});

describe('dueFlashcards', () => {
  const now = new Date('2026-01-02T00:00:00Z');
  const mk = (id: string, due: string | null): FlashcardWithSrs =>
    ({ id, srs: due === null ? null : ({ due_date: due } as never) } as FlashcardWithSrs);

  it('inclui cartões sem SRS e os vencidos; exclui os futuros', () => {
    const list = [
      mk('novo', null),
      mk('vencido', '2026-01-01T00:00:00Z'),
      mk('futuro', '2026-02-01T00:00:00Z'),
    ];
    const due = dueFlashcards(list, now).map((f) => f.id);
    expect(due).toContain('novo');
    expect(due).toContain('vencido');
    expect(due).not.toContain('futuro');
  });
});

describe('isSubscriptionActive', () => {
  const base: Subscription = {
    user_id: 'u',
    plano: 'anual',
    status: 'active',
    provider: 'stripe',
    provider_customer_id: null,
    provider_subscription_id: null,
    current_period_end: null,
    cancel_at_period_end: false,
    created_at: '',
    updated_at: '',
  };

  it('null => inativo', () => expect(isSubscriptionActive(null)).toBe(false));
  it('active sem fim de período => ativo', () => expect(isSubscriptionActive(base)).toBe(true));
  it('active mas período expirado => inativo', () =>
    expect(isSubscriptionActive({ ...base, current_period_end: '2000-01-01T00:00:00Z' })).toBe(false));
  it('trialing futuro => ativo', () =>
    expect(
      isSubscriptionActive({ ...base, status: 'trialing', current_period_end: '2999-01-01T00:00:00Z' }),
    ).toBe(true));
  it('canceled => inativo', () =>
    expect(isSubscriptionActive({ ...base, status: 'canceled' })).toBe(false));
});
