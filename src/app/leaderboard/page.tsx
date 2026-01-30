'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string;
  value: number;
  formattedValue: string;
  handsPlayed: number;
};

type Category = 'biggestWin' | 'handsPlayed' | 'winRate' | 'totalWagered';

const CATEGORIES: { key: Category; label: string; description: string }[] = [
  { key: 'biggestWin', label: 'Biggest Win', description: 'Largest single hand win' },
  { key: 'handsPlayed', label: 'Most Hands', description: 'Total hands played' },
  { key: 'winRate', label: 'Win Rate', description: 'Best win percentage (min 10 hands)' },
  { key: 'totalWagered', label: 'High Roller', description: 'Total amount wagered' },
];

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>('biggestWin');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current player ID on mount
  useEffect(() => {
    async function fetchPlayerId() {
      try {
        const res = await fetch('/api/identity', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setCurrentPlayerId(data.playerId);
        }
      } catch {
        // Silently fail - not critical for viewing leaderboard
      }
    }
    fetchPlayerId();
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/leaderboard?category=${category}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setEntries(data.entries);
      } catch {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [category]);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Leaderboard</h1>
          </div>
          <Link
            href="/play"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Play Now
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === cat.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Category Description */}
        <p className="text-gray-400 mb-6">
          {CATEGORIES.find((c) => c.key === category)?.description}
        </p>

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Loading leaderboard..." />
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No entries yet. Be the first to play!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="px-4 py-3 w-16">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">
                    {category === 'biggestWin' && 'Biggest Win'}
                    {category === 'handsPlayed' && 'Hands Played'}
                    {category === 'winRate' && 'Win Rate'}
                    {category === 'totalWagered' && 'Total Wagered'}
                  </th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Hands</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isMe = currentPlayerId && entry.playerId === currentPlayerId;
                  return (
                    <tr
                      key={entry.playerId}
                      className={`border-t border-gray-700 ${
                        isMe
                          ? 'bg-green-900/30 hover:bg-green-900/40'
                          : 'hover:bg-gray-750'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            entry.rank === 1
                              ? 'bg-yellow-500 text-black'
                              : entry.rank === 2
                              ? 'bg-gray-400 text-black'
                              : entry.rank === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className={isMe ? 'text-green-400' : 'text-white'}>
                          {entry.displayName}
                        </span>
                        {isMe && (
                          <span className="ml-2 px-2 py-0.5 bg-green-600 text-green-100 text-xs rounded">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400 font-mono">
                        {entry.formattedValue}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                        {entry.handsPlayed.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
