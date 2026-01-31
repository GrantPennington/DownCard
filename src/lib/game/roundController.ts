import { GameSession, updateGameSession, syncBankrollToDb } from './sessionStore';
import { drawCards, shuffleShoe, shouldReshuffle, createShoe } from '@/lib/engine/shoe';
import {
  calculateHandTotal,
  isBlackjack,
  isBust,
  canSplitCards,
} from '@/lib/engine/hand';
import { getLegalActions } from '@/lib/engine/rules';
import { playDealerHand } from '@/lib/engine/dealer';
import { settleAllHands } from '@/lib/engine/settle';
import { RoundState, Action, Card, PlayerHand } from '@/lib/types';
import { recordHand, updatePlayerStats } from '@/lib/db';

/**
 * Deal a new round
 */
export async function deal(session: GameSession, betCents: number): Promise<RoundState> {
  // Validate bet
  if (betCents < 100 || betCents > 50000) {
    throw new Error('Bet must be between 100 and 50000 cents');
  }

  if (betCents > session.bankrollCents) {
    throw new Error('Insufficient bankroll');
  }

  // Check if shoe needs reshuffling
  if (shouldReshuffle(session.shoe, session.rules.reshuffleThreshold)) {
    session.shoe = shuffleShoe(createShoe(session.rules.numDecks));
  }

  // Draw 4 cards: player1, dealer1, player2, dealer2 (hole)
  const { cards: drawnCards, shoe: newShoe } = drawCards(session.shoe, 4);
  session.shoe = newShoe;

  const playerCards = [drawnCards[0], drawnCards[2]];
  const dealerCards = [drawnCards[1], drawnCards[3]];

  // Calculate player hand
  const { total: playerTotal, soft: playerSoft } = calculateHandTotal(playerCards);
  const playerBlackjack = isBlackjack(playerCards);

  // Deduct bet from session bankroll immediately
  session.bankrollCents -= betCents;

  // Create initial round state
  const roundState: RoundState = {
    phase: 'PLAYER_TURN',
    bankrollCents: session.bankrollCents,
    baseBetCents: betCents,
    dealer: {
      cards: dealerCards,
      total: null, // Hide dealer total until revealed
      holeRevealed: false,
    },
    playerHands: [
      {
        cards: playerCards,
        total: playerTotal,
        soft: playerSoft,
        betCents,
        status: playerBlackjack ? 'BLACKJACK' : 'ACTIVE',
      },
    ],
    activeHandIndex: 0,
    legalActions: [],
  };

  // If player has blackjack, proceed to dealer turn immediately
  if (playerBlackjack) {
    roundState.phase = 'DEALER_TURN';
    return await finalizeDealerTurn(session, roundState);
  }

  // Calculate legal actions
  roundState.legalActions = getLegalActions(
    roundState.playerHands[0],
    roundState.dealer,
    session.rules,
    true, // first action
    1, // number of hands
    roundState.bankrollCents
  );

  session.roundState = roundState;
  updateGameSession(session);

  return roundState;
}

/**
 * Apply a player action
 */
