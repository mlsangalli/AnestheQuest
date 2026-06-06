// Preços CONFIGURÁVEIS (não fixos). Valores em centavos de BRL.
// Ajuste livremente; os Stripe Price IDs vêm de variáveis de ambiente.

export type PlanId = 'anual' | 'residente';

export interface PlanConfig {
  id: PlanId;
  nome: string;
  precoCentavos: number;
  intervalo: 'ano';
  descricao: string;
  publico: string;
  /** Nome da env var com o Stripe Price ID (web). */
  stripePriceEnv: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  anual: {
    id: 'anual',
    nome: 'Anual',
    precoCentavos: 89700, // R$ 897/ano
    intervalo: 'ano',
    descricao: 'Acesso completo por 12 meses.',
    publico: 'Especialistas e candidatos ao TEA',
    stripePriceEnv: 'STRIPE_PRICE_ANUAL',
  },
  residente: {
    id: 'residente',
    nome: 'Residente',
    precoCentavos: 49700, // R$ 497/ano
    intervalo: 'ano',
    descricao: 'Plano com desconto para residentes (requer comprovação).',
    publico: 'Residentes de Anestesiologia',
    stripePriceEnv: 'STRIPE_PRICE_RESIDENTE',
  },
};

export const PLAN_LIST: PlanConfig[] = Object.values(PLANS);

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Preço mensal equivalente (apenas para exibição comparativa). */
export function monthlyEquivalentCentavos(plan: PlanConfig): number {
  return Math.round(plan.precoCentavos / 12);
}
