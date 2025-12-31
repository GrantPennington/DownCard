'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function ResultBanner() {
  const { roundState } = useBlackjackStore();
  const [isVisible, setIsVisible] = useState(false);

  // Show banner with delay when settlement phase starts
  useEffect(() => {
    if (roundState?.phase === 'SETTLEMENT' && roundState.outcome) {
      // Delay showing the banner to let players see the cards first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500); // 1.5 second delay

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [roundState?.phase, roundState?.outcome]);

  if (!roundState || roundState.phase !== 'SETTLEMENT' || !roundState.outcome || !isVisible) {
    return null;
  }

  const { message, netCents } = roundState.outcome;
  const isWin = netCents > 0;
  const isLoss = netCents < 0;

  const bgColor = isWin ? 'bg-green-600' : isLoss ? 'bg-red-600' : 'bg-gray-600';
  const sign = netCents > 0 ? '+' : '';

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
            className={`${bgColor} text-white px-12 py-8 rounded-xl shadow-2xl border-4 border-white/30`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">{message}</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
                {sign}${(netCents / 100).toFixed(2)}
              </div>
              <div className="text-sm sm:text-base text-white/80 mt-2">
                Click anywhere to continue
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