export async function applyAction(
  session: GameSession,
  action: Action,
  handIndex: number
): Promise<RoundState> {
  if (!session.roundState) {
    throw new Error('No active round');
  }

  const roundState = session.roundState;

  // Validate phase
  if (roundState.phase !== 'PLAYER_TURN') {
    throw new Error('Not in player turn phase');
  }

  // Validate hand index
  if (handIndex !== roundState.activeHandIndex) {
    throw new Error('Invalid hand index');
  }

  // Validate action is legal
  if (!roundState.legalActions.includes(action)) {
    throw new Error(`Action ${action} is not legal`);
  }

  const hand = roundState.playerHands[handIndex];

  switch (action) {
    case 'HIT':
      return await handleHit(session, roundState, handIndex);
    case 'STAND':
      return await handleStand(session, roundState, handIndex);
    case 'DOUBLE':
      return await handleDouble(session, roundState, handIndex);
    case 'SPLIT':
      return await handleSplit(session, roundState, handIndex);
    case 'SURRENDER':
      return await handleSurrender(session, roundState, handIndex);
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

/**
 * Handle HIT action
 */
async function handleHit(session: GameSession, roundState: RoundState, handIndex: number): Promise<RoundState> {
  const hand = roundState.playerHands[handIndex];

  // Draw a card
  const { cards, shoe: newShoe } = drawCards(session.shoe, 1);
  session.shoe = newShoe;

  hand.cards.push(cards[0]);

  // Recalculate total
  const { total, soft } = calculateHandTotal(hand.cards);
  hand.total = total;
  hand.soft = soft;

  // Check for bust
  if (isBust(hand.cards)) {
    hand.status = 'BUST';
    return await advanceToNextHand(session, roundState);
  }

  // Recalculate legal actions
  roundState.legalActions = getLegalActions(
    hand,
    roundState.dealer,
    session.rules,
    false, // not first action
    roundState.playerHands.length,
    roundState.bankrollCents
  );

  session.roundState = roundState;
  updateGameSession(session);

  return roundState;
}

/**
 * Handle STAND action
 */
async function handleStand(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): Promise<RoundState> {
  const hand = roundState.playerHands[handIndex];
  hand.status = 'STAND';

  return await advanceToNextHand(session, roundState);
}

/**
 * Handle DOUBLE action
 */
async function handleDouble(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): Promise<RoundState> {
  const hand = roundState.playerHands[handIndex];

  // Deduct additional bet from bankroll
  roundState.bankrollCents -= hand.betCents;
  hand.betCents *= 2;

  // Draw one card
  const { cards, shoe: newShoe } = drawCards(session.shoe, 1);
  session.shoe = newShoe;

  hand.cards.push(cards[0]);

  // Recalculate total
  const { total, soft } = calculateHandTotal(hand.cards);
  hand.total = total;
  hand.soft = soft;

  // Check for bust
  if (isBust(hand.cards)) {
    hand.status = 'BUST';
  } else {
    hand.status = 'STAND';
  }

  return await advanceToNextHand(session, roundState);
}

/**
 * Handle SPLIT action
 */
async function handleSplit(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): Promise<RoundState> {
  const hand = roundState.playerHands[handIndex];

  // Deduct additional bet from bankroll
  roundState.bankrollCents -= hand.betCents;

  // Create two new hands
  const card1 = hand.cards[0];
  const card2 = hand.cards[1];

  // Draw two more cards
  const { cards: newCards, shoe: newShoe } = drawCards(session.shoe, 2);
  session.shoe = newShoe;

  const isSplitAces = card1.rank === 'A';

  // First hand
  hand.cards = [card1, newCards[0]];
  const { total: total1, soft: soft1 } = calculateHandTotal(hand.cards);
  hand.total = total1;
  hand.soft = soft1;
  hand.isSplitAces = isSplitAces;

  if (isSplitAces) {
    // Split aces get one card and stand
    hand.status = 'STAND';
  } else if (isBlackjack(hand.cards)) {
    // This is 21, not blackjack (since it's after split)
    hand.status = 'STAND';
  }

  // Second hand
  const secondHand: PlayerHand = {
    cards: [card2, newCards[1]],
    total: 0,
    soft: false,
    betCents: hand.betCents,
    status: 'ACTIVE',
    isSplitAces,
  };

  const { total: total2, soft: soft2 } = calculateHandTotal(secondHand.cards);
  secondHand.total = total2;
  secondHand.soft = soft2;

  if (isSplitAces) {
    // Split aces get one card and stand
    secondHand.status = 'STAND';
  } else if (isBlackjack(secondHand.cards)) {
    // This is 21, not blackjack (since it's after split)
    secondHand.status = 'STAND';
  }

  // Insert second hand after first
  roundState.playerHands.splice(handIndex + 1, 0, secondHand);

  // If split aces, move to next hand immediately
  if (isSplitAces) {
    return await advanceToNextHand(session, roundState);
  }

  // Recalculate legal actions for current hand
  roundState.legalActions = getLegalActions(
    hand,
    roundState.dealer,
    session.rules,
    true, // first action on this hand
    roundState.playerHands.length,
    roundState.bankrollCents
  );

  session.roundState = roundState;
  updateGameSession(session);

  return roundState;
}

/**
 * Handle SURRENDER action
 */
async function handleSurrender(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): Promise<RoundState> {
  const hand = roundState.playerHands[handIndex];

  // Return half the bet
  const halfBet = Math.floor(hand.betCents / 2);
  roundState.bankrollCents += halfBet;

  // Mark as surrendered (we'll handle this in settlement)
  hand.status = 'DONE';

  roundState.phase = 'SETTLEMENT';
  roundState.outcome = {
    results: [
      {
        handIndex: 0,
        result: 'SURRENDER',
        netPayoutCents: -halfBet,
      },
    ],
    netCents: -halfBet,
    message: 'Surrendered',
  };

  // Update bankroll
  session.bankrollCents = roundState.bankrollCents;

  session.roundState = roundState;
  updateGameSession(session);

  // Persist to database
  await persistSurrender(session, roundState, hand);

  return roundState;
}

/**
 * Persist surrender to database
 */
async function persistSurrender(
  session: GameSession,
  roundState: RoundState,
  hand: PlayerHand
): Promise<void> {
  await syncBankrollToDb(session);

  const halfBet = Math.floor(hand.betCents / 2);

  await recordHand({
    playerId: session.playerId,
    betCents: hand.betCents,
    netResultCents: -halfBet,
    result: 'SURRENDER',
    playerCards: hand.cards,
    dealerCards: roundState.dealer.cards,
    playerTotal: hand.total,
    dealerTotal: 0, // Dealer cards not revealed on surrender
    wasBlackjack: false,
    wasDouble: false,
    wasSplit: false,
  });

  await updatePlayerStats(session.playerId, {
    betCents: hand.betCents,
    netResultCents: -halfBet,
    isWin: false,
    isPush: false,
    isBlackjack: false,
    isDouble: false,
    isSplit: false,
  });
}

/**
 * Advance to next hand or dealer turn
 */
async function advanceToNextHand(session: GameSession, roundState: RoundState): Promise<RoundState> {
  // Check if all hands are done
  const allHandsDone = roundState.playerHands.every(
    (h) => h.status !== 'ACTIVE'
  );

  if (allHandsDone) {
    // Move to dealer turn
    roundState.phase = 'DEALER_TURN';
    return await finalizeDealerTurn(session, roundState);
  }

  // Move to next hand
  roundState.activeHandIndex++;

  const nextHand = roundState.playerHands[roundState.activeHandIndex];

  // Calculate legal actions for next hand
  roundState.legalActions = getLegalActions(
    nextHand,
    roundState.dealer,
    session.rules,
    true, // first action on this hand
    roundState.playerHands.length,
    roundState.bankrollCents
  );

  session.roundState = roundState;
  updateGameSession(session);

  return roundState;
}

/**
 * Finalize dealer turn and settlement
 */
async function finalizeDealerTurn(session: GameSession, roundState: RoundState): Promise<RoundState> {
  // Reveal hole card
  roundState.dealer.holeRevealed = true;

  // Check if all player hands are bust
  const allBust = roundState.playerHands.every((h) => h.status === 'BUST');

  if (!allBust) {
    // Play dealer hand
    const finalDealerCards = playDealerHand(
      roundState.dealer.cards,
      session.rules,
      () => {
        const { cards, shoe: newShoe } = drawCards(session.shoe, 1);
        session.shoe = newShoe;
        return cards[0];
      }
    );

    roundState.dealer.cards = finalDealerCards;
  }

  // Calculate dealer total
  const { total: dealerTotal } = calculateHandTotal(roundState.dealer.cards);
  roundState.dealer.total = dealerTotal;

  // Settle all hands
  const outcome = settleAllHands(
    roundState.playerHands.map((h) => ({
      cards: h.cards,
      betCents: h.betCents,
    })),
    roundState.dealer.cards,
    session.rules
  );

  roundState.outcome = outcome;
  roundState.phase = 'SETTLEMENT';

  // Update bankroll
  // Note: Bet was already deducted in deal(), so we add back the winnings
  // For losses, netCents is negative (loses the bet)
  // For wins, netCents is positive (wins equal to bet)
  // For BJ, netCents is positive (wins 1.5x bet)
  // We need to add back the original bet for wins/BJ, but not for losses
  const totalBet = roundState.playerHands.reduce((sum, h) => sum + h.betCents, 0);
  roundState.bankrollCents += outcome.netCents + totalBet;
  session.bankrollCents = roundState.bankrollCents;

  session.roundState = roundState;
  updateGameSession(session);

  // Persist to database
  await persistSettlement(session, roundState);

  return roundState;
}

/**
 * Persist settlement data to database
 */
async function persistSettlement(
  session: GameSession,
  roundState: RoundState
): Promise<void> {
  const outcome = roundState.outcome;
  if (!outcome) return;

  // Sync bankroll
  await syncBankrollToDb(session);

  // Record each hand in history
  const dealerTotal = roundState.dealer.total ?? 0;
  const hasSplit = roundState.playerHands.length > 1;

  for (let i = 0; i < outcome.results.length; i++) {
    const result = outcome.results[i];
    const hand = roundState.playerHands[i];
    const isWin = result.result === 'WIN' || result.result === 'BJ';

    const isBlackjack = result.result === 'BJ';
    const isPush = result.result === 'PUSH';
    const isDouble = hand.cards.length === 3 && hand.betCents > roundState.baseBetCents;

    await recordHand({
      playerId: session.playerId,
      betCents: hand.betCents,
      netResultCents: result.netPayoutCents,
      result: result.result,
      playerCards: hand.cards,
      dealerCards: roundState.dealer.cards,
      playerTotal: hand.total,
      dealerTotal,
      wasBlackjack: isBlackjack,
      wasDouble: isDouble,
      wasSplit: hasSplit,
    });

    // Update player stats
    await updatePlayerStats(session.playerId, {
      betCents: hand.betCents,
      netResultCents: result.netPayoutCents,
      isWin,
      isPush,
      isBlackjack,
      isDouble,
      isSplit: hasSplit,
    });
  }
}
