'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatPlayerId } from '@/lib/utils/formatPlayerId';

type Stats = {
  bankrollCents: number;
  handsPlayed: number;
  handsWon: number;
  winRate: string;
  totalWageredCents: number;
  biggestWinCents: number;
  // Detailed stats
  blackjacks: number;
  doublesPlayed: number;
  doublesWon: number;
  splitsPlayed: number;
  splitsWon: number;
  pushes: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  currentStreak: number;
  biggestLossCents: number;
  netProfitCents: number;
};

type HistoryEntry = {
  id: string;
  createdAt: string;
  betCents: number;
  netResultCents: number;
  result: string;
  playerTotal: number;
  dealerTotal: number;
  wasBlackjack: boolean;
  wasDouble: boolean;
  wasSplit: boolean;
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setStats(data.stats);
        setHistory(data.history || []);
        setPlayerId(data.playerId);
      } catch {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatResult = (result: string) => {
    switch (result) {
      case 'WIN': return { text: 'Win', color: 'text-green-400' };
      case 'BJ': return { text: 'Blackjack!', color: 'text-yellow-400' };
      case 'LOSS': return { text: 'Loss', color: 'text-red-400' };
      case 'PUSH': return { text: 'Push', color: 'text-gray-400' };
      case 'SURRENDER': return { text: 'Surrender', color: 'text-orange-400' };
      default: return { text: result, color: 'text-gray-400' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <Image
                src="/icon-logo.svg"
                alt="Downcard"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Stats</h1>
              <div className="text-sm text-gray-400">{formatPlayerId(playerId)}</div>
            </div>
          </div>
          <Link
            href="/play"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Play Now
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading stats..." />
        ) : error ? (
          <div className="text-center text-red-400 py-12">{error}</div>
        ) : !stats ? (
          <div className="text-center text-gray-400 py-12">
            No stats yet. Play some hands to see your stats!
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <StatCard label="Bankroll" value={formatCents(stats.bankrollCents)} highlight />
              <StatCard label="Hands Played" value={stats.handsPlayed.toLocaleString()} />
              <StatCard label="Hands Won" value={stats.handsWon.toLocaleString()} />
              <StatCard label="Win Rate" value={stats.winRate} />
              <StatCard label="Total Wagered" value={formatCents(stats.totalWageredCents)} />
              <StatCard label="Biggest Win" value={formatCents(stats.biggestWinCents)} highlight />
            </div>

            {/* Detailed Stats Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mb-8 px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-xl flex items-center justify-between text-gray-300 hover:text-white transition-colors"
            >
              <span className="font-medium">Detailed Stats</span>
              <svg
                className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Detailed Stats Sections */}
            {showDetails && (
              <div className="mb-8 space-y-6">
                {/* Gameplay Stats */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Gameplay</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniStatCard label="Blackjacks" value={stats.blackjacks.toString()} />
                    <MiniStatCard
                      label="Doubles"
                      value={`${stats.doublesWon}/${stats.doublesPlayed}`}
                      subtext="won"
                    />
                    <MiniStatCard
                      label="Splits"
                      value={`${stats.splitsWon}/${stats.splitsPlayed}`}
                      subtext="won"
                    />
                    <MiniStatCard label="Pushes" value={stats.pushes.toString()} />
                  </div>
                </div>

                {/* Streak Stats */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Streaks</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStatCard
                      label="Current"
                      value={stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak.toString()}
                      color={stats.currentStreak > 0 ? 'text-green-400' : stats.currentStreak < 0 ? 'text-red-400' : undefined}
                    />
                    <MiniStatCard
                      label="Best Win Streak"
                      value={stats.longestWinStreak.toString()}
                      color="text-green-400"
                    />
                    <MiniStatCard
                      label="Worst Lose Streak"
                      value={stats.longestLoseStreak.toString()}
                      color="text-red-400"
                    />
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Financial</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStatCard
                      label="Net Profit"
                      value={`${stats.netProfitCents >= 0 ? '+' : ''}${formatCents(stats.netProfitCents)}`}
                      color={stats.netProfitCents >= 0 ? 'text-green-400' : 'text-red-400'}
                    />
                    <MiniStatCard
                      label="Biggest Loss"
                      value={formatCents(stats.biggestLossCents)}
                      color="text-red-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hand History */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <h2 className="text-xl font-bold text-white p-4 border-b border-gray-700">
                Recent Hands
              </h2>
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No hands played yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-700 text-gray-300 text-left text-sm">
                        <th className="px-4 py-3">Result</th>
                        <th className="px-4 py-3 text-right">Bet</th>
                        <th className="px-4 py-3 text-right">Net</th>
                        <th className="px-4 py-3 text-center hidden sm:table-cell">You</th>
                        <th className="px-4 py-3 text-center hidden sm:table-cell">Dealer</th>
                        <th className="px-4 py-3 hidden md:table-cell">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((hand) => {
                        const result = formatResult(hand.result);
                        return (
                          <tr key={hand.id} className="border-t border-gray-700">
                            <td className={`px-4 py-3 font-medium ${result.color}`}>
                              {result.text}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              {formatCents(hand.betCents)}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono ${
                              hand.netResultCents > 0 ? 'text-green-400' :
                              hand.netResultCents < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {hand.netResultCents >= 0 ? '+' : ''}{formatCents(hand.netResultCents)}
                            </td>
                            <td className="px-4 py-3 text-center text-white hidden sm:table-cell">
                              {hand.playerTotal}
                            </td>
                            <td className="px-4 py-3 text-center text-white hidden sm:table-cell">
                              {hand.dealerTotal || '-'}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="flex gap-1">
                                {hand.wasBlackjack && (
                                  <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">BJ</span>
                                )}
                                {hand.wasDouble && (
                                  <span className="px-2 py-0.5 bg-blue-600 text-blue-100 text-xs rounded">2x</span>
                                )}
                                {hand.wasSplit && (
                                  <span className="px-2 py-0.5 bg-purple-600 text-purple-100 text-xs rounded">Split</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <Link
            href="/leaderboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-md transition-colors"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-green-900/50 border border-green-700' : 'bg-gray-800'}`}>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color?: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color || 'text-white'}`}>
        {value}
        {subtext && <span className="text-xs font-normal text-gray-400 ml-1">{subtext}</span>}
      </div>
    </div>
  );
}
