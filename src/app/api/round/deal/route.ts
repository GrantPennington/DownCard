import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreatePlayerId } from '@/lib/identity';
import { getOrCreateGameSession } from '@/lib/game';
import { deal } from '@/lib/game/roundController';

const DealRequestSchema = z.object({
  betCents: z.number().int().min(100).max(10000),
});

/**
 * POST /api/round/deal
 * Start a new round with the specified bet
 * Returns RoundState
 */
export async function POST(request: NextRequest) {
  try {
    // Get or create player ID
    const playerId = await getOrCreatePlayerId();

    // Get or create game session
    const session = await getOrCreateGameSession(playerId);

    // Parse and validate request body
    const body = await request.json();
    const parsed = DealRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { betCents } = parsed.data;

    // Validate bet against bankroll
    if (betCents > session.bankrollCents) {
      return NextResponse.json(
        { error: 'Insufficient bankroll' },
        { status: 400 }
      );
    }

    // Deal the round
    const roundState = await deal(session, betCents);

    return NextResponse.json(roundState);
  } catch (error) {
    console.error('Error in /api/round/deal:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to deal round' },
      { status: 500 }
    );
  }
}
