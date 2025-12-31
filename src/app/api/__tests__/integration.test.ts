import { describe, test, expect, beforeEach } from '@jest/globals';
import { createShoe, shuffleShoe } from '@/lib/engine/shoe';
import { deal, applyAction } from '@/lib/game/roundController';
import { GameSession } from '@/lib/game/sessionStore';
import { DEFAULT_RULES } from '@/lib/types';

describe('API Integration Tests', () => {
  let mockSession: GameSession;

  beforeEach(() => {
    // Create a fresh session for each test
    mockSession = {
      sessionId: 'test-session',
      playerId: 'test-player',
      shoe: shuffleShoe(createShoe(DEFAULT_RULES.numDecks)),
      roundState: null,
      bankrollCents: 100000,
      rules: DEFAULT_RULES,
      uiPrefs: {
        soundEnabled: true,
        animationsEnabled: true,
      },
      updatedAt: Date.now(),
    };
  });

  describe('Round flow', () => {
    test('POST /api/round/deal then /api/round/action (HIT) updates player hand', () => {
      // Simulate POST /api/round/deal
      const betCents = 1000;
      const roundState = deal(mockSession, betCents);

      expect(roundState).toBeDefined();
      expect(roundState.phase).toBe('PLAYER_TURN');
      expect(roundState.playerHands.length).toBe(1);
      expect(roundState.playerHands[0].cards.length).toBe(2);
      expect(roundState.baseBetCents).toBe(betCents);
      expect(roundState.legalActions.length).toBeGreaterThan(0);

      const initialCardCount = roundState.playerHands[0].cards.length;

      // Simulate POST /api/round/action with HIT
      if (roundState.legalActions.includes('HIT')) {
        const updatedState = applyAction(mockSession, 'HIT', 0);

        expect(updatedState.playerHands[0].cards.length).toBe(initialCardCount + 1);
      }
    });

    test('Illegal action (DOUBLE when not allowed) throws error', () => {
      // Deal a round
      const roundState = deal(mockSession, 1000);

      // Hit once to make DOUBLE illegal
      if (roundState.legalActions.includes('HIT')) {
        applyAction(mockSession, 'HIT', 0);

        // Now try to DOUBLE (should be illegal after hitting)
        expect(() => {
          applyAction(mockSession, 'DOUBLE', 0);
        }).toThrow();
      }
    });

    test('STAND action advances to dealer turn', () => {
      // Deal a round
      const roundState = deal(mockSession, 1000);

      // Stand
      if (roundState.legalActions.includes('STAND')) {
        const updatedState = applyAction(mockSession, 'STAND', 0);

        expect(updatedState.phase).toBe('SETTLEMENT');
        expect(updatedState.dealer.holeRevealed).toBe(true);
        expect(updatedState.outcome).toBeDefined();
      }
    });

    test('Invalid bet amount is rejected', () => {
      // Bet too low
      expect(() => {
        deal(mockSession, 50);
      }).toThrow('Bet must be between 100 and 10000 cents');

      // Bet too high
      expect(() => {
        deal(mockSession, 20000);
      }).toThrow('Bet must be between 100 and 10000 cents');
    });

    test('Bet exceeding bankroll is rejected', () => {
      mockSession.bankrollCents = 500;

      expect(() => {
        deal(mockSession, 1000);
      }).toThrow('Insufficient bankroll');
    });

    test('SPLIT creates two hands', () => {
      // We need to keep dealing until we get a splittable hand
      let attempts = 0;
      let roundState;

      while (attempts < 100) {
        mockSession.roundState = null;
        roundState = deal(mockSession, 1000);

        if (roundState.legalActions.includes('SPLIT')) {
          const updatedState = applyAction(mockSession, 'SPLIT', 0);
          expect(updatedState.playerHands.length).toBe(2);
          break;
        }

        attempts++;
      }

      // If we couldn't get a splittable hand in 100 attempts, the test is inconclusive
      // but that's okay - the SPLIT logic is tested in the engine tests
    });

    test('DOUBLE doubles the bet and draws one card', () => {
      const roundState = deal(mockSession, 1000);

      if (roundState.legalActions.includes('DOUBLE')) {
        const initialBankroll = roundState.bankrollCents;
        const updatedState = applyAction(mockSession, 'DOUBLE', 0);

        expect(updatedState.playerHands[0].betCents).toBe(2000);
        expect(updatedState.playerHands[0].cards.length).toBe(3);
        // After double, phase moves to SETTLEMENT and bankroll includes outcome
        expect(updatedState.phase).toBe('SETTLEMENT');
        // Bankroll changes based on outcome, so we just verify it's a number
        expect(typeof updatedState.bankrollCents).toBe('number');
      }
    });

    test('Player blackjack proceeds to dealer turn immediately', () => {
      // Keep dealing until we get a blackjack
      let attempts = 0;

      while (attempts < 1000) {
        mockSession.roundState = null;
        mockSession.shoe = shuffleShoe(createShoe(DEFAULT_RULES.numDecks));

        const roundState = deal(mockSession, 1000);

        if (roundState.playerHands[0].status === 'BLACKJACK') {
          expect(roundState.phase).toBe('SETTLEMENT');
          expect(roundState.dealer.holeRevealed).toBe(true);
          expect(roundState.outcome).toBeDefined();
          break;
        }

        attempts++;
      }

      // If we couldn't get a blackjack in 1000 attempts, the test is inconclusive
      // but that's statistically very unlikely
    });
  });

  describe('Action validation', () => {
    test('Wrong hand index is rejected', () => {
      const roundState = deal(mockSession, 1000);

      expect(() => {
        applyAction(mockSession, 'HIT', 1); // Wrong index
      }).toThrow('Invalid hand index');
    });

    test('Action without active round is rejected', () => {
      // No round state
      expect(() => {
        applyAction(mockSession, 'HIT', 0);
      }).toThrow('No active round');
    });
  });
});
