import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, LeaderboardCategory } from '@/lib/db';

const VALID_CATEGORIES: LeaderboardCategory[] = [
  'biggestWin',
  'handsPlayed',
  'winRate',
  'totalWagered',
  'netProfit',
  'longestWinStreak',
  'blackjacks',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'biggestWin';

    if (!VALID_CATEGORIES.includes(category as LeaderboardCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const entries = await getLeaderboard(category as LeaderboardCategory);

    return NextResponse.json({
      category,
      entries,
      minHandsForWinRate: category === 'winRate' ? 10 : undefined,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
