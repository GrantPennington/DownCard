import { NextResponse } from 'next/server';
import { getOrCreatePlayerId } from '@/lib/identity';
import { getOrCreateGameSession } from '@/lib/game';

/**
 * POST /api/identity
 * Creates or loads an anonymous player identity
 * Returns bankroll, rules, and UI preferences
 */
export async function POST() {
  try {
    // Get or create player ID (sets cookie)
    const playerId = await getOrCreatePlayerId();

    // Get or create game session (sets cookie)
    const session = await getOrCreateGameSession(playerId);

    return NextResponse.json({
      playerId,
      bankrollCents: session.bankrollCents,
      rules: session.rules,
      uiPrefs: session.uiPrefs,
    });
  } catch (error) {
    console.error('Error in /api/identity:', error);
    return NextResponse.json(
      { error: 'Failed to create/load identity' },
      { status: 500 }
    );
  }
}
