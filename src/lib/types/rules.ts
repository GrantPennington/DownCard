export type Rules = {
  numDecks: number;
  dealerHitsSoft17: boolean; // false = S17, true = H17
  blackjackPayout: number; // 1.5 for 3:2, 1.2 for 6:5
  canDoubleOn: 'any' | '9-11' | '10-11';
  canSplit: boolean;
  canResplit: boolean;
  splitAcesReceiveOneCard: boolean;
  insuranceAllowed: boolean;
  surrenderAllowed: boolean;
  reshuffleThreshold: number; // e.g., 0.25 means reshuffle when 25% cards left
};

export const DEFAULT_RULES: Rules = {
  numDecks: 6,
  dealerHitsSoft17: false, // S17
  blackjackPayout: 1.5, // 3:2
  canDoubleOn: 'any',
  canSplit: true,
  canResplit: false, // split once only
  splitAcesReceiveOneCard: true,
  insuranceAllowed: false, // OFF in MVP
  surrenderAllowed: false, // OFF in MVP
  reshuffleThreshold: 0.25,
};
