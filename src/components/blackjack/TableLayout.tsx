'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { DealerHand } from './DealerHand';
import { PlayerHands } from './PlayerHands';
import { BetControls } from './BetControls';
import { ActionBar } from './ActionBar';
import { ResultBanner } from './ResultBanner';
import { KeyboardShortcuts } from './KeyboardShortcuts';

export function TableLayout() {
  const { roundState, error, toast, clearError, clearToast } = useBlackjackStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Blackjack</h1>
          <p className="text-gray-300">Server-Authoritative Gameplay</p>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-4 p-4 bg-red-600 text-white rounded-lg flex justify-between items-center shadow-lg">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 px-3 py-1 bg-red-700 hover:bg-red-800 rounded font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Toast */}
        {toast && (
          <div className="mb-4 p-4 bg-green-600 text-white rounded-lg flex justify-between items-center shadow-lg">
            <span>{toast}</span>
            <button
              onClick={clearToast}
              className="ml-4 px-3 py-1 bg-green-700 hover:bg-green-800 rounded font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Table Area */}
        <div className="bg-green-600/30 rounded-3xl border-8 border-amber-900 shadow-2xl p-8 mb-6">
          <div className="space-y-8">
            {/* Result Banner */}
            {roundState?.phase === 'SETTLEMENT' && (
              <div className="flex justify-center">
                <ResultBanner />
              </div>
            )}

            {/* Dealer Hand */}
            {roundState && (
              <div className="flex justify-center">
                <DealerHand dealer={roundState.dealer} />
              </div>
            )}

            {/* Center Divider */}
            {roundState && <div className="border-t-2 border-white/20" />}

            {/* Player Hands */}
            {roundState && (
              <div className="flex justify-center">
                <PlayerHands
                  hands={roundState.playerHands}
                  activeHandIndex={roundState.activeHandIndex}
                />
              </div>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Bar (during play) */}
          {roundState?.phase === 'PLAYER_TURN' && (
            <div className="lg:col-span-2">
              <ActionBar />
            </div>
          )}

          {/* Bet Controls (before/after round) */}
          {(!roundState || roundState.phase === 'SETTLEMENT') && (
            <div className="lg:col-span-2">
              <BetControls />
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-8">
          <KeyboardShortcuts />
        </div>
      </div>
    </div>
  );
}
