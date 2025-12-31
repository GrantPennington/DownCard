import { describe, test, expect } from '@jest/globals';
import {
  createShoe,
  shuffleShoe,
  drawCard,
  drawCards,
  shouldReshuffle,
  getRemainingCards,
} from '../shoe';

describe('Shoe management', () => {
  describe('createShoe', () => {
    test('creates a shoe with correct number of cards for 1 deck', () => {
      const shoe = createShoe(1);
      expect(shoe.cards.length).toBe(52);
      expect(shoe.totalCards).toBe(52);
      expect(shoe.dealtCount).toBe(0);
    });

    test('creates a shoe with correct number of cards for 6 decks', () => {
      const shoe = createShoe(6);
      expect(shoe.cards.length).toBe(312);
      expect(shoe.totalCards).toBe(312);
      expect(shoe.dealtCount).toBe(0);
    });

    test('creates all rank-suit combinations', () => {
      const shoe = createShoe(1);
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const suits = ['S', 'H', 'D', 'C'];

      for (const rank of ranks) {
        for (const suit of suits) {
          const card = shoe.cards.find((c) => c.rank === rank && c.suit === suit);
          expect(card).toBeDefined();
        }
      }
    });
  });

  describe('shuffleShoe', () => {
    test('maintains the same number of cards', () => {
      const shoe = createShoe(6);
      const shuffled = shuffleShoe(shoe);
      expect(shuffled.cards.length).toBe(shoe.cards.length);
      expect(shuffled.totalCards).toBe(shoe.totalCards);
    });

    test('resets dealt count', () => {
      const shoe = createShoe(6);
      const { shoe: afterDraw } = drawCard(shoe);
      expect(afterDraw.dealtCount).toBe(1);

      const shuffled = shuffleShoe(afterDraw);
      expect(shuffled.dealtCount).toBe(0);
    });

    test('shuffles cards (very likely to change order)', () => {
      const shoe = createShoe(6);
      const shuffled = shuffleShoe(shoe);

      // Check that at least some cards are in different positions
      let differences = 0;
      for (let i = 0; i < 10; i++) {
        if (
          shoe.cards[i].rank !== shuffled.cards[i].rank ||
          shoe.cards[i].suit !== shuffled.cards[i].suit
        ) {
          differences++;
        }
      }
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('drawCard', () => {
    test('draws the next card in sequence', () => {
      const shoe = createShoe(1);
      const firstCard = shoe.cards[0];

      const { card, shoe: newShoe } = drawCard(shoe);
      expect(card).toEqual(firstCard);
      expect(newShoe.dealtCount).toBe(1);
    });

    test('increments dealt count correctly', () => {
      const shoe = createShoe(1);
      let currentShoe = shoe;

      for (let i = 1; i <= 5; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
        expect(currentShoe.dealtCount).toBe(i);
      }
    });

    test('throws error when shoe is empty', () => {
      const shoe = createShoe(1);
      let currentShoe = shoe;

      // Draw all cards
      for (let i = 0; i < 52; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
      }

      // Try to draw one more
      expect(() => drawCard(currentShoe)).toThrow('Shoe is empty');
    });
  });

  describe('drawCards', () => {
    test('draws multiple cards correctly', () => {
      const shoe = createShoe(1);
      const { cards, shoe: newShoe } = drawCards(shoe, 5);

      expect(cards.length).toBe(5);
      expect(newShoe.dealtCount).toBe(5);
    });

    test('draws cards in sequence', () => {
      const shoe = createShoe(1);
      const expectedCards = shoe.cards.slice(0, 3);

      const { cards } = drawCards(shoe, 3);
      expect(cards).toEqual(expectedCards);
    });
  });

  describe('shouldReshuffle', () => {
    test('returns true when below threshold', () => {
      const shoe = createShoe(1);
      // Draw 40 cards from 52-card deck (77% dealt, 23% remaining)
      let currentShoe = shoe;
      for (let i = 0; i < 40; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
      }

      // Should reshuffle at 25% threshold
      expect(shouldReshuffle(currentShoe, 0.25)).toBe(true);
    });

    test('returns false when above threshold', () => {
      const shoe = createShoe(1);
      // Draw 10 cards from 52-card deck (19% dealt, 81% remaining)
      let currentShoe = shoe;
      for (let i = 0; i < 10; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
      }

      // Should not reshuffle at 25% threshold
      expect(shouldReshuffle(currentShoe, 0.25)).toBe(false);
    });

    test('handles edge case at exact threshold', () => {
      const shoe = createShoe(1);
      // Draw 39 cards from 52-card deck (exactly 25% remaining)
      let currentShoe = shoe;
      for (let i = 0; i < 39; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
      }

      expect(shouldReshuffle(currentShoe, 0.25)).toBe(true);
    });
  });

  describe('getRemainingCards', () => {
    test('returns correct count at start', () => {
      const shoe = createShoe(6);
      expect(getRemainingCards(shoe)).toBe(312);
    });

    test('returns correct count after drawing', () => {
      const shoe = createShoe(6);
      const { shoe: newShoe } = drawCards(shoe, 50);
      expect(getRemainingCards(newShoe)).toBe(262);
    });

    test('returns zero when all cards dealt', () => {
      const shoe = createShoe(1);
      let currentShoe = shoe;
      for (let i = 0; i < 52; i++) {
        const result = drawCard(currentShoe);
        currentShoe = result.shoe;
      }
      expect(getRemainingCards(currentShoe)).toBe(0);
    });
  });
});
