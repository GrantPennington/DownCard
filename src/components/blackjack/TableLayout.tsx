'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { DealerHand } from './DealerHand';
import { PlayerHands } from './PlayerHands';
import { BetControls } from './BetControls';
import { ActionBar } from './ActionBar';
import { ResultBanner } from './ResultBanner';

export function TableLayout() {
  const { roundState, error, bankrollCents, clearError } = useBlackjackStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-5xl lg:max-w-7xl xl:max-w-[90vw] 2xl:max-w-[85vw]">
        {/* Top Bar - Bankroll + Hotkeys */}
        <div className="flex justify-between items-center mb-3 lg:mb-4 px-3 py-2 lg:px-6 lg:py-4 bg-gray-900/80 rounded-lg">
          <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-400">
            ${(bankrollCents / 100).toFixed(2)}
          </div>
          <div className="flex gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm lg:text-base text-gray-300">
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">H</kbd> Hit</span>
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">S</kbd> Stand</span>
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">D</kbd> Double</span>
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">P</kbd> Split</span>
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">R</kbd> Rebet</span>
            <span><kbd className="px-1.5 py-0.5 lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 bg-gray-700 rounded text-xs lg:text-sm xl:text-base">Space</kbd> Deal</span>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-3 p-3 bg-red-600 text-white rounded-lg flex justify-between items-center text-sm">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-green-600/40 rounded-2xl border-4 border-amber-900 shadow-2xl p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Layout: Vertical on small screens, Horizontal on large screens */}
          {roundState ? (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:gap-12">
              {/* Player Hands - Left side on large screens, top on small screens */}
              <div className="mb-4 sm:mb-6 lg:mb-0 lg:flex-1 order-2 lg:order-1">
                <PlayerHands
                  hands={roundState.playerHands}
                  activeHandIndex={roundState.activeHandIndex}
                />
              </div>

              {/* Divider - Horizontal on small, Vertical on large */}
              <div className="border-t-2 lg:border-t-0 lg:border-l-2 border-white/20 my-4 sm:my-6 lg:my-0 lg:self-stretch order-3 lg:order-2" />

              {/* Dealer Hand - Right side on large screens, bottom on small screens */}
              <div className="mb-4 sm:mb-6 lg:mb-0 lg:flex-1 order-1 lg:order-3">
                <DealerHand dealer={roundState.dealer} />
              </div>
            </div>
          ) : null}

          {/* Controls Section - Always at bottom */}
          {roundState && <div className="border-t-2 border-white/20 mt-4 sm:mt-6 lg:mt-8 xl:mt-10 mb-4 sm:mb-6 lg:mb-0" />}

          {/* Action Buttons - Inline */}
          {roundState?.phase === 'PLAYER_TURN' && (
            <div className="mb-4 sm:mb-6 lg:mb-0">
              <ActionBar />
            </div>
          )}

          {/* Betting Controls - Inline */}
          {(!roundState || roundState.phase === 'SETTLEMENT') && (
            <div>
              <BetControls />
            </div>
          )}
        </div>
      </div>

      {/* Result Banner Overlay */}
      <ResultBanner />
    </div>
  );
}
