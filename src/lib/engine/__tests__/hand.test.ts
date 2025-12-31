import { describe, test, expect } from '@jest/globals';
import { calculateHandTotal, isBlackjack, isBust, canSplitCards } from '../hand';
import { Card } from '@/lib/types';

describe('Hand calculations', () => {
  describe('calculateHandTotal', () => {
    test('calculates hard totals correctly', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(17);
      expect(result.soft).toBe(false);
    });

    test('calculates soft totals with one ace', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(17);
      expect(result.soft).toBe(true);
    });

    test('calculates soft totals with multiple aces', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'A', suit: 'D' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(12);
      expect(result.soft).toBe(true);
    });

    test('converts aces from 11 to 1 when busting', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '9', suit: 'D' },
        { rank: '7', suit: 'C' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(17);
      expect(result.soft).toBe(false);
    });

    test('handles three aces correctly', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'A', suit: 'D' },
        { rank: 'A', suit: 'C' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(13);
      expect(result.soft).toBe(true);
    });

    test('calculates face cards as 10', () => {
      const cards: Card[] = [
        { rank: 'K', suit: 'H' },
        { rank: 'Q', suit: 'D' },
      ];
      const result = calculateHandTotal(cards);
      expect(result.total).toBe(20);
      expect(result.soft).toBe(false);
    });
  });

  describe('isBlackjack', () => {
    test('detects blackjack with ace and 10', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '10', suit: 'D' },
      ];
      expect(isBlackjack(cards)).toBe(true);
    });

    test('detects blackjack with ace and face card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'K', suit: 'D' },
      ];
      expect(isBlackjack(cards)).toBe(true);
    });

    test('returns false for 21 with more than 2 cards', () => {
      const cards: Card[] = [
        { rank: '7', suit: 'H' },
        { rank: '7', suit: 'D' },
        { rank: '7', suit: 'C' },
      ];
      expect(isBlackjack(cards)).toBe(false);
    });

    test('returns false for non-blackjack two-card hand', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ];
      expect(isBlackjack(cards)).toBe(false);
    });
  });

  describe('isBust', () => {
    test('detects bust correctly', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
        { rank: '5', suit: 'C' },
      ];
      expect(isBust(cards)).toBe(true);
    });

    test('returns false for 21', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: 'J', suit: 'D' },
        { rank: 'A', suit: 'C' },
      ];
      expect(isBust(cards)).toBe(false);
    });

    test('returns false for soft hand under 21', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];
      expect(isBust(cards)).toBe(false);
    });
  });

  describe('canSplitCards', () => {
    test('allows splitting same rank cards', () => {
      const cards: Card[] = [
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
      ];
      expect(canSplitCards(cards)).toBe(true);
    });

    test('allows splitting aces', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'A', suit: 'D' },
      ];
      expect(canSplitCards(cards)).toBe(true);
    });

    test('allows splitting 10-value cards', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: 'K', suit: 'D' },
      ];
      expect(canSplitCards(cards)).toBe(true);
    });

    test('disallows splitting different ranks', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'H' },
        { rank: '10', suit: 'D' },
      ];
      expect(canSplitCards(cards)).toBe(false);
    });

    test('disallows splitting with more than 2 cards', () => {
      const cards: Card[] = [
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
        { rank: '8', suit: 'C' },
      ];
      expect(canSplitCards(cards)).toBe(false);
    });
  });
});
