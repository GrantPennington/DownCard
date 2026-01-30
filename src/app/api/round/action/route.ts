import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreatePlayerId } from '@/lib/identity';
import { getOrCreateGameSession } from '@/lib/game';
import { applyAction } from '@/lib/game/roundController';

const ActionRequestSchema = z.object({
  action: z.enum(['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'INSURANCE', 'SURRENDER']),
  handIndex: z.number().int().min(0).optional().default(0),
});

/**
 * POST /api/round/action
 * Apply a player action to the current round
 * Returns updated RoundState
 */
export async function POST(request: NextRequest) {
  try {
    // Get or create player ID
    const playerId = await getOrCreatePlayerId();

    // Get or create game session
    const session = await getOrCreateGameSession(playerId);

    // Parse and validate request body
    const body = await request.json();
    const parsed = ActionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { action, handIndex } = parsed.data;

    // Check if there's an active round
    if (!session.roundState) {
      return NextResponse.json(
        { error: 'No active round' },
        { status: 400 }
      );
    }

    // Apply the action
    const roundState = await applyAction(session, action, handIndex);

    return NextResponse.json(roundState);
  } catch (error) {
    console.error('Error in /api/round/action:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to apply action' },
      { status: 500 }
    );
  }
}
