import { describe, it, expect } from 'vitest';
import { PLANS, PLAN_LIST, formatBRL, monthlyEquivalentCentavos } from './pricing';

describe('formatBRL', () => {
  it('formata centavos como moeda BRL', () => {
    // usa espaço não-quebrável entre R$ e o número (locale pt-BR)
    expect(formatBRL(89700).replace(/\s/g, ' ')).toBe('R$ 897,00');
    expect(formatBRL(49700).replace(/\s/g, ' ')).toBe('R$ 497,00');
    expect(formatBRL(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });
});

describe('PLANS', () => {
  it('tem os planos anual e residente com os preços configurados', () => {
    expect(PLANS.anual.precoCentavos).toBe(89700);
    expect(PLANS.residente.precoCentavos).toBe(49700);
    expect(PLAN_LIST).toHaveLength(2);
  });
  it('residente é mais barato que anual', () => {
    expect(PLANS.residente.precoCentavos).toBeLessThan(PLANS.anual.precoCentavos);
  });
});

describe('monthlyEquivalentCentavos', () => {
  it('divide o preço anual por 12', () => {
    expect(monthlyEquivalentCentavos(PLANS.anual)).toBe(Math.round(89700 / 12));
  });
});
