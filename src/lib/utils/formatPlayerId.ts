/**
 * Format a player ID for display
 * Shows last 4 characters uppercase, e.g., "Player #A1B2"
 */
export function formatPlayerId(playerId: string | null): string {
  if (!playerId) return 'Player #----';
  return `Player #${playerId.slice(-4).toUpperCase()}`;
}
