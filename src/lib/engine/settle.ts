import { Card, HandResult, OutcomeResult, Rules } from '@/lib/types';
import { isBlackjack, isBust, getHandTotal } from './hand';

/**
 * Settle a single player hand against the dealer
 */
export function settleHand(
  playerCards: Card[],
  dealerCards: Card[],
  betCents: number,
  rules: Rules,
  surrendered: boolean = false
): OutcomeResult {
  // Handle surrender
  if (surrendered) {
    return {
      handIndex: 0, // Will be set by caller
      result: 'SURRENDER',
      netPayoutCents: Math.floor(-betCents / 2), // Lose half the bet
    };
  }

  const playerBust = isBust(playerCards);
  const dealerBust = isBust(dealerCards);
  const playerBlackjack = isBlackjack(playerCards);
  const dealerBlackjack = isBlackjack(dealerCards);
  const playerTotal = getHandTotal(playerCards);
  const dealerTotal = getHandTotal(dealerCards);

  // Player busts = automatic loss
  if (playerBust) {
    return {
      handIndex: 0,
      result: 'LOSS',
      netPayoutCents: -betCents,
    };
  }

  // Player blackjack
  if (playerBlackjack) {
    if (dealerBlackjack) {
      // Both have blackjack = push
      return {
        handIndex: 0,
        result: 'PUSH',
        netPayoutCents: 0,
      };
    }
    // Player blackjack wins (pays 3:2 or per rules)
    return {
      handIndex: 0,
      result: 'BJ',
      netPayoutCents: Math.floor(betCents * rules.blackjackPayout),
    };
  }

  // Dealer blackjack (and player doesn't have blackjack) = loss
  if (dealerBlackjack) {
    return {
      handIndex: 0,
      result: 'LOSS',
      netPayoutCents: -betCents,
    };
  }

  // Dealer busts (and player didn't bust) = win
  if (dealerBust) {
    return {
      handIndex: 0,
      result: 'WIN',
      netPayoutCents: betCents,
    };
  }

  // Compare totals
  if (playerTotal > dealerTotal) {
    return {
      handIndex: 0,
      result: 'WIN',
      netPayoutCents: betCents,
    };
  } else if (playerTotal < dealerTotal) {
    return {
      handIndex: 0,
      result: 'LOSS',
      netPayoutCents: -betCents,
    };
  } else {
    return {
      handIndex: 0,
      result: 'PUSH',
      netPayoutCents: 0,
    };
  }
}

/**
 * Settle all player hands against dealer
 */
export function settleAllHands(
  playerHands: Array<{ cards: Card[]; betCents: number; surrendered?: boolean }>,
  dealerCards: Card[],
  rules: Rules
): { results: OutcomeResult[]; netCents: number; message: string } {
  const results: OutcomeResult[] = [];
  let netCents = 0;

  for (let i = 0; i < playerHands.length; i++) {
    const hand = playerHands[i];
    const result = settleHand(
      hand.cards,
      dealerCards,
      hand.betCents,
      rules,
      hand.surrendered
    );
    result.handIndex = i;
    results.push(result);
    netCents += result.netPayoutCents;
  }

  // Generate message
  let message = '';
  if (results.length === 1) {
    const result = results[0];
    switch (result.result) {
      case 'BJ':
        message = 'Blackjack!';
        break;
      case 'WIN':
        message = 'You win!';
        break;
      case 'LOSS':
        message = 'Dealer wins';
        break;
      case 'PUSH':
        message = 'Push';
        break;
      case 'SURRENDER':
        message = 'Surrendered';
        break;
    }
  } else {
    const wins = results.filter((r) => r.result === 'WIN' || r.result === 'BJ').length;
    const losses = results.filter((r) => r.result === 'LOSS').length;
    const pushes = results.filter((r) => r.result === 'PUSH').length;

    if (wins > losses) {
      message = `${wins} win${wins !== 1 ? 's' : ''}, ${losses} loss${losses !== 1 ? 'es' : ''}`;
    } else if (losses > wins) {
      message = `${losses} loss${losses !== 1 ? 'es' : ''}, ${wins} win${wins !== 1 ? 's' : ''}`;
    } else {
      message = `${wins} win${wins !== 1 ? 's' : ''}, ${losses} loss${losses !== 1 ? 'es' : ''}`;
    }

    if (pushes > 0) {
      message += `, ${pushes} push${pushes !== 1 ? 'es' : ''}`;
    }
  }

  return { results, netCents, message };
}
