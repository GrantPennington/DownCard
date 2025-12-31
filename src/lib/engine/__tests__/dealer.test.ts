import { describe, test, expect } from '@jest/globals';
import { shouldDealerHit, playDealerHand } from '../dealer';
import { Card, DEFAULT_RULES } from '@/lib/types';

describe('Dealer logic', () => {
  describe('shouldDealerHit - S17 rules', () => {
    const s17Rules = { ...DEFAULT_RULES, dealerHitsSoft17: false };

    test('hits on 16', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, s17Rules)).toBe(true);
    });

    test('stands on hard 17', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, s17Rules)).toBe(false);
    });

    test('stands on soft 17 (S17 rule)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, s17Rules)).toBe(false);
    });

    test('stands on 18', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '8', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, s17Rules)).toBe(false);
    });

    test('stands on 21', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: 'K', suit: 'D' },
        { rank: 'A', suit: 'C' },
      ];
      expect(shouldDealerHit(cards, s17Rules)).toBe(false);
    });
  });

  describe('shouldDealerHit - H17 rules', () => {
    const h17Rules = { ...DEFAULT_RULES, dealerHitsSoft17: true };

    test('hits on soft 17 (H17 rule)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, h17Rules)).toBe(true);
    });

    test('stands on hard 17', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, h17Rules)).toBe(false);
    });

    test('stands on soft 18', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];
      expect(shouldDealerHit(cards, h17Rules)).toBe(false);
    });
  });

  describe('playDealerHand', () => {
    test('dealer hits until 17 or higher', () => {
      const s17Rules = { ...DEFAULT_RULES, dealerHitsSoft17: false };
      const initialCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];

      let cardIndex = 0;
      const mockCards: Card[] = [{ rank: '5', suit: 'C' }];

      const drawCard = () => mockCards[cardIndex++];
      const finalCards = playDealerHand(initialCards, s17Rules, drawCard);

      expect(finalCards.length).toBe(3);
      expect(finalCards).toEqual([
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
        { rank: '5', suit: 'C' },
      ]);
    });

    test('dealer stands on initial 17', () => {
      const s17Rules = { ...DEFAULT_RULES, dealerHitsSoft17: false };
      const initialCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '7', suit: 'D' },
      ];

      const drawCard = () => {
        throw new Error('Should not draw');
      };
      const finalCards = playDealerHand(initialCards, s17Rules, drawCard);

      expect(finalCards.length).toBe(2);
      expect(finalCards).toEqual(initialCards);
    });

    test('dealer stands on soft 17 with S17 rules', () => {
      const s17Rules = { ...DEFAULT_RULES, dealerHitsSoft17: false };
      const initialCards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];

      const drawCard = () => {
        throw new Error('Should not draw');
      };
      const finalCards = playDealerHand(initialCards, s17Rules, drawCard);

      expect(finalCards.length).toBe(2);
      expect(finalCards).toEqual(initialCards);
    });
  });
});
