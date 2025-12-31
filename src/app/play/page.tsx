'use client';

import { useEffect } from 'react';
import { useBlackjackStore } from '@/store/blackjackStore';
import { TableLayout } from '@/components/blackjack/TableLayout';

export default function PlayPage() {
  const { init, roundState, action, deal, rebet, currentBetCents, actionLoading, roundLoading } =
    useBlackjackStore();

  // Initialize on mount
  useEffect(() => {
    init();
  }, [init]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if loading
      if (actionLoading || roundLoading) {
        return;
      }

      const key = e.key.toLowerCase();

      // During player turn
      if (roundState && roundState.phase === 'PLAYER_TURN') {
        const legalActions = roundState.legalActions;
        const activeHandIndex = roundState.activeHandIndex;

        switch (key) {
          case 'h':
            if (legalActions.includes('HIT')) {
              action('HIT', activeHandIndex);
            }
            break;
          case 's':
            if (legalActions.includes('STAND')) {
              action('STAND', activeHandIndex);
            }
            break;
          case 'd':
            if (legalActions.includes('DOUBLE')) {
              action('DOUBLE', activeHandIndex);
            }
            break;
          case 'p':
            if (legalActions.includes('SPLIT')) {
              action('SPLIT', activeHandIndex);
            }
            break;
          case 'u':
            if (legalActions.includes('SURRENDER')) {
              action('SURRENDER', activeHandIndex);
            }
            break;
          case 'i':
            if (legalActions.includes('INSURANCE')) {
              action('INSURANCE', activeHandIndex);
            }
            break;
        }
      }

      // Before/after round
      if (!roundState || roundState.phase === 'SETTLEMENT') {
        switch (key) {
          case ' ':
            e.preventDefault(); // Prevent page scroll
            if (currentBetCents >= 100) {
              deal(currentBetCents);
            }
            break;
          case 'r':
            rebet();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [roundState, action, deal, rebet, currentBetCents, actionLoading, roundLoading]);

  return <TableLayout />;
}
