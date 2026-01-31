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
  // Gameplay stats
  blackjacks: number;
  doublesPlayed: number;
  doublesWon: number;
  splitsPlayed: number;
  splitsWon: number;
  pushes: number;
  // Streak stats
  longestWinStreak: number;
  longestLoseStreak: number;
  currentStreak: number;
  // Financial stats
  biggestLoss: number;
  netProfit: number;
};

const selectFields = {
  id: true,
  bankrollCents: true,
  handsPlayed: true,
  handsWon: true,
  totalWagered: true,
  biggestWin: true,
  blackjacks: true,
  doublesPlayed: true,
  doublesWon: true,
  splitsPlayed: true,
  splitsWon: true,
  pushes: true,
  longestWinStreak: true,
  longestLoseStreak: true,
  currentStreak: true,
  biggestLoss: true,
  netProfit: true,
};

const defaultPlayerData = (playerId: string): PlayerData => ({
  id: playerId,
  bankrollCents: DEFAULT_BANKROLL_CENTS,
  handsPlayed: 0,
  handsWon: 0,
  totalWagered: 0,
  biggestWin: 0,
  blackjacks: 0,
  doublesPlayed: 0,
  doublesWon: 0,
  splitsPlayed: 0,
  splitsWon: 0,
  pushes: 0,
  longestWinStreak: 0,
  longestLoseStreak: 0,
  currentStreak: 0,
  biggestLoss: 0,
  netProfit: 0,
});

/**
 * Get or create a player by ID
 */
export async function getOrCreatePlayer(playerId: string): Promise<PlayerData> {
  if (!prisma) {
    return defaultPlayerData(playerId);
  }

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
    return defaultPlayerData(playerId);
  }

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      bankrollCents: DEFAULT_BANKROLL_CENTS,
    },
    select: selectFields,
  });

  return player;
}

export type HandStatsInput = {
  betCents: number;
  netResultCents: number;
  isWin: boolean;
  isPush: boolean;
  isBlackjack: boolean;
  isDouble: boolean;
  isSplit: boolean;
};

/**
 * Update player stats after a hand
 */
export async function updatePlayerStats(
  playerId: string,
  stats: HandStatsInput
): Promise<void> {
  if (!prisma) return;

  const { betCents, netResultCents, isWin, isPush, isBlackjack, isDouble, isSplit } = stats;

  // Build increments object
  const increments: Record<string, { increment: number } | undefined> = {
    handsPlayed: { increment: 1 },
    handsWon: isWin ? { increment: 1 } : undefined,
    totalWagered: { increment: betCents },
    netProfit: { increment: netResultCents },
    blackjacks: isBlackjack ? { increment: 1 } : undefined,
    doublesPlayed: isDouble ? { increment: 1 } : undefined,
    doublesWon: isDouble && isWin ? { increment: 1 } : undefined,
    splitsPlayed: isSplit ? { increment: 1 } : undefined,
    splitsWon: isSplit && isWin ? { increment: 1 } : undefined,
    pushes: isPush ? { increment: 1 } : undefined,
  };

  // Filter out undefined values
  const data = Object.fromEntries(
    Object.entries(increments).filter(([, v]) => v !== undefined)
  );

  // Update basic stats
  await prisma.player.update({
    where: { id: playerId },
    data,
  });

  // Update biggest win/loss with raw SQL (need to compare with current value)
  if (netResultCents > 0) {
    await prisma.$executeRaw`
      UPDATE "Player"
      SET "biggestWin" = GREATEST("biggestWin", ${netResultCents})
      WHERE id = ${playerId}
    `;
  } else if (netResultCents < 0) {
    const loss = Math.abs(netResultCents);
    await prisma.$executeRaw`
      UPDATE "Player"
      SET "biggestLoss" = GREATEST("biggestLoss", ${loss})
      WHERE id = ${playerId}
    `;
  }

  // Update streak stats (wins are positive, losses are negative, pushes don't affect)
  if (!isPush) {
    if (isWin) {
      // Win: if current streak positive, increment; else reset to 1
      await prisma.$executeRaw`
        UPDATE "Player"
        SET
          "currentStreak" = CASE WHEN "currentStreak" >= 0 THEN "currentStreak" + 1 ELSE 1 END,
          "longestWinStreak" = GREATEST("longestWinStreak",
            CASE WHEN "currentStreak" >= 0 THEN "currentStreak" + 1 ELSE 1 END)
        WHERE id = ${playerId}
      `;
    } else {
      // Loss: if current streak negative, decrement; else reset to -1
      await prisma.$executeRaw`
        UPDATE "Player"
        SET
          "currentStreak" = CASE WHEN "currentStreak" <= 0 THEN "currentStreak" - 1 ELSE -1 END,
          "longestLoseStreak" = GREATEST("longestLoseStreak",
            ABS(CASE WHEN "currentStreak" <= 0 THEN "currentStreak" - 1 ELSE -1 END))
        WHERE id = ${playerId}
      `;
    }
  }
}

/**
 * Get player stats
 */
export async function getPlayerStats(playerId: string): Promise<PlayerData | null> {
  if (!prisma) return null;

  return prisma.player.findUnique({
    where: { id: playerId },
    select: selectFields,
  });
}
