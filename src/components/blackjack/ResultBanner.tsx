'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { motion, AnimatePresence } from 'framer-motion';

export function ResultBanner() {
  const { roundState } = useBlackjackStore();

  if (!roundState || roundState.phase !== 'SETTLEMENT' || !roundState.outcome) {
    return null;
  }

  const { message, netCents } = roundState.outcome;
  const isWin = netCents > 0;
  const isLoss = netCents < 0;
  const isPush = netCents === 0;

  const bgColor = isWin ? 'bg-green-600' : isLoss ? 'bg-red-600' : 'bg-gray-600';
  const sign = netCents > 0 ? '+' : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className={`${bgColor} text-white px-8 py-4 rounded-lg shadow-2xl border-2 border-white/20`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl sm:text-3xl font-bold">{message}</div>
          <div className="text-xl sm:text-2xl">
            {sign}${(netCents / 100).toFixed(2)}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
