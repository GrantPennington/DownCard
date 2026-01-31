import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { HandStatsInput } from '../players';

// Mock prisma
const mockUpdate = jest.fn();
const mockExecuteRaw = jest.fn();

jest.mock('../prisma', () => ({
  prisma: {
    player: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}));

// Import after mock
import { updatePlayerStats } from '../players';

describe('updatePlayerStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockExecuteRaw.mockResolvedValue(1);
  });

  const playerId = 'test-player-123';

  test('increments basic stats on a regular win', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 1000,
      isWin: true,
      isPush: false,
      isBlackjack: false,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: playerId },
      data: expect.objectContaining({
        handsPlayed: { increment: 1 },
        handsWon: { increment: 1 },
        totalWagered: { increment: 1000 },
        netProfit: { increment: 1000 },
      }),
    });
  });

  test('increments basic stats on a loss (no handsWon)', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: -1000,
      isWin: false,
      isPush: false,
      isBlackjack: false,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.handsPlayed).toEqual({ increment: 1 });
    expect(updateCall.data.handsWon).toBeUndefined();
    expect(updateCall.data.totalWagered).toEqual({ increment: 1000 });
    expect(updateCall.data.netProfit).toEqual({ increment: -1000 });
  });

  test('tracks blackjack stat', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 1500,
      isWin: true,
      isPush: false,
      isBlackjack: true,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.blackjacks).toEqual({ increment: 1 });
  });

  test('tracks double played and won', async () => {
    const stats: HandStatsInput = {
      betCents: 2000,
      netResultCents: 2000,
      isWin: true,
      isPush: false,
      isBlackjack: false,
      isDouble: true,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.doublesPlayed).toEqual({ increment: 1 });
    expect(updateCall.data.doublesWon).toEqual({ increment: 1 });
  });

  test('tracks double played but not won on loss', async () => {
    const stats: HandStatsInput = {
      betCents: 2000,
      netResultCents: -2000,
      isWin: false,
      isPush: false,
      isBlackjack: false,
      isDouble: true,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.doublesPlayed).toEqual({ increment: 1 });
    expect(updateCall.data.doublesWon).toBeUndefined();
  });

  test('tracks split played and won', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 1000,
      isWin: true,
      isPush: false,
      isBlackjack: false,
      isDouble: false,
      isSplit: true,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.splitsPlayed).toEqual({ increment: 1 });
    expect(updateCall.data.splitsWon).toEqual({ increment: 1 });
  });

  test('tracks push stat', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 0,
      isWin: false,
      isPush: true,
      isBlackjack: false,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.data.pushes).toEqual({ increment: 1 });
  });

  test('updates biggestWin on positive result', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 1500,
      isWin: true,
      isPush: false,
      isBlackjack: true,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    expect(mockExecuteRaw).toHaveBeenCalled();
    const rawCall = mockExecuteRaw.mock.calls[0];
    expect(rawCall[0].some((s: string) => s.includes('biggestWin'))).toBe(true);
  });

  test('updates biggestLoss on negative result', async () => {
    const stats: HandStatsInput = {
      betCents: 2000,
      netResultCents: -2000,
      isWin: false,
      isPush: false,
      isBlackjack: false,
      isDouble: true,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const rawCalls = mockExecuteRaw.mock.calls;
    const hasLossCall = rawCalls.some((call: unknown[]) =>
      (call[0] as string[]).some((s: string) => s.includes('biggestLoss'))
    );
    expect(hasLossCall).toBe(true);
  });

  test('updates streak on win', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 1000,
      isWin: true,
      isPush: false,
      isBlackjack: false,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const rawCalls = mockExecuteRaw.mock.calls;
    const hasStreakCall = rawCalls.some((call: unknown[]) =>
      (call[0] as string[]).some((s: string) => s.includes('currentStreak'))
    );
    expect(hasStreakCall).toBe(true);
  });

  test('does not update streak on push', async () => {
    const stats: HandStatsInput = {
      betCents: 1000,
      netResultCents: 0,
      isWin: false,
      isPush: true,
      isBlackjack: false,
      isDouble: false,
      isSplit: false,
    };

    await updatePlayerStats(playerId, stats);

    const rawCalls = mockExecuteRaw.mock.calls;
    const hasStreakCall = rawCalls.some((call: unknown[]) =>
      (call[0] as string[]).some((s: string) => s.includes('currentStreak'))
    );
    expect(hasStreakCall).toBe(false);
  });
});

describe('Max bet validation', () => {
  test('MAX_BET constant is $500 (50000 cents)', async () => {
    const { useBlackjackStore } = await import('@/store/blackjackStore');

    useBlackjackStore.setState({ bankrollCents: 100000, currentBetCents: 0, error: null });
    useBlackjackStore.getState().addChip(60000);

    const error = useBlackjackStore.getState().error;
    expect(error).not.toBeNull();
    expect(error).toContain('500');
  });
});
