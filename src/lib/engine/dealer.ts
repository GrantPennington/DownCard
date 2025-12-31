import { Card, Rules } from '@/lib/types';
import { calculateHandTotal, isBust } from './hand';

/**
 * Determine if dealer should hit based on current hand and rules
 */
export function shouldDealerHit(cards: Card[], rules: Rules): boolean {
  const { total, soft } = calculateHandTotal(cards);

  // Dealer always hits on 16 or less
  if (total < 17) {
    return true;
  }

  // Dealer always stands on hard 17 or higher
  if (total > 17) {
    return false;
  }

  // Dealer has exactly 17
  if (total === 17) {
    // If it's a soft 17 and dealer hits soft 17, then hit
    if (soft && rules.dealerHitsSoft17) {
      return true;
    }
    // Otherwise stand
    return false;
  }

  return false;
}

/**
 * Play out dealer's hand according to rules
 * Returns the final cards array
 */
export function playDealerHand(
  initialCards: Card[],
  rules: Rules,
  drawCard: () => Card
): Card[] {
  const cards = [...initialCards];

  // Keep hitting while dealer should hit and hasn't busted
  while (shouldDealerHit(cards, rules) && !isBust(cards)) {
    const newCard = drawCard();
    cards.push(newCard);
  }

  return cards;
}

/**
 * Get dealer's final total
 */
export function getDealerTotal(cards: Card[]): number {
  return calculateHandTotal(cards).total;
}
