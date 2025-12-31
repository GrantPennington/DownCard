'use client';

import { useBlackjackStore } from '@/store/blackjackStore';
import { Action } from '@/lib/types';

export function ActionBar() {
  const { roundState, actionLoading, action } = useBlackjackStore();

  if (!roundState || roundState.phase !== 'PLAYER_TURN') {
    return null;
  }

  const legalActions = roundState.legalActions;
  const activeHandIndex = roundState.activeHandIndex;

  const handleAction = (actionType: Action) => {
    if (!actionLoading && legalActions.includes(actionType)) {
      action(actionType, activeHandIndex);
    }
  };

  const actionButtons: Array<{
    action: Action;
    label: string;
    shortcut: string;
    color: string;
  }> = [
    { action: 'HIT', label: 'Hit', shortcut: 'H', color: 'bg-blue-600 hover:bg-blue-500' },
    { action: 'STAND', label: 'Stand', shortcut: 'S', color: 'bg-purple-600 hover:bg-purple-500' },
    { action: 'DOUBLE', label: 'Double', shortcut: 'D', color: 'bg-orange-600 hover:bg-orange-500' },
    { action: 'SPLIT', label: 'Split', shortcut: 'P', color: 'bg-green-600 hover:bg-green-500' },
    { action: 'SURRENDER', label: 'Surrender', shortcut: 'U', color: 'bg-red-600 hover:bg-red-500' },
    { action: 'INSURANCE', label: 'Insurance', shortcut: 'I', color: 'bg-yellow-600 hover:bg-yellow-500' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="text-lg font-semibold text-white">Your Move</div>

      <div className="flex flex-wrap gap-3 justify-center">
        {actionButtons.map(({ action: actionType, label, shortcut, color }) => {
          const isLegal = legalActions.includes(actionType);

          return (
            <button
              key={actionType}
              onClick={() => handleAction(actionType)}
              disabled={!isLegal || actionLoading}
              className={`
                relative px-6 py-3 font-bold text-white rounded-lg transition-all
                ${isLegal && !actionLoading ? color : 'bg-gray-700 opacity-50 cursor-not-allowed'}
                ${isLegal && !actionLoading ? 'hover:scale-105 active:scale-95 shadow-lg' : ''}
              `}
            >
              {label}
              <span className="ml-2 text-xs opacity-75">({shortcut})</span>
            </button>
          );
        })}
      </div>

      {actionLoading && (
        <div className="text-sm text-gray-400 animate-pulse">Processing...</div>
      )}
    </div>
  );
}
