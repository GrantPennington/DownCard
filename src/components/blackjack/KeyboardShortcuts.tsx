'use client';

export function KeyboardShortcuts() {
  const shortcuts = [
    { key: 'H', action: 'Hit' },
    { key: 'S', action: 'Stand' },
    { key: 'D', action: 'Double' },
    { key: 'P', action: 'Split' },
    { key: 'Space', action: 'Deal' },
    { key: 'R', action: 'Rebet' },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-400">
      {shortcuts.map(({ key, action }) => (
        <div key={key} className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white font-mono">
            {key}
          </kbd>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}
