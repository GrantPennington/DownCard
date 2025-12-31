'use client';

import { useBlackjackStore } from '@/store/blackjackStore';

const CHIP_VALUES = [100, 500, 1000, 2500, 5000];

const CHIP_COLORS: Record<number, string> = {
  100: 'bg-white border-gray-400',
  500: 'bg-red-500 border-red-700',
  1000: 'bg-blue-500 border-blue-700',
  2500: 'bg-green-500 border-green-700',
  5000: 'bg-black border-gray-600',
};

export function BetControls() {
  const {
    currentBetCents,
    lastBetCents,
    bankrollCents,
    roundState,
    roundLoading,
    addChip,
    clearBet,
    deal,
    rebet,
  } = useBlackjackStore();

  const canBet = (!roundState || roundState.phase === 'SETTLEMENT') && !roundLoading;
  const canDeal = canBet && currentBetCents >= 100;
  const canRebet = canBet && lastBetCents > 0;

  const handleDeal = () => {
    if (canDeal) {
      deal(currentBetCents);
    }
  };

  const handleRebet = () => {
    if (canRebet) {
      rebet();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Bankroll */}
      <div className="text-xl font-bold text-green-400">
        Bankroll: ${(bankrollCents / 100).toFixed(2)}
      </div>

      {/* Round Over Message */}
      {roundState?.phase === 'SETTLEMENT' && (
        <div className="text-lg font-semibold text-yellow-300">
          Place your bet for the next hand
        </div>
      )}

      {/* Current Bet Display */}
      <div className="text-lg text-white">
        Current Bet: ${(currentBetCents / 100).toFixed(2)}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-3 justify-center">
        {CHIP_VALUES.map((value) => {
          const disabled = !canBet || value > bankrollCents;
          return (
            <button
              key={value}
              onClick={() => addChip(value)}
              disabled={disabled}
              className={`
                relative w-16 h-16 rounded-full border-4 font-bold text-sm
                transition-all duration-200 transform
                ${CHIP_COLORS[value]}
                ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:scale-110 hover:shadow-lg active:scale-95 cursor-pointer'
                }
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                ${value / 100}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={clearBet}
          disabled={!canBet || currentBetCents === 0}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Clear
        </button>

        <button
          onClick={handleRebet}
          disabled={!canRebet}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          title="Rebet (R)"
        >
          Rebet ${(lastBetCents / 100).toFixed(2)}
        </button>

        <button
          onClick={handleDeal}
          disabled={!canDeal}
          className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors shadow-lg"
          title="Deal (Space)"
        >
          {roundLoading ? 'Dealing...' : 'Deal'}
        </button>
      </div>

      {/* Bet limits hint */}
      <div className="text-xs text-gray-400">
        Min: $1.00 | Max: $100.00
      </div>
    </div>
  );
}
