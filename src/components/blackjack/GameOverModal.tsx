'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import Link from 'next/link';

export function GameOverModal() {
  const { bankrollCents, roundState, roundLoading, resetGame } = useBlackjackStore();

  // Only show when bankroll is zero and no active round
  const isGameOver = bankrollCents === 0 && !roundState;

  if (!isGameOver) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-amber-600 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Game Over</h2>
        <p className="text-gray-300 mb-6">
          You&apos;ve run out of chips. Better luck next time!
        </p>
        <div className="text-2xl font-bold text-gray-400 mb-8">
          Final Bankroll: $0.00
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={resetGame}
            disabled={roundLoading}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {roundLoading ? 'Starting...' : 'Start New Game'}
          </button>
          <Link
            href="/"
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors inline-block"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
