import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { createPlayerToken, verifyPlayerToken } from './cookies';

export const PLAYER_TOKEN_COOKIE = 'player_token';
export const PLAYER_TOKEN_VERSION = 1;

/**
 * Get or create a player ID from the request cookies
 * This function creates an anonymous player identity if one doesn't exist
 */
export async function getOrCreatePlayerId(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(PLAYER_TOKEN_COOKIE)?.value;

  // Try to verify existing token
  if (existingToken) {
    const payload = verifyPlayerToken(existingToken);
    if (payload && payload.v === PLAYER_TOKEN_VERSION) {
      return payload.playerId;
    }
  }

  // Create new player ID
  const playerId = randomUUID();
  const token = createPlayerToken({
    playerId,
    v: PLAYER_TOKEN_VERSION,
    issuedAt: Date.now(),
  });

  // Set httpOnly cookie
  cookieStore.set(PLAYER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return playerId;
}

/**
 * Get the current player ID without creating a new one
 * Returns null if no valid token exists
 */
export async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(PLAYER_TOKEN_COOKIE)?.value;

  if (!existingToken) {
    return null;
  }

  const payload = verifyPlayerToken(existingToken);
  if (payload && payload.v === PLAYER_TOKEN_VERSION) {
    return payload.playerId;
  }

  return null;
}
