// Wrapper do algoritmo FSRS (ts-fsrs) para os flashcards (Fase 2).
// Converte entre o estado persistido (srs_state) e o Card do ts-fsrs.
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export { Rating, State };
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

const RATING_MAP: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

// Estado persistido (subset de srs_state)
export interface SrsState {
  difficulty: number | null;
  stability: number | null;
  due_date: string | null;
  last_review: string | null;
  reps: number;
  lapses: number;
  state: number;
}

export function newCardState(now: Date = new Date()): SrsState {
  return cardToState(createEmptyCard(now));
}

function stateToCard(s: SrsState): Card {
  const base = createEmptyCard(new Date());
  return {
    ...base,
    due: s.due_date ? new Date(s.due_date) : base.due,
    stability: s.stability ?? base.stability,
    difficulty: s.difficulty ?? base.difficulty,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

function cardToState(card: Card): SrsState {
  return {
    difficulty: card.difficulty,
    stability: card.stability,
    due_date: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
  };
}

/** Aplica uma avaliação e devolve o novo estado a persistir. */
export function reviewCard(state: SrsState, rating: ReviewRating, now: Date = new Date()): SrsState {
  const { card } = scheduler.next(stateToCard(state), now, RATING_MAP[rating]);
  return cardToState(card);
}

/** Prévia das próximas datas para cada avaliação (para exibir nos botões). */
export function previewIntervals(state: SrsState, now: Date = new Date()): Record<ReviewRating, Date> {
  const log = scheduler.repeat(stateToCard(state), now);
  return {
    again: log[Rating.Again].card.due,
    hard: log[Rating.Hard].card.due,
    good: log[Rating.Good].card.due,
    easy: log[Rating.Easy].card.due,
  };
}
