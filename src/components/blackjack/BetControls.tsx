'use client';

import { useBlackjackStore } from '@/store/blackjackStore';

const CHIP_VALUES = [100, 500, 1000, 2500, 5000];

const CHIP_COLORS: Record<number, string> = {
  100: 'bg-white border-gray-400 text-gray-900',
  500: 'bg-red-500 border-red-700 text-white',
  1000: 'bg-blue-500 border-blue-700 text-white',
  2500: 'bg-green-500 border-green-700 text-white',
  5000: 'bg-black border-gray-600 text-white',
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
    <div className="flex flex-col items-center gap-2 lg:gap-2.5 xl:gap-3">
      {/* Round Over Message - Compact */}
      {roundState?.phase === 'SETTLEMENT' && (
        <div className="text-xs lg:text-sm xl:text-base font-normal text-yellow-300/90">
          Place your bet for the next hand
        </div>
      )}

      {/* Current Bet */}
      <div className="text-base lg:text-lg xl:text-xl text-white font-semibold">
        Bet: ${(currentBetCents / 100).toFixed(2)}
      </div>

      {/* Chips - Single Row */}
      <div className="flex gap-2 lg:gap-3 xl:gap-4 items-center justify-center">
        {CHIP_VALUES.map((value) => {
          const disabled = !canBet || value > bankrollCents;
          return (
            <button
              key={value}
              onClick={() => addChip(value)}
              disabled={disabled}
              className={`
                relative w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-full border-4 font-bold text-xs lg:text-sm xl:text-base
                transition-all duration-200 transform
                ${CHIP_COLORS[value]}
                ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:scale-110 hover:shadow-lg active:scale-95 cursor-pointer'
                }
              `}
            >
              ${value / 100}
            </button>
          );
        })}
      </div>

      {/* Action Buttons - Single Row */}
      <div className="flex gap-2 lg:gap-3 xl:gap-4 items-center">
        <button
          onClick={clearBet}
          disabled={!canBet || currentBetCents === 0}
          className="px-4 py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm lg:text-base xl:text-lg font-semibold rounded transition-colors"
        >
          Clear
        </button>

        {canRebet && (
          <button
            onClick={handleRebet}
            className="px-4 py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 bg-yellow-600 hover:bg-yellow-500 text-white text-sm lg:text-base xl:text-lg font-semibold rounded transition-colors"
          >
            Rebet ${(lastBetCents / 100).toFixed(2)}
          </button>
        )}

        <button
          onClick={handleDeal}
          disabled={!canDeal}
          className="px-6 py-2 lg:px-7 lg:py-2.5 xl:px-8 xl:py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm lg:text-base xl:text-lg font-bold rounded transition-colors shadow-lg"
        >
          {roundLoading ? 'Dealing...' : 'Deal'}
        </button>
      </div>
    </div>
  );
}
