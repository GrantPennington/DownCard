import { NextResponse } from 'next/server';
import { getOrCreatePlayerId } from '@/lib/identity';
import { getOrCreateGameSession } from '@/lib/game';

/**
 * GET /api/round/state
 * Get the current round state (for refresh recovery)
 * Returns RoundState or null if no active round
 */
export async function GET() {
  try {
    // Get or create player ID
    const playerId = await getOrCreatePlayerId();

    // Get or create game session
    const session = await getOrCreateGameSession(playerId);

    // Return current round state
    return NextResponse.json({
      roundState: session.roundState,
      bankrollCents: session.bankrollCents,
    });
  } catch (error) {
    console.error('Error in /api/round/state:', error);
    return NextResponse.json(
      { error: 'Failed to get round state' },
      { status: 500 }
    );
  }
}
