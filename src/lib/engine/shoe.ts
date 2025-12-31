import { Card, Rank, Suit } from '@/lib/types';

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export type Shoe = {
  cards: Card[];
  dealtCount: number;
  totalCards: number;
};

/**
 * Create a new shoe with N decks
 */
export function createShoe(numDecks: number): Shoe {
  const cards: Card[] = [];

  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit });
      }
    }
  }

  return {
    cards,
    dealtCount: 0,
    totalCards: cards.length,
  };
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleShoe(shoe: Shoe): Shoe {
  const cards = [...shoe.cards];

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return {
    cards,
    dealtCount: 0,
    totalCards: cards.length,
  };
}

/**
 * Draw a card from the shoe
 */
export function drawCard(shoe: Shoe): { card: Card; shoe: Shoe } {
  if (shoe.dealtCount >= shoe.cards.length) {
    throw new Error('Shoe is empty');
  }

  const card = shoe.cards[shoe.dealtCount];

  return {
    card,
    shoe: {
      ...shoe,
      dealtCount: shoe.dealtCount + 1,
    },
  };
}

/**
 * Draw multiple cards from the shoe
 */
export function drawCards(shoe: Shoe, count: number): { cards: Card[]; shoe: Shoe } {
  const cards: Card[] = [];
  let currentShoe = shoe;

  for (let i = 0; i < count; i++) {
    const result = drawCard(currentShoe);
    cards.push(result.card);
    currentShoe = result.shoe;
  }

  return { cards, shoe: currentShoe };
}

/**
 * Check if the shoe should be reshuffled
 */
export function shouldReshuffle(shoe: Shoe, threshold: number): boolean {
  const remainingCards = shoe.cards.length - shoe.dealtCount;
  const percentRemaining = remainingCards / shoe.totalCards;
  return percentRemaining <= threshold;
}

/**
 * Get the number of cards remaining in the shoe
 */
export function getRemainingCards(shoe: Shoe): number {
  return shoe.cards.length - shoe.dealtCount;
}
