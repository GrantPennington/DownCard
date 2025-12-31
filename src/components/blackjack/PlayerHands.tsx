'use client';

import { PlayerHand } from '@/lib/types';
import { Card } from './Card';

type PlayerHandsProps = {
  hands: PlayerHand[];
  activeHandIndex: number;
};

export function PlayerHands({ hands, activeHandIndex }: PlayerHandsProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-white">You</div>

      <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 xl:gap-10 justify-center">
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
              className={`relative flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5 p-3 sm:p-4 lg:p-6 xl:p-8 rounded-lg border-4 transition-all ${
                isActive ? `${statusColor} bg-white/10` : 'border-transparent'
              }`}
            >
              {/* Hand label for splits */}
              {hands.length > 1 && (
                <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium text-white">
                  Hand {handIndex + 1}
                  {isActive && <span className="ml-2 text-yellow-300">←</span>}
                </div>
              )}

              {/* Cards */}
              <div className="flex">
                {hand.cards.map((card, cardIndex) => {
                  const cardCount = hand.cards.length;

                  // Calculate stacking offset based on number of cards
                  const getStackingClass = () => {
                    if (cardIndex === 0) return '';
                    if (cardCount <= 2) return '';
                    if (cardCount <= 4) return '-ml-8 sm:-ml-10 lg:-ml-12 xl:-ml-16';
                    return '-ml-12 sm:-ml-14 lg:-ml-16 xl:-ml-20';
                  };

                  return (
                    <div key={`hand-${handIndex}-card-${cardIndex}`} className={getStackingClass()}>
                      <Card
                        card={card}
                        delay={cardIndex * 0.1 + handIndex * 0.05}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-white">
                {hand.total}
                {hand.soft && hand.total <= 21 && (
                  <span className="ml-1 text-sm lg:text-base xl:text-lg text-yellow-300">(soft)</span>
                )}
                {hand.status === 'BLACKJACK' && (
                  <span className="ml-2 text-green-300">Blackjack!</span>
                )}
                {hand.status === 'BUST' && (
                  <span className="ml-2 text-red-300">Bust</span>
                )}
              </div>

              {/* Bet */}
              <div className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300">
                Bet: ${(hand.betCents / 100).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
