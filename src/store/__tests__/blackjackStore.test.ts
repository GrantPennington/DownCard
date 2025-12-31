import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { useBlackjackStore } from '../blackjackStore';
import * as api from '@/lib/api/blackjack';

// Mock the API module
jest.mock('@/lib/api/blackjack');

describe('BlackjackStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBlackjackStore.setState({
      playerId: null,
      bankrollCents: 0,
      rules: null,
      uiPrefs: null,
      roundState: null,
      lastBetCents: 0,
      currentBetCents: 0,
      identityLoading: false,
      roundLoading: false,
      actionLoading: false,
      error: null,
      toast: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('deal()', () => {
    test('sets loading flag and stores RoundState on success', async () => {
      const mockRoundState = {
        phase: 'PLAYER_TURN' as const,
        bankrollCents: 99000,
        baseBetCents: 1000,
        dealer: {
          cards: [
            { rank: 'K' as const, suit: 'H' as const },
            { rank: '7' as const, suit: 'D' as const },
          ],
          total: null,
          holeRevealed: false,
        },
        playerHands: [
          {
            cards: [
              { rank: 'A' as const, suit: 'S' as const },
              { rank: '10' as const, suit: 'D' as const },
            ],
            total: 21,
            soft: true,
            betCents: 1000,
            status: 'BLACKJACK' as const,
          },
        ],
        activeHandIndex: 0,
        legalActions: [],
      };

      (api.postDeal as jest.Mock).mockResolvedValue(mockRoundState);

      // Set initial state
      useBlackjackStore.setState({
        bankrollCents: 100000,
        currentBetCents: 1000,
      });

      const { deal } = useBlackjackStore.getState();

      // Call deal
      const dealPromise = deal(1000);

      // Check loading flag is set
      expect(useBlackjackStore.getState().roundLoading).toBe(true);

      // Wait for promise to resolve
      await dealPromise;

      // Check state after success
      const state = useBlackjackStore.getState();
      expect(state.roundLoading).toBe(false);
      expect(state.roundState).toEqual(mockRoundState);
      expect(state.bankrollCents).toBe(99000);
      expect(state.lastBetCents).toBe(1000);
      expect(state.currentBetCents).toBe(0);
      expect(state.error).toBeNull();
    });

    test('sets error and leaves RoundState unchanged on failure', async () => {
      const errorMessage = 'Insufficient bankroll';
      (api.postDeal as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Set initial state
      useBlackjackStore.setState({
        bankrollCents: 100000,
        currentBetCents: 1000,
        roundState: null,
      });

      const { deal } = useBlackjackStore.getState();

      // Call deal
      await deal(1000);

      // Check state after error
      const state = useBlackjackStore.getState();
      expect(state.roundLoading).toBe(false);
      expect(state.roundState).toBeNull();
      expect(state.error).toBe(errorMessage);
    });

    test('rejects bet below minimum', async () => {
      useBlackjackStore.setState({
        bankrollCents: 100000,
      });

      const { deal } = useBlackjackStore.getState();

      await deal(50); // Below minimum of 100

      const state = useBlackjackStore.getState();
      expect(state.error).toContain('Bet must be between');
      expect(api.postDeal).not.toHaveBeenCalled();
    });

    test('rejects bet above maximum', async () => {
      useBlackjackStore.setState({
        bankrollCents: 100000,
      });

      const { deal } = useBlackjackStore.getState();

      await deal(20000); // Above maximum of 10000

      const state = useBlackjackStore.getState();
      expect(state.error).toContain('Bet must be between');
      expect(api.postDeal).not.toHaveBeenCalled();
    });
  });

  describe('action()', () => {
    test('returns error when action is not legal', async () => {
      const mockRoundState = {
        phase: 'PLAYER_TURN' as const,
        bankrollCents: 99000,
        baseBetCents: 1000,
        dealer: {
          cards: [{ rank: 'K' as const, suit: 'H' as const }],
          total: null,
          holeRevealed: false,
        },
        playerHands: [
          {
            cards: [
              { rank: '10' as const, suit: 'H' as const },
              { rank: '8' as const, suit: 'D' as const },
            ],
            total: 18,
            soft: false,
            betCents: 1000,
            status: 'ACTIVE' as const,
          },
        ],
        activeHandIndex: 0,
        legalActions: ['HIT' as const, 'STAND' as const], // DOUBLE not legal
      };

      useBlackjackStore.setState({
        roundState: mockRoundState,
      });

      const { action } = useBlackjackStore.getState();

      await action('DOUBLE', 0);

      const state = useBlackjackStore.getState();
      expect(state.error).toContain('not legal');
      expect(state.roundState).toEqual(mockRoundState); // Unchanged
      expect(api.postAction).not.toHaveBeenCalled();
    });
  });

  describe('bet management', () => {
    test('addChip adds amount to current bet', () => {
      useBlackjackStore.setState({
        currentBetCents: 100,
        bankrollCents: 10000,
      });

      const { addChip } = useBlackjackStore.getState();
      addChip(500);

      expect(useBlackjackStore.getState().currentBetCents).toBe(600);
    });

    test('clearBet resets current bet to zero', () => {
      useBlackjackStore.setState({
        currentBetCents: 1000,
      });

      const { clearBet } = useBlackjackStore.getState();
      clearBet();

      expect(useBlackjackStore.getState().currentBetCents).toBe(0);
    });
  });
});
