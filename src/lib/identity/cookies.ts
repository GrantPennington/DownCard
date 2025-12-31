import { createHmac, timingSafeEqual } from 'crypto';

const PLAYER_TOKEN_SECRET = process.env.PLAYER_TOKEN_SECRET || '';
const GAME_SESSION_SECRET = process.env.GAME_SESSION_SECRET || '';

if (!PLAYER_TOKEN_SECRET || PLAYER_TOKEN_SECRET.length < 32) {
  console.warn('PLAYER_TOKEN_SECRET is not set or too short. Use a secure secret in production.');
}

if (!GAME_SESSION_SECRET || GAME_SESSION_SECRET.length < 32) {
  console.warn('GAME_SESSION_SECRET is not set or too short. Use a secure secret in production.');
}

export type PlayerTokenPayload = {
  playerId: string;
  v: number; // version
  issuedAt: number; // timestamp
};

/**
 * Sign a payload using HMAC-SHA256
 */
function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/**
 * Verify a signature using constant-time comparison
 */
function verify(data: string, signature: string, secret: string): boolean {
  const expected = sign(data, secret);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Create a signed player token
 */
export function createPlayerToken(payload: PlayerTokenPayload): string {
  const data = JSON.stringify(payload);
  const signature = sign(data, PLAYER_TOKEN_SECRET);
  return `${Buffer.from(data).toString('base64url')}.${signature}`;
}

/**
 * Verify and decode a player token
 * Returns null if invalid
 */
export function verifyPlayerToken(token: string): PlayerTokenPayload | null {
  try {
    const [dataB64, signature] = token.split('.');
    if (!dataB64 || !signature) {
      return null;
    }

    const data = Buffer.from(dataB64, 'base64url').toString('utf8');

    if (!verify(data, signature, PLAYER_TOKEN_SECRET)) {
      return null;
    }

    const payload = JSON.parse(data) as PlayerTokenPayload;

    // Basic validation
    if (!payload.playerId || typeof payload.v !== 'number' || typeof payload.issuedAt !== 'number') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a signed game session ID
 */
export function createGameSessionToken(sessionId: string): string {
  const data = JSON.stringify({ sessionId, issuedAt: Date.now() });
  const signature = sign(data, GAME_SESSION_SECRET);
  return `${Buffer.from(data).toString('base64url')}.${signature}`;
}

/**
 * Verify and decode a game session token
 * Returns sessionId or null if invalid
 */
export function verifyGameSessionToken(token: string): string | null {
  try {
    const [dataB64, signature] = token.split('.');
    if (!dataB64 || !signature) {
      return null;
    }

    const data = Buffer.from(dataB64, 'base64url').toString('utf8');

    if (!verify(data, signature, GAME_SESSION_SECRET)) {
      return null;
    }

    const payload = JSON.parse(data) as { sessionId: string; issuedAt: number };

    if (!payload.sessionId) {
      return null;
    }

    return payload.sessionId;
  } catch {
    return null;
  }
}
