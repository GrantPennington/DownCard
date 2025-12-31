import { describe, test, expect } from '@jest/globals';
import { settleHand, settleAllHands } from '../settle';
import { Card, DEFAULT_RULES } from '@/lib/types';

describe('Settlement logic', () => {
  const rules = DEFAULT_RULES;

  describe('settleHand', () => {
    test('player blackjack wins with 3:2 payout', () => {
      const playerCards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'K', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('BJ');
      expect(result.netPayoutCents).toBe(150); // 3:2 payout
    });

    test('player blackjack vs dealer blackjack is a push', () => {
      const playerCards: Card[] = [
        { rank: 'A', suit: 'H' },
        { rank: 'K', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: 'A', suit: 'C' },
        { rank: 'Q', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('PUSH');
      expect(result.netPayoutCents).toBe(0);
    });

    test('player bust loses bet', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
        { rank: '5', suit: 'C' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'C' },
        { rank: '7', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('LOSS');
      expect(result.netPayoutCents).toBe(-100);
    });

    test('dealer bust with player not bust wins', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'C' },
        { rank: '9', suit: 'S' },
        { rank: '5', suit: 'H' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('WIN');
      expect(result.netPayoutCents).toBe(100);
    });

    test('player wins with higher total', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '10', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'C' },
        { rank: '9', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('WIN');
      expect(result.netPayoutCents).toBe(100);
    });

    test('player loses with lower total', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '8', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'C' },
        { rank: '9', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('LOSS');
      expect(result.netPayoutCents).toBe(-100);
    });

    test('same totals result in push', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: '10', suit: 'C' },
        { rank: '9', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('PUSH');
      expect(result.netPayoutCents).toBe(0);
    });

    test('dealer blackjack beats player 21 (not blackjack)', () => {
      const playerCards: Card[] = [
        { rank: '7', suit: 'H' },
        { rank: '7', suit: 'D' },
        { rank: '7', suit: 'C' },
      ];
      const dealerCards: Card[] = [
        { rank: 'A', suit: 'C' },
        { rank: 'K', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules);
      expect(result.result).toBe('LOSS');
      expect(result.netPayoutCents).toBe(-100);
    });

    test('surrender loses half the bet', () => {
      const playerCards: Card[] = [
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ];
      const dealerCards: Card[] = [
        { rank: 'A', suit: 'C' },
        { rank: 'K', suit: 'S' },
      ];

      const result = settleHand(playerCards, dealerCards, 100, rules, true);
      expect(result.result).toBe('SURRENDER');
      expect(result.netPayoutCents).toBe(-50);
    });
  });

  describe('settleAllHands - Split scenarios', () => {
    test('settles multiple hands correctly (split)', () => {
      const playerHands = [
        {
          cards: [
            { rank: '10', suit: 'H' },
            { rank: '10', suit: 'D' },
          ] as Card[],
          betCents: 100,
        },
        {
          cards: [
            { rank: '10', suit: 'C' },
            { rank: '8', suit: 'S' },
          ] as Card[],
          betCents: 100,
        },
      ];

      const dealerCards: Card[] = [
        { rank: '10', suit: 'S' },
        { rank: '9', suit: 'H' },
      ];

      const outcome = settleAllHands(playerHands, dealerCards, rules);

      expect(outcome.results.length).toBe(2);
      expect(outcome.results[0].result).toBe('WIN'); // 20 vs 19
      expect(outcome.results[0].netPayoutCents).toBe(100);
      expect(outcome.results[1].result).toBe('LOSS'); // 18 vs 19
      expect(outcome.results[1].netPayoutCents).toBe(-100);
      expect(outcome.netCents).toBe(0); // Net zero
    });

    test('calculates net payout for split with all wins', () => {
      const playerHands = [
        {
          cards: [
            { rank: '10', suit: 'H' },
            { rank: '10', suit: 'D' },
          ] as Card[],
          betCents: 100,
        },
        {
          cards: [
            { rank: '10', suit: 'C' },
            { rank: '9', suit: 'S' },
          ] as Card[],
          betCents: 100,
        },
      ];

      const dealerCards: Card[] = [
        { rank: '10', suit: 'S' },
        { rank: '8', suit: 'H' },
      ];

      const outcome = settleAllHands(playerHands, dealerCards, rules);

      expect(outcome.results.length).toBe(2);
      expect(outcome.results[0].result).toBe('WIN');
      expect(outcome.results[1].result).toBe('WIN');
      expect(outcome.netCents).toBe(200);
    });
  });

  describe('settleAllHands - Double scenarios', () => {
    test('settles doubled hand correctly on win', () => {
      const playerHands = [
        {
          cards: [
            { rank: '5', suit: 'H' },
            { rank: '6', suit: 'D' },
            { rank: '10', suit: 'C' },
          ] as Card[],
          betCents: 200, // Doubled from 100
        },
      ];

      const dealerCards: Card[] = [
        { rank: '10', suit: 'S' },
        { rank: '9', suit: 'H' },
      ];

      const outcome = settleAllHands(playerHands, dealerCards, rules);

      expect(outcome.results[0].result).toBe('WIN');
      expect(outcome.results[0].netPayoutCents).toBe(200); // Win on doubled bet
      expect(outcome.netCents).toBe(200);
    });

    test('settles doubled hand correctly on loss', () => {
      const playerHands = [
        {
          cards: [
            { rank: '5', suit: 'H' },
            { rank: '6', suit: 'D' },
            { rank: '6', suit: 'C' },
          ] as Card[],
          betCents: 200, // Doubled from 100
        },
      ];

      const dealerCards: Card[] = [
        { rank: '10', suit: 'S' },
        { rank: '10', suit: 'H' },
      ];

      const outcome = settleAllHands(playerHands, dealerCards, rules);

      expect(outcome.results[0].result).toBe('LOSS');
      expect(outcome.results[0].netPayoutCents).toBe(-200); // Loss on doubled bet
      expect(outcome.netCents).toBe(-200);
    });
  });
});
