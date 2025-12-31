# Blackjack Online

A modern, guest-first blackjack web application built with Next.js, React, and TypeScript.

## Tech Stack

- **Framework**: Next.js (App Router) with React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animation**: Framer Motion
- **Testing**: Jest

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test:watch
```

## Build

```bash
npm run build
npm start
```

## Project Structure

### Engine (`src/lib/engine/`)

The blackjack game engine is implemented as pure functions for maximum testability and reliability.

#### Core Modules

- **`shoe.ts`**: Shoe management
  - `createShoe(numDecks)` - Create a new shoe with N decks
  - `shuffleShoe(shoe)` - Fisher-Yates shuffle algorithm
  - `drawCard(shoe)` - Draw a single card
  - `drawCards(shoe, count)` - Draw multiple cards
  - `shouldReshuffle(shoe, threshold)` - Check if shoe needs reshuffling
  - `getRemainingCards(shoe)` - Get remaining card count

- **`hand.ts`**: Hand evaluation
  - `calculateHandTotal(cards)` - Calculate total with ace logic (soft/hard)
  - `isBlackjack(cards)` - Detect natural blackjack
  - `isBust(cards)` - Check if hand is bust (>21)
  - `canSplitCards(cards)` - Check if cards can be split

- **`rules.ts`**: Legal action determination
  - `getLegalActions(hand, dealer, rules, ...)` - Derive available actions
  - Handles HIT, STAND, DOUBLE, SPLIT, INSURANCE, SURRENDER
  - Enforces bankroll constraints and rule variations

- **`dealer.ts`**: Dealer play logic
  - `shouldDealerHit(cards, rules)` - Determine if dealer should hit
  - `playDealerHand(initialCards, rules, drawCard)` - Execute dealer turn
  - Implements S17 (Stand on Soft 17) and H17 (Hit on Soft 17) rules

- **`settle.ts`**: Payout calculation
  - `settleHand(playerCards, dealerCards, betCents, rules)` - Settle single hand
  - `settleAllHands(playerHands, dealerCards, rules)` - Settle multiple hands (splits)
  - Handles blackjack (3:2 payout), wins, losses, pushes, surrender

### Types (`src/lib/types/`)

Shared type definitions for the entire application:

- **`card.ts`**: Card types (Rank, Suit, Card)
- **`rules.ts`**: Game rules configuration
- **`round-state.ts`**: Complete round state for rendering

## Game Rules (MVP)

- **Decks**: 6-deck shoe
- **Dealer**: Stands on soft 17 (S17)
- **Blackjack**: Pays 3:2
- **Double**: Allowed on any first two cards
- **Split**: Once only (no resplit), split aces receive 1 card each
- **Insurance**: Disabled (Phase 1+)
- **Surrender**: Disabled (Phase 1+)

## Server Architecture

### Cookies & Sessions

The application uses two types of cookies for state management:

#### 1. Player Identity Cookie (`player_token`)
- **Purpose**: Anonymous player identity
- **Type**: Signed, httpOnly
- **Lifetime**: 1 year
- **Payload**: `{ playerId: UUID, v: number, issuedAt: timestamp }`
- **Security**: HMAC-SHA256 signed to prevent tampering
- **Note**: Client cannot choose playerId (prevents spoofing)

#### 2. Game Session Cookie (`game_session`)
- **Purpose**: Short-lived game state
- **Type**: Signed, httpOnly
- **Lifetime**: 1 hour
- **Payload**: `{ sessionId: UUID, issuedAt: timestamp }`
- **Storage**: In-memory Map on server
- **Contains**: Shoe state, round state, bankroll, rules, UI preferences
- **TTL**: Stale sessions (>1 hour) are cleaned up automatically

### Session Store

The in-memory session store maintains:
- **Shoe**: Persistent across rounds until reshuffle threshold
- **Round State**: Current game state (null when no active round)
- **Bankroll**: Player's current balance (in cents)
- **Rules**: Game rules configuration
- **UI Preferences**: Sound, animations, etc.

## API Endpoints

### POST `/api/identity`

Create or load anonymous player identity.

**Request**: No body required

**Response**:
```json
{
  "playerId": "550e8400-e29b-41d4-a716-446655440000",
  "bankrollCents": 100000,
  "rules": {
    "numDecks": 6,
    "dealerHitsSoft17": false,
    "blackjackPayout": 1.5,
    ...
  },
  "uiPrefs": {
    "soundEnabled": true,
    "animationsEnabled": true
  }
}
```

**Cookies Set**:
- `player_token` (if new player)
- `game_session` (if new session)

---

### POST `/api/round/deal`

Start a new round with the specified bet.

**Request**:
```json
{
  "betCents": 1000
}
```

**Validation**:
- `betCents` must be integer between 100 and 10000
- `betCents` must not exceed `bankrollCents`

**Response**: `RoundState` object
```json
{
  "phase": "PLAYER_TURN",
  "bankrollCents": 99000,
  "baseBetCents": 1000,
  "dealer": {
    "cards": [{"rank": "K", "suit": "H"}, {"rank": "?", "suit": "?"}],
    "total": null,
    "holeRevealed": false
  },
  "playerHands": [
    {
      "cards": [{"rank": "A", "suit": "S"}, {"rank": "10", "suit": "D"}],
      "total": 21,
      "soft": true,
      "betCents": 1000,
      "status": "BLACKJACK"
    }
  ],
  "activeHandIndex": 0,
  "legalActions": ["HIT", "STAND", "DOUBLE"],
  "outcome": null
}
```

**Errors**:
- `400`: Invalid bet or insufficient bankroll

---

### POST `/api/round/action`

Apply a player action to the current round.

**Request**:
```json
{
  "action": "HIT",
  "handIndex": 0
}
```

**Valid Actions**: `HIT`, `STAND`, `DOUBLE`, `SPLIT`, `SURRENDER`

**Validation**:
- Action must be in `roundState.legalActions`
- `handIndex` must equal `roundState.activeHandIndex`
- Must have an active round

**Response**: Updated `RoundState` object

**Errors**:
- `400`: No active round, invalid action, or illegal action

---

### GET `/api/round/state`

Get current round state (for refresh recovery).

**Request**: No body required

**Response**:
```json
{
  "roundState": { /* RoundState or null */ },
  "bankrollCents": 99000
}
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
PLAYER_TOKEN_SECRET=your-secret-key-min-32-chars
GAME_SESSION_SECRET=your-game-session-secret-min-32-chars
DEFAULT_BANKROLL_CENTS=100000
MIN_BET_CENTS=100
MAX_BET_CENTS=10000
```

**Generate secrets**:
```bash
openssl rand -base64 32
```

## Development Phases

### Phase A ✅ - Scaffold + Types
- Next.js project setup
- TypeScript configuration
- Shared type definitions

### Phase B ✅ - Engine + Tests
- Pure function game engine
- Comprehensive unit tests
- Coverage: totals, aces, blackjack, S17, split, double, settlement

### Phase C ✅ - Server Sessions + API
- Cookie-based anonymous identity
- In-memory game session store
- API routes: `/api/identity`, `/api/round/deal`, `/api/round/action`, `/api/round/state`
- Server-authoritative game flow with validation

### Phase D - UI
- Table layout and components
- Bet controls and action buttons
- Keyboard shortcuts
- Framer Motion animations

### Phase E - Persistence (V1)
- Prisma + Neon Postgres
- Bankroll + stats per player
- Hand history

### Phase F - Leaderboards
- Leaderboard entries
- Recompute job

## License

Private project - All rights reserved
