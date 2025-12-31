'use client';

import { Card as CardType } from '@/lib/types';
import { motion } from 'framer-motion';

type CardProps = {
  card: CardType | null;
  hidden?: boolean;
  delay?: number;
};

const suitSymbols: Record<string, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

const suitColors: Record<string, string> = {
  S: 'text-gray-900',
  H: 'text-red-600',
  D: 'text-red-600',
  C: 'text-gray-900',
};

export function Card({ card, hidden = false, delay = 0 }: CardProps) {
  if (hidden || !card) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="relative w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-700 shadow-lg"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-16 sm:w-16 sm:h-20 border-2 border-blue-400 rounded opacity-40" />
        </div>
      </motion.div>
    );
  }

  const suitSymbol = suitSymbols[card.suit] || card.suit;
  const suitColor = suitColors[card.suit] || 'text-gray-900';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, type: 'spring', stiffness: 200 }}
      className="relative w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg border-2 border-gray-300 shadow-lg"
    >
      <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
        <div className={`text-xs sm:text-sm font-bold ${suitColor}`}>{card.rank}</div>
        <div className={`text-base sm:text-xl ${suitColor}`}>{suitSymbol}</div>
      </div>
      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 transform rotate-180">
        <div className={`text-xs sm:text-sm font-bold ${suitColor}`}>{card.rank}</div>
        <div className={`text-base sm:text-xl ${suitColor}`}>{suitSymbol}</div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl ${suitColor}`}>
        {suitSymbol}
      </div>
    </motion.div>
  );
}
