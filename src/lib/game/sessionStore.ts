import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { createGameSessionToken, verifyGameSessionToken } from '@/lib/identity/cookies';
import { Shoe, createShoe, shuffleShoe } from '@/lib/engine/shoe';
import { RoundState, Rules, DEFAULT_RULES } from '@/lib/types';

export const GAME_SESSION_COOKIE = 'game_session';

const DEFAULT_BANKROLL_CENTS = parseInt(process.env.DEFAULT_BANKROLL_CENTS || '100000', 10);
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

export type UIPrefs = {
  soundEnabled: boolean;
  animationsEnabled: boolean;
};

export type GameSession = {
  sessionId: string;
  playerId: string;
  shoe: Shoe;
  roundState: RoundState | null;
  bankrollCents: number;
  rules: Rules;
  uiPrefs: UIPrefs;
  updatedAt: number;
};

// In-memory session store
const sessions = new Map<string, GameSession>();

/**
 * Clean up stale sessions (TTL-based)
 */
function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * Get or create a game session
 */
export async function getOrCreateGameSession(playerId: string): Promise<GameSession> {
  // Cleanup stale sessions periodically
  if (Math.random() < 0.1) {
    // 10% chance on each call
    cleanupStaleSessions();
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(GAME_SESSION_COOKIE)?.value;

  // Try to load existing session
  if (existingToken) {
    const sessionId = verifyGameSessionToken(existingToken);
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session && session.playerId === playerId) {
        // Update timestamp
        session.updatedAt = Date.now();
        return session;
      }
    }
  }

  // Create new session
  const sessionId = randomUUID();
  const shoe = shuffleShoe(createShoe(DEFAULT_RULES.numDecks));

  const session: GameSession = {
    sessionId,
    playerId,
    shoe,
    roundState: null,
    bankrollCents: DEFAULT_BANKROLL_CENTS,
    rules: DEFAULT_RULES,
    uiPrefs: {
      soundEnabled: true,
      animationsEnabled: true,
    },
    updatedAt: Date.now(),
  };

  sessions.set(sessionId, session);

  // Set cookie
  const token = createGameSessionToken(sessionId);
  cookieStore.set(GAME_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return session;
}

/**
 * Get an existing game session by ID
 */
export function getGameSession(sessionId: string): GameSession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Update a game session
 */
export function updateGameSession(session: GameSession): void {
  session.updatedAt = Date.now();
  sessions.set(session.sessionId, session);
}

/**
 * Delete a game session
 */
export function deleteGameSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Get session count (for debugging)
 */
export function getSessionCount(): number {
  return sessions.size;
}
