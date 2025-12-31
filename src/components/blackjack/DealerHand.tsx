'use client';

import { DealerHand as DealerHandType } from '@/lib/types';
import { Card } from './Card';

type DealerHandProps = {
  dealer: DealerHandType;
};

export function DealerHand({ dealer }: DealerHandProps) {
  const cardCount = dealer.cards.length;

  // Calculate stacking offset based on number of cards
  // More cards = more overlap to keep them on screen
  const getStackingClass = (index: number) => {
    if (index === 0) return '';
    if (cardCount <= 2) return '';
    if (cardCount <= 4) return '-ml-8 sm:-ml-10 lg:-ml-12 xl:-ml-16';
    return '-ml-12 sm:-ml-14 lg:-ml-16 xl:-ml-20';
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-white">
        Dealer
        {dealer.holeRevealed && dealer.total !== null && (
          <span className="ml-2 text-yellow-300">({dealer.total})</span>
        )}
      </div>

      <div className="flex">
        {dealer.cards.map((card, index) => {
          // Hide the hole card (second card) if not revealed
          const hideCard = index === 1 && !dealer.holeRevealed;
          return (
            <div key={`dealer-${index}`} className={getStackingClass(index)}>
              <Card
                card={card}
                hidden={hideCard}
                delay={index * 0.1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
