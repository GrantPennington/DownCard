import { GameSession, updateGameSession } from './sessionStore';
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
import { RoundState, Action, Card } from '@/lib/types';

/**
 * Deal a new round
 */
export function deal(session: GameSession, betCents: number): RoundState {
  // Validate bet
  if (betCents < 100 || betCents > 10000) {
    throw new Error('Bet must be between 100 and 10000 cents');
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

  // Create initial round state
  const roundState: RoundState = {
    phase: 'PLAYER_TURN',
    bankrollCents: session.bankrollCents - betCents,
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
    return finalizeDealerTurn(session, roundState);
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
export function applyAction(
  session: GameSession,
  action: Action,
  handIndex: number
): RoundState {
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
      return handleHit(session, roundState, handIndex);
    case 'STAND':
      return handleStand(session, roundState, handIndex);
    case 'DOUBLE':
      return handleDouble(session, roundState, handIndex);
    case 'SPLIT':
      return handleSplit(session, roundState, handIndex);
    case 'SURRENDER':
      return handleSurrender(session, roundState, handIndex);
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

/**
 * Handle HIT action
 */
function handleHit(session: GameSession, roundState: RoundState, handIndex: number): RoundState {
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
    return advanceToNextHand(session, roundState);
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
function handleStand(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): RoundState {
  const hand = roundState.playerHands[handIndex];
  hand.status = 'STAND';

  return advanceToNextHand(session, roundState);
}

/**
 * Handle DOUBLE action
 */
function handleDouble(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): RoundState {
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

  return advanceToNextHand(session, roundState);
}

/**
 * Handle SPLIT action
 */
function handleSplit(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): RoundState {
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
  const secondHand = {
    cards: [card2, newCards[1]],
    total: 0,
    soft: false,
    betCents: hand.betCents,
    status: 'ACTIVE' as const,
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
    return advanceToNextHand(session, roundState);
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
function handleSurrender(
  session: GameSession,
  roundState: RoundState,
  handIndex: number
): RoundState {
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

  return roundState;
}

/**
 * Advance to next hand or dealer turn
 */
function advanceToNextHand(session: GameSession, roundState: RoundState): RoundState {
  // Check if all hands are done
  const allHandsDone = roundState.playerHands.every(
    (h) => h.status !== 'ACTIVE'
  );

  if (allHandsDone) {
    // Move to dealer turn
    roundState.phase = 'DEALER_TURN';
    return finalizeDealerTurn(session, roundState);
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
function finalizeDealerTurn(session: GameSession, roundState: RoundState): RoundState {
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
  roundState.bankrollCents += outcome.netCents;
  session.bankrollCents = roundState.bankrollCents;

  session.roundState = roundState;
  updateGameSession(session);

  return roundState;
}
