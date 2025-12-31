import { Card } from '@/lib/types';

/**
 * Get the numeric value of a card (without considering aces as 1 or 11 yet)
 */
function getCardValue(rank: Card['rank']): number {
  if (rank === 'A') return 11; // We'll adjust aces later
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

/**
 * Calculate hand total and determine if it's soft (has an ace counted as 11)
 */
export function calculateHandTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;

  // First pass: sum all cards (aces count as 11)
  for (const card of cards) {
    total += getCardValue(card.rank);
    if (card.rank === 'A') {
      aces++;
    }
  }

  // Second pass: convert aces from 11 to 1 if busting
  while (total > 21 && aces > 0) {
    total -= 10; // Convert one ace from 11 to 1
    aces--;
  }

  // Soft hand: has at least one ace counted as 11
  const soft = aces > 0;

  return { total, soft };
}

/**
 * Check if a hand is a blackjack (21 with exactly 2 cards: an ace and a 10-value card)
 */
export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) {
    return false;
  }

  const hasAce = cards.some((c) => c.rank === 'A');
  const hasTen = cards.some((c) => ['10', 'J', 'Q', 'K'].includes(c.rank));

  return hasAce && hasTen;
}

/**
 * Check if a hand is bust (total > 21)
 */
export function isBust(cards: Card[]): boolean {
  const { total } = calculateHandTotal(cards);
  return total > 21;
}

/**
 * Check if two cards can be split (same rank)
 */
export function canSplitCards(cards: Card[]): boolean {
  if (cards.length !== 2) {
    return false;
  }

  // For splitting purposes, all 10-value cards are considered the same
  const getValue = (card: Card): string => {
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return '10';
    return card.rank;
  };

  return getValue(cards[0]) === getValue(cards[1]);
}

/**
 * Get the total of a hand (convenience function)
 */
export function getHandTotal(cards: Card[]): number {
  return calculateHandTotal(cards).total;
}

/**
 * Check if a hand is soft (convenience function)
 */
export function isHandSoft(cards: Card[]): boolean {
  return calculateHandTotal(cards).soft;
}
