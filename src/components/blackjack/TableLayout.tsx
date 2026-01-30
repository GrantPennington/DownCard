'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBlackjackStore } from '@/store/blackjackStore';
import { formatPlayerId } from '@/lib/utils/formatPlayerId';
import { DealerHand } from './DealerHand';
import { PlayerHands } from './PlayerHands';
import { BetControls } from './BetControls';
import { ActionBar } from './ActionBar';
import { ResultBanner } from './ResultBanner';
import { GameOverModal } from './GameOverModal';
import { ResetConfirmModal } from './ResetConfirmModal';
import { LoadingOverlay } from './LoadingOverlay';

export function TableLayout() {
  const { roundState, error, bankrollCents, playerId, clearError } = useBlackjackStore();
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-1.5 sm:p-4 lg:p-6">
      <div className="w-full max-w-5xl lg:max-w-7xl xl:max-w-[90vw] 2xl:max-w-[85vw]">
        {/* Top Bar - Home + Bankroll + Hotkeys */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4 px-2 py-1.5 sm:px-3 sm:py-2 lg:px-6 lg:py-4 bg-gray-900/80 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <Image
                src="/icon-logo.svg"
                alt="Downcard"
                width={40}
                height={40}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
              />
            </Link>
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-md transition-colors text-xs sm:text-sm lg:text-base"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Restart</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 lg:gap-3">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-400">
                ${(bankrollCents / 100).toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-gray-400">
                {formatPlayerId(playerId)}
              </div>
            </div>
          </div>
          {/* Hotkeys - hidden on mobile */}
          <div className="hidden md:flex gap-2 lg:gap-4 xl:gap-6 text-xs lg:text-sm xl:text-base text-gray-300">
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
        <div className="bg-green-600/40 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-amber-900 shadow-2xl p-3 sm:p-6 lg:p-8 xl:p-10">
          {/* Layout: Vertical on small screens, Horizontal on large screens */}
          {roundState ? (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:gap-12">
              {/* Player Hands - Left side on large screens, top on small screens */}
              <div className="mb-2 sm:mb-4 lg:mb-0 lg:flex-1 order-2 lg:order-1">
                <PlayerHands
                  hands={roundState.playerHands}
                  activeHandIndex={roundState.activeHandIndex}
                />
              </div>

              {/* Divider - Horizontal on small, Vertical on large */}
              <div className="border-t lg:border-t-0 lg:border-l-2 border-white/20 my-2 sm:my-4 lg:my-0 lg:self-stretch order-3 lg:order-2" />

              {/* Dealer Hand - Right side on large screens, bottom on small screens */}
              <div className="mb-2 sm:mb-4 lg:mb-0 lg:flex-1 order-1 lg:order-3">
                <DealerHand dealer={roundState.dealer} />
              </div>
            </div>
          ) : null}

          {/* Controls Section - Always at bottom */}
          {roundState && <div className="border-t border-white/20 mt-2 sm:mt-4 lg:mt-8 xl:mt-10 mb-2 sm:mb-4 lg:mb-0" />}

          {/* Action Buttons - Inline */}
          {roundState?.phase === 'PLAYER_TURN' && (
            <div className="mb-2 sm:mb-4 lg:mb-0">
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

      {/* Game Over Modal */}
      <GameOverModal />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />

      {/* Loading Overlay */}
      <LoadingOverlay />
    </div>
  );
}
