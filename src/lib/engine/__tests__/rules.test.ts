import { describe, test, expect } from '@jest/globals';
import { getLegalActions } from '../rules';
import { Card, DEFAULT_RULES, PlayerHand, DealerHand } from '@/lib/types';

describe('Legal actions', () => {
  const createHand = (cards: Card[], betCents = 100): PlayerHand => ({
    cards,
    total: 0,
    soft: false,
    betCents,
    status: 'ACTIVE',
  });

  const createDealer = (cards: Card[]): DealerHand => ({
    cards,
    total: null,
    holeRevealed: false,
  });

  describe('Basic actions', () => {
    test('allows HIT and STAND on normal hand', () => {
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, false, 1, 1000);
      expect(actions).toContain('HIT');
      expect(actions).toContain('STAND');
      expect(actions).not.toContain('DOUBLE');
      expect(actions).not.toContain('SPLIT');
    });

    test('no actions for non-active hand', () => {
      const hand: PlayerHand = {
        ...createHand([
          { rank: '10', suit: 'H' },
          { rank: '6', suit: 'D' },
        ]),
        status: 'STAND',
      };
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, false, 1, 1000);
      expect(actions).toHaveLength(0);
    });
  });

  describe('Double action', () => {
    test('allows DOUBLE on first two cards', () => {
      const hand = createHand([
        { rank: '5', suit: 'H' },
        { rank: '6', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 1000);
      expect(actions).toContain('DOUBLE');
    });

    test('disallows DOUBLE after first action', () => {
      const hand = createHand([
        { rank: '5', suit: 'H' },
        { rank: '6', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, false, 1, 1000);
      expect(actions).not.toContain('DOUBLE');
    });

    test('disallows DOUBLE with insufficient bankroll', () => {
      const hand = createHand([
        { rank: '5', suit: 'H' },
        { rank: '6', suit: 'D' },
      ], 100);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 50);
      expect(actions).not.toContain('DOUBLE');
    });

    test('respects canDoubleOn: "9-11" rule', () => {
      const rules = { ...DEFAULT_RULES, canDoubleOn: '9-11' as const };

      // Total of 8 - should not allow double
      const hand8 = createHand([
        { rank: '5', suit: 'H' },
        { rank: '3', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions8 = getLegalActions(hand8, dealer, rules, true, 1, 1000);
      expect(actions8).not.toContain('DOUBLE');

      // Total of 10 - should allow double
      const hand10 = createHand([
        { rank: '5', suit: 'H' },
        { rank: '5', suit: 'D' },
      ]);

      const actions10 = getLegalActions(hand10, dealer, rules, true, 1, 1000);
      expect(actions10).toContain('DOUBLE');
    });
  });

  describe('Split action', () => {
    test('allows SPLIT on matching cards', () => {
      const hand = createHand([
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 1000);
      expect(actions).toContain('SPLIT');
    });

    test('allows SPLIT on 10-value cards', () => {
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: 'K', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 1000);
      expect(actions).toContain('SPLIT');
    });

    test('disallows SPLIT on non-matching cards', () => {
      const hand = createHand([
        { rank: '9', suit: 'H' },
        { rank: '10', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 1000);
      expect(actions).not.toContain('SPLIT');
    });

    test('disallows SPLIT with insufficient bankroll', () => {
      const hand = createHand([
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
      ], 100);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 1, 50);
      expect(actions).not.toContain('SPLIT');
    });

    test('disallows resplit when canResplit is false', () => {
      const hand = createHand([
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      // Already have 2 hands (from a previous split)
      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, true, 2, 1000);
      expect(actions).not.toContain('SPLIT');
    });

    test('disallows SPLIT when canSplit is false', () => {
      const rules = { ...DEFAULT_RULES, canSplit: false };
      const hand = createHand([
        { rank: '8', suit: 'H' },
        { rank: '8', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, rules, true, 1, 1000);
      expect(actions).not.toContain('SPLIT');
    });
  });

  describe('Split aces', () => {
    test('no actions for split aces hand', () => {
      const hand: PlayerHand = {
        ...createHand([
          { rank: 'A', suit: 'H' },
          { rank: '10', suit: 'D' },
        ]),
        isSplitAces: true,
      };
      const dealer = createDealer([{ rank: '7', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, DEFAULT_RULES, false, 2, 1000);
      expect(actions).toHaveLength(0);
    });
  });

  describe('Insurance and Surrender', () => {
    test('allows INSURANCE when dealer shows ace (if enabled)', () => {
      const rules = { ...DEFAULT_RULES, insuranceAllowed: true };
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: 'A', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, rules, true, 1, 1000);
      expect(actions).toContain('INSURANCE');
    });

    test('disallows INSURANCE when dealer does not show ace', () => {
      const rules = { ...DEFAULT_RULES, insuranceAllowed: true };
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: '9', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: '10', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, rules, true, 1, 1000);
      expect(actions).not.toContain('INSURANCE');
    });

    test('allows SURRENDER on first two cards (if enabled)', () => {
      const rules = { ...DEFAULT_RULES, surrenderAllowed: true };
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: 'A', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, rules, true, 1, 1000);
      expect(actions).toContain('SURRENDER');
    });

    test('disallows SURRENDER after first action', () => {
      const rules = { ...DEFAULT_RULES, surrenderAllowed: true };
      const hand = createHand([
        { rank: '10', suit: 'H' },
        { rank: '6', suit: 'D' },
      ]);
      const dealer = createDealer([{ rank: 'A', suit: 'C' }]);

      const actions = getLegalActions(hand, dealer, rules, false, 1, 1000);
      expect(actions).not.toContain('SURRENDER');
    });
  });
});
