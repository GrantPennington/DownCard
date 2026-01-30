'use client';

import { useBlackjackStore } from '@/store/blackjackStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ResetConfirmModal({ isOpen, onClose }: Props) {
  const { roundLoading, resetGame } = useBlackjackStore();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await resetGame();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm mx-4 text-center shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-3">Restart Game?</h3>
        <p className="text-gray-400 mb-6">
          Your bankroll will be reset to $1,000. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={roundLoading}
            className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={roundLoading}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {roundLoading ? 'Restarting...' : 'Restart'}
          </button>
        </div>
      </div>
    </div>
  );
}
