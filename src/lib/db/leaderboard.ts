import { prisma } from './prisma';

export type LeaderboardCategory = 'biggestWin' | 'handsPlayed' | 'winRate' | 'totalWagered' | 'netProfit' | 'longestWinStreak' | 'blackjacks';

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string | null;
  value: number;
  formattedValue: string;
  handsPlayed: number;
};

const MIN_HANDS_FOR_WIN_RATE = 10;
const LEADERBOARD_LIMIT = 50;

/**
 * Format player display name
 */
function formatPlayerName(playerId: string, displayName: string | null): string {
  if (displayName) return displayName;
  // Show as "Player #XXXX" using last 4 chars of ID
  return `Player #${playerId.slice(-4).toUpperCase()}`;
}

/**
 * Get leaderboard by category
 */
export async function getLeaderboard(
  category: LeaderboardCategory
): Promise<LeaderboardEntry[]> {
  if (!prisma) return [];

  switch (category) {
    case 'biggestWin':
      return getBiggestWinLeaderboard();
    case 'handsPlayed':
      return getHandsPlayedLeaderboard();
    case 'winRate':
      return getWinRateLeaderboard();
    case 'totalWagered':
      return getTotalWageredLeaderboard();
    case 'netProfit':
      return getNetProfitLeaderboard();
    case 'longestWinStreak':
      return getLongestWinStreakLeaderboard();
    case 'blackjacks':
      return getBlackjacksLeaderboard();
    default:
      return [];
  }
}

async function getBiggestWinLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { biggestWin: { gt: 0 } },
    orderBy: { biggestWin: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      biggestWin: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.biggestWin,
    formattedValue: `$${(p.biggestWin / 100).toFixed(2)}`,
    handsPlayed: p.handsPlayed,
  }));
}

async function getHandsPlayedLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { handsPlayed: { gt: 0 } },
    orderBy: { handsPlayed: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.handsPlayed,
    formattedValue: p.handsPlayed.toLocaleString(),
    handsPlayed: p.handsPlayed,
  }));
}

async function getWinRateLeaderboard(): Promise<LeaderboardEntry[]> {
  // Need to calculate win rate - fetch players with enough hands
  const players = await prisma!.player.findMany({
    where: { handsPlayed: { gte: MIN_HANDS_FOR_WIN_RATE } },
    select: {
      id: true,
      displayName: true,
      handsPlayed: true,
      handsWon: true,
    },
  });

  // Calculate win rate and sort
  const withWinRate = players
    .map((p) => ({
      ...p,
      winRate: (p.handsWon / p.handsPlayed) * 100,
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, LEADERBOARD_LIMIT);

  return withWinRate.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.winRate,
    formattedValue: `${p.winRate.toFixed(1)}%`,
    handsPlayed: p.handsPlayed,
  }));
}

async function getTotalWageredLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { totalWagered: { gt: 0 } },
    orderBy: { totalWagered: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      totalWagered: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.totalWagered,
    formattedValue: `$${(p.totalWagered / 100).toLocaleString()}`,
    handsPlayed: p.handsPlayed,
  }));
}

async function getNetProfitLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { handsPlayed: { gt: 0 } },
    orderBy: { netProfit: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      netProfit: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.netProfit,
    formattedValue: `${p.netProfit >= 0 ? '+' : ''}$${(p.netProfit / 100).toLocaleString()}`,
    handsPlayed: p.handsPlayed,
  }));
}

async function getLongestWinStreakLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { longestWinStreak: { gt: 0 } },
    orderBy: { longestWinStreak: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      longestWinStreak: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.longestWinStreak,
    formattedValue: `${p.longestWinStreak} wins`,
    handsPlayed: p.handsPlayed,
  }));
}

async function getBlackjacksLeaderboard(): Promise<LeaderboardEntry[]> {
  const players = await prisma!.player.findMany({
    where: { blackjacks: { gt: 0 } },
    orderBy: { blackjacks: 'desc' },
    take: LEADERBOARD_LIMIT,
    select: {
      id: true,
      displayName: true,
      blackjacks: true,
      handsPlayed: true,
    },
  });

  return players.map((p, i) => ({
    rank: i + 1,
    playerId: p.id,
    displayName: formatPlayerName(p.id, p.displayName),
    value: p.blackjacks,
    formattedValue: p.blackjacks.toLocaleString(),
    handsPlayed: p.handsPlayed,
  }));
}
