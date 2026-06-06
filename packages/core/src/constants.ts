// Espelha os enums do banco para manter app/web em sincronia com o schema.

export const TAXONOMY_KINDS = ['subject', 'system', 'topic'] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export const QUESTION_FORMATS = ['unica_escolha', 'multipla_escolha'] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export const QUESTION_DIFFICULTIES = ['facil', 'media', 'dificil'] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const QUESTION_STATUSES = ['rascunho', 'em_revisao', 'publicada'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const SESSION_MODES = ['tutor', 'timed', 'timed_tutor', 'untimed'] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

// Filtros de "Criar Teste" (status da questão para o usuário).
export const QUESTION_FILTERS = ['nao_usadas', 'erradas', 'marcadas', 'todas'] as const;
export type QuestionFilter = (typeof QUESTION_FILTERS)[number];

export const FEEDBACK_KINDS = [
  'erro_conteudo',
  'erro_digitacao',
  'alternativa_incorreta',
  'referencia_incorreta',
  'duplicada',
  'outro',
] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

// Rótulos pt-BR (i18n simples).
export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
};

export const MODE_LABELS: Record<SessionMode, string> = {
  tutor: 'Tutor',
  timed: 'Cronometrado',
  timed_tutor: 'Tutor cronometrado',
  untimed: 'Sem tempo',
};

export const FILTER_LABELS: Record<QuestionFilter, string> = {
  nao_usadas: 'Não usadas',
  erradas: 'Erradas',
  marcadas: 'Marcadas',
  todas: 'Todas',
};

// Identidade visual (tema sóbrio/clínico — alinhado à landing).
export const BRAND = {
  name: 'AnestheQuest',
  primaryBlue: '#1E88E5',
  accentGold: '#FACC34',
} as const;
