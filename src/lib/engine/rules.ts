import { Action, PlayerHand, DealerHand, Rules } from '@/lib/types';
import { canSplitCards, isBlackjack, getHandTotal } from './hand';

/**
 * Determine legal actions for a player hand
 */
export function getLegalActions(
  hand: PlayerHand,
  dealer: DealerHand,
  rules: Rules,
  isFirstAction: boolean,
  numHands: number,
  bankrollCents: number
): Action[] {
  const actions: Action[] = [];

  // If hand is already done, no actions
  if (hand.status !== 'ACTIVE') {
    return actions;
  }

  // Split aces get 1 card and stand automatically
  if (hand.isSplitAces) {
    return []; // No actions for split aces after receiving one card
  }

  const isFirstTwoCards = hand.cards.length === 2 && isFirstAction;

  // HIT is always available unless blackjack or bust
  if (hand.status === 'ACTIVE' && !isBlackjack(hand.cards)) {
    actions.push('HIT');
  }

  // STAND is always available for active hands
  if (hand.status === 'ACTIVE') {
    actions.push('STAND');
  }

  // DOUBLE: only on first two cards
  if (isFirstTwoCards && canDouble(hand, rules, bankrollCents)) {
    actions.push('DOUBLE');
  }

  // SPLIT: only on first two cards with matching ranks
  if (isFirstTwoCards && canSplit(hand, rules, numHands, bankrollCents)) {
    actions.push('SPLIT');
  }

  // SURRENDER: only on first two cards (if allowed)
  if (isFirstTwoCards && rules.surrenderAllowed) {
    actions.push('SURRENDER');
  }

  // INSURANCE: only when dealer shows ace (if allowed)
  if (
    isFirstTwoCards &&
    rules.insuranceAllowed &&
    dealer.cards.length > 0 &&
    dealer.cards[0].rank === 'A'
  ) {
    actions.push('INSURANCE');
  }

  return actions;
}

/**
 * Check if doubling is allowed
 */
function canDouble(hand: PlayerHand, rules: Rules, bankrollCents: number): boolean {
  // Must have enough bankroll to double the bet
  if (bankrollCents < hand.betCents) {
    return false;
  }

  const total = getHandTotal(hand.cards);

  switch (rules.canDoubleOn) {
    case 'any':
      return true;
    case '9-11':
      return total >= 9 && total <= 11;
    case '10-11':
      return total >= 10 && total <= 11;
    default:
      return false;
  }
}

/**
 * Check if splitting is allowed
 */
function canSplit(
  hand: PlayerHand,
  rules: Rules,
  numHands: number,
  bankrollCents: number
): boolean {
  if (!rules.canSplit) {
    return false;
  }

  // Must have enough bankroll to match the bet for the new hand
  if (bankrollCents < hand.betCents) {
    return false;
  }

  // Check if cards can be split
  if (!canSplitCards(hand.cards)) {
    return false;
  }

  // Check resplit rules
  if (numHands > 1 && !rules.canResplit) {
    return false;
  }

  return true;
}
