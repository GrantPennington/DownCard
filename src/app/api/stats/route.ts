import { NextResponse } from 'next/server';
import { getOrCreatePlayerId } from '@/lib/identity';
import { getPlayerStats, getHandHistory } from '@/lib/db';

export async function GET() {
  try {
    const playerId = await getOrCreatePlayerId();

    const [stats, history] = await Promise.all([
      getPlayerStats(playerId),
      getHandHistory(playerId, 20),
    ]);

    if (!stats) {
      return NextResponse.json({
        playerId,
        stats: null,
        history: [],
        message: 'Database not configured',
      });
    }

    // Calculate win rate
    const winRate = stats.handsPlayed > 0
      ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      playerId,
      stats: {
        bankrollCents: stats.bankrollCents,
        handsPlayed: stats.handsPlayed,
        handsWon: stats.handsWon,
        winRate: `${winRate}%`,
        totalWageredCents: stats.totalWagered,
        biggestWinCents: stats.biggestWin,
        // Detailed stats
        blackjacks: stats.blackjacks,
        doublesPlayed: stats.doublesPlayed,
        doublesWon: stats.doublesWon,
        splitsPlayed: stats.splitsPlayed,
        splitsWon: stats.splitsWon,
        pushes: stats.pushes,
        longestWinStreak: stats.longestWinStreak,
        longestLoseStreak: stats.longestLoseStreak,
        currentStreak: stats.currentStreak,
        biggestLossCents: stats.biggestLoss,
        netProfitCents: stats.netProfit,
      },
      history: history.map((h) => ({
        id: h.id,
        createdAt: h.createdAt,
        betCents: h.betCents,
        netResultCents: h.netResultCents,
        result: h.result,
        playerTotal: h.playerTotal,
        dealerTotal: h.dealerTotal,
        wasBlackjack: h.wasBlackjack,
        wasDouble: h.wasDouble,
        wasSplit: h.wasSplit,
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
