import { Card } from './card';

export type Phase = 'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'SETTLEMENT' | 'ROUND_OVER';
export type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'INSURANCE' | 'SURRENDER';
export type HandStatus = 'ACTIVE' | 'STAND' | 'BUST' | 'BLACKJACK' | 'DONE';
export type HandResult = 'WIN' | 'LOSS' | 'PUSH' | 'BJ' | 'SURRENDER';

export type PlayerHand = {
  cards: Card[];
  total: number;
  soft: boolean;
  betCents: number;
  status: HandStatus;
  isSplitAces?: boolean;
};

export type DealerHand = {
  cards: Card[];
  total: number | null;
  holeRevealed: boolean;
};

export type OutcomeResult = {
  handIndex: number;
  result: HandResult;
  netPayoutCents: number;
};

export type Outcome = {
  results: OutcomeResult[];
  netCents: number;
  message: string;
};

export type RoundState = {
  phase: Phase;
  bankrollCents: number;
  baseBetCents: number;

  dealer: DealerHand;
  playerHands: PlayerHand[];

  activeHandIndex: number;
  legalActions: Action[];

  outcome?: Outcome;
};
