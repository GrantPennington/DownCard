import { prisma } from './prisma';

const DEFAULT_BANKROLL_CENTS = parseInt(process.env.DEFAULT_BANKROLL_CENTS || '100000', 10);

// Check if database is available
const isDbAvailable = (): boolean => !!prisma;

export type PlayerData = {
  id: string;
  bankrollCents: number;
  handsPlayed: number;
  handsWon: number;
  totalWagered: number;
  biggestWin: number;
};

/**
 * Get or create a player by ID
 */
export async function getOrCreatePlayer(playerId: string): Promise<PlayerData> {
  if (!prisma) {
    return {
      id: playerId,
      bankrollCents: DEFAULT_BANKROLL_CENTS,
      handsPlayed: 0,
      handsWon: 0,
      totalWagered: 0,
      biggestWin: 0,
    };
  }

  const selectFields = {
    id: true,
    bankrollCents: true,
    handsPlayed: true,
    handsWon: true,
    totalWagered: true,
    biggestWin: true,
  };

  // Try to find existing player first
  const existing = await prisma.player.findUnique({
    where: { id: playerId },
    select: selectFields,
  });

  if (existing) {
    return existing;
  }

  // Try to create, handle race condition
  try {
    const player = await prisma.player.create({
      data: {
        id: playerId,
        bankrollCents: DEFAULT_BANKROLL_CENTS,
      },
      select: selectFields,
    });
    return player;
  } catch (error: unknown) {
    // Handle race condition - another request created the player
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: selectFields,
      });
      if (player) return player;
    }
    throw error;
  }
}

/**
 * Update player's bankroll
 */
export async function updatePlayerBankroll(playerId: string, bankrollCents: number): Promise<void> {
  if (!prisma) return;

  await prisma.player.update({
    where: { id: playerId },
    data: { bankrollCents },
  });
}

/**
 * Reset player to default state
 */
export async function resetPlayer(playerId: string): Promise<PlayerData> {
  if (!prisma) {
    return {
      id: playerId,
      bankrollCents: DEFAULT_BANKROLL_CENTS,
      handsPlayed: 0,
      handsWon: 0,
      totalWagered: 0,
      biggestWin: 0,
    };
  }

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      bankrollCents: DEFAULT_BANKROLL_CENTS,
    },
    select: {
      id: true,
      bankrollCents: true,
      handsPlayed: true,
      handsWon: true,
      totalWagered: true,
      biggestWin: true,
    },
  });

  return player;
}

/**
 * Update player stats after a hand
 */
export async function updatePlayerStats(
  playerId: string,
  betCents: number,
  netResultCents: number,
  isWin: boolean
): Promise<void> {
  if (!prisma) return;

  // Update basic stats
  await prisma.player.update({
    where: { id: playerId },
    data: {
      handsPlayed: { increment: 1 },
      handsWon: isWin ? { increment: 1 } : undefined,
      totalWagered: { increment: betCents },
    },
  });

  // Update biggest win separately (need to compare with current value)
  if (netResultCents > 0) {
    await prisma.$executeRaw`
      UPDATE "Player"
      SET "biggestWin" = GREATEST("biggestWin", ${netResultCents})
      WHERE id = ${playerId}
    `;
  }
}

/**
 * Get player stats
 */
export async function getPlayerStats(playerId: string): Promise<PlayerData | null> {
  if (!prisma) return null;

  return prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      bankrollCents: true,
      handsPlayed: true,
      handsWon: true,
      totalWagered: true,
      biggestWin: true,
    },
  });
}
