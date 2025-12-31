'use client';

import { DealerHand as DealerHandType } from '@/lib/types';
import { Card } from './Card';

type DealerHandProps = {
  dealer: DealerHandType;
};

export function DealerHand({ dealer }: DealerHandProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg sm:text-xl font-semibold text-white">
        Dealer
        {dealer.holeRevealed && dealer.total !== null && (
          <span className="ml-2 text-yellow-300">({dealer.total})</span>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3">
        {dealer.cards.map((card, index) => {
          // Hide the hole card (second card) if not revealed
          const hideCard = index === 1 && !dealer.holeRevealed;
          return (
            <Card
              key={`dealer-${index}`}
              card={card}
              hidden={hideCard}
              delay={index * 0.1}
            />
          );
        })}
      </div>
    </div>
  );
}
