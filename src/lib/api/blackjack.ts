import { RoundState, Action, Rules } from '@/lib/types';

export type IdentityResponse = {
  playerId: string;
  bankrollCents: number;
  rules: Rules;
  uiPrefs: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
};

export type RoundStateResponse = {
  roundState: RoundState | null;
  bankrollCents: number;
};

/**
 * POST /api/identity
 * Create or load anonymous player identity
 */
export async function postIdentity(): Promise<IdentityResponse> {
  const response = await fetch('/api/identity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load identity' }));
    throw new Error(error.error || 'Failed to load identity');
  }

  return response.json();
}

/**
 * POST /api/round/deal
 * Start a new round with the specified bet
 */
export async function postDeal(betCents: number): Promise<RoundState> {
  const response = await fetch('/api/round/deal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ betCents }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to deal' }));
    throw new Error(error.error || 'Failed to deal');
  }

  return response.json();
}

/**
 * POST /api/round/action
 * Apply a player action to the current round
 */
export async function postAction(action: Action, handIndex: number = 0): Promise<RoundState> {
  const response = await fetch('/api/round/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, handIndex }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to perform action' }));
    throw new Error(error.error || 'Failed to perform action');
  }

  return response.json();
}

/**
 * GET /api/round/state
 * Get current round state (for refresh recovery)
 */
export async function getRoundState(): Promise<RoundStateResponse> {
  const response = await fetch('/api/round/state', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get round state' }));
    throw new Error(error.error || 'Failed to get round state');
  }

  return response.json();
}

export type ResetResponse = {
  bankrollCents: number;
  rules: Rules;
};

/**
 * POST /api/game/reset
 * Reset game session to fresh state
 */
export async function postReset(): Promise<ResetResponse> {
  const response = await fetch('/api/game/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to reset game' }));
    throw new Error(error.error || 'Failed to reset game');
  }

  return response.json();
}
