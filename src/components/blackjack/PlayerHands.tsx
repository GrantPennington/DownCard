'use client';

import { PlayerHand } from '@/lib/types';
import { Card } from './Card';

type PlayerHandsProps = {
  hands: PlayerHand[];
  activeHandIndex: number;
};

export function PlayerHands({ hands, activeHandIndex }: PlayerHandsProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-lg sm:text-xl font-semibold text-white">You</div>

      <div className="flex flex-wrap gap-6 justify-center">
        {hands.map((hand, handIndex) => {
          const isActive = handIndex === activeHandIndex && hand.status === 'ACTIVE';
          const statusColor = {
            ACTIVE: 'border-yellow-400',
            STAND: 'border-blue-400',
            BUST: 'border-red-500',
            BLACKJACK: 'border-green-400',
            DONE: 'border-gray-400',
          }[hand.status] || 'border-gray-400';

          return (
            <div
              key={`hand-${handIndex}`}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-lg border-4 transition-all ${
                isActive ? `${statusColor} bg-white/10` : 'border-transparent'
              }`}
            >
              {/* Hand label for splits */}
              {hands.length > 1 && (
                <div className="text-sm font-medium text-white">
                  Hand {handIndex + 1}
                  {isActive && <span className="ml-2 text-yellow-300">←</span>}
                </div>
              )}

              {/* Cards */}
              <div className="flex gap-2 sm:gap-3">
                {hand.cards.map((card, cardIndex) => (
                  <Card
                    key={`hand-${handIndex}-card-${cardIndex}`}
                    card={card}
                    delay={cardIndex * 0.1 + handIndex * 0.05}
                  />
                ))}
              </div>

              {/* Total */}
              <div className="text-base sm:text-lg font-semibold text-white">
                {hand.total}
                {hand.soft && hand.total <= 21 && (
                  <span className="ml-1 text-sm text-yellow-300">(soft)</span>
                )}
                {hand.status === 'BLACKJACK' && (
                  <span className="ml-2 text-green-300">Blackjack!</span>
                )}
                {hand.status === 'BUST' && (
                  <span className="ml-2 text-red-300">Bust</span>
                )}
              </div>

              {/* Bet */}
              <div className="text-sm text-gray-300">
                Bet: ${(hand.betCents / 100).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
