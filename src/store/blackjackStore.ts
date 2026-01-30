import { create } from 'zustand';
import { RoundState, Action, Rules } from '@/lib/types';
import { postIdentity, postDeal, postAction, getRoundState, postReset } from '@/lib/api/blackjack';

export type UIPrefs = {
  soundEnabled: boolean;
  animationsEnabled: boolean;
};

export type BlackjackState = {
  // Identity
  playerId: string | null;
  bankrollCents: number;
  rules: Rules | null;
  uiPrefs: UIPrefs | null;

  // Round
  roundState: RoundState | null;
  lastBetCents: number;

  // Bet building
  currentBetCents: number;

  // Loading states
  identityLoading: boolean;
  roundLoading: boolean;
  actionLoading: boolean;

  // Error/Toast
  error: string | null;
  toast: string | null;

  // Actions
  init: () => Promise<void>;
  deal: (betCents: number) => Promise<void>;
  action: (action: Action, handIndex?: number) => Promise<void>;
  rebet: () => Promise<void>;
  clearBet: () => void;
  addChip: (amount: number) => void;
  setBet: (amount: number) => void;
  clearError: () => void;
  clearToast: () => void;
  resetGame: () => Promise<void>;
};

const MIN_BET = 100;
const MAX_BET = 10000;

export const useBlackjackStore = create<BlackjackState>((set, get) => ({
  // Initial state
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

  // Initialize: load identity and current round state
  init: async () => {
    set({ identityLoading: true, error: null });
    try {
      // Load identity
      const identity = await postIdentity();
      set({
        playerId: identity.playerId,
        bankrollCents: identity.bankrollCents,
        rules: identity.rules,
        uiPrefs: identity.uiPrefs,
      });

      // Try to load existing round state
      try {
        const { roundState, bankrollCents } = await getRoundState();
        set({ roundState, bankrollCents });
      } catch {
        // No active round, that's fine
      }

      set({ identityLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize',
        identityLoading: false,
      });
    }
  },

  // Deal a new round
  deal: async (betCents: number) => {
    const { bankrollCents } = get();

    // Validate bet
    if (betCents < MIN_BET || betCents > MAX_BET) {
      set({ error: `Bet must be between $${MIN_BET / 100} and $${MAX_BET / 100}` });
      return;
    }

    if (betCents > bankrollCents) {
      set({ error: 'Insufficient bankroll' });
      return;
    }

    set({ roundLoading: true, error: null, toast: null });
    try {
      const roundState = await postDeal(betCents);
      set({
        roundState,
        bankrollCents: roundState.bankrollCents,
        lastBetCents: betCents,
        currentBetCents: 0, // Clear bet input after dealing
        roundLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to deal',
        roundLoading: false,
      });
    }
  },

  // Perform an action
  action: async (action: Action, handIndex: number = 0) => {
    const { roundState } = get();

    if (!roundState) {
      set({ error: 'No active round' });
      return;
    }

    // Check if action is legal
    if (!roundState.legalActions.includes(action)) {
      set({ error: `Action ${action} is not legal` });
      return;
    }

    set({ actionLoading: true, error: null });
    try {
      const newRoundState = await postAction(action, handIndex);
      set({
        roundState: newRoundState,
        bankrollCents: newRoundState.bankrollCents,
        actionLoading: false,
      });

      // Show toast for settlement
      if (newRoundState.phase === 'SETTLEMENT' && newRoundState.outcome) {
        set({ toast: newRoundState.outcome.message });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to perform action',
        actionLoading: false,
      });
    }
  },

  // Rebet: deal with the last bet amount
  rebet: async () => {
    const { lastBetCents } = get();
    if (lastBetCents > 0) {
      await get().deal(lastBetCents);
    }
  },

  // Clear the current bet
  clearBet: () => {
    set({ currentBetCents: 0 });
  },

  // Add a chip to the current bet
  addChip: (amount: number) => {
    const { currentBetCents, bankrollCents } = get();
    const newBet = currentBetCents + amount;

    if (newBet > MAX_BET) {
      set({ error: `Maximum bet is $${MAX_BET / 100}` });
      return;
    }

    if (newBet > bankrollCents) {
      set({ error: 'Insufficient bankroll' });
      return;
    }

    set({ currentBetCents: newBet, error: null });
  },

  // Set bet to a specific amount
  setBet: (amount: number) => {
    const { bankrollCents } = get();

    if (amount > MAX_BET) {
      set({ error: `Maximum bet is $${MAX_BET / 100}` });
      return;
    }

    if (amount > bankrollCents) {
      set({ error: 'Insufficient bankroll' });
      return;
    }

    set({ currentBetCents: amount, error: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear toast
  clearToast: () => {
    set({ toast: null });
  },

  // Reset game to fresh state
  resetGame: async () => {
    set({ roundLoading: true, error: null });
    try {
      const data = await postReset();
      set({
        bankrollCents: data.bankrollCents,
        rules: data.rules,
        roundState: null,
        currentBetCents: 0,
        lastBetCents: 0,
        roundLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset game',
        roundLoading: false,
      });
    }
  },
}));
