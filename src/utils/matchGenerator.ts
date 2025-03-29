import { Player, Match, Session } from '../types';

interface PlayerHistory {
  player: Player;
  gamesPlayed: number;
  partners: Set<string>;
  opponents: Set<string>;
}

// Track the current round number globally
let currentRound = 1;

// Keep track of player histories between rounds
const globalPlayerHistories = new Map<string, PlayerHistory>();

function createPlayerHistory(player: Player): PlayerHistory {
  return {
    player,
    gamesPlayed: 0,
    partners: new Set<string>(),
    opponents: new Set<string>(),
  };
}

function updatePlayerHistories(
  histories: Map<string, PlayerHistory>,
  match: Match
): void {
  const numPlayers = match.players.length;
  const midPoint = numPlayers / 2;

  // Update games played for all players
  match.players.forEach((player) => {
    const history = histories.get(player.id);
    if (history) {
      history.gamesPlayed++;
    }
  });

  // Update partners and opponents
  for (let i = 0; i < numPlayers; i++) {
    const player = match.players[i];
    const history = histories.get(player.id);
    if (!history) continue;

    // Players on the same side are partners
    const isFirstHalf = i < midPoint;
    const teamRange = isFirstHalf ? [0, midPoint] : [midPoint, numPlayers];

    for (let j = teamRange[0]; j < teamRange[1]; j++) {
      if (i !== j) {
        const partner = match.players[j];
        history.partners.add(partner.id);
      }
    }

    // Players on the opposite side are opponents
    const opponentRange = isFirstHalf ? [midPoint, numPlayers] : [0, midPoint];
    for (let j = opponentRange[0]; j < opponentRange[1]; j++) {
      const opponent = match.players[j];
      history.opponents.add(opponent.id);
    }
  }
}

function findLeastPlayedPlayers(
  histories: Map<string, PlayerHistory>,
  count: number
): Player[] {
  return Array.from(histories.values())
    .sort((a, b) => a.gamesPlayed - b.gamesPlayed)
    .slice(0, count)
    .map((history) => history.player);
}

function findOptimalPairing(
  players: Player[],
  histories: Map<string, PlayerHistory>
): Player[] {
  const numPlayers = players.length;
  const midPoint = numPlayers / 2;
  let bestPairing = [...players];
  let minSharedPartnerships = Infinity;

  // Try different combinations of team arrangements
  for (let i = 0; i < 100; i++) { // Limit iterations to prevent infinite loops
    const shuffled = [...players];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }

    let sharedPartnerships = 0;
    // Count previous partnerships in this arrangement
    for (let j = 0; j < midPoint; j++) {
      for (let k = j + 1; k < midPoint; k++) {
        const player1 = shuffled[j];
        const player2 = shuffled[k];
        const history1 = histories.get(player1.id);
        if (history1?.partners.has(player2.id)) {
          sharedPartnerships++;
        }
      }
    }
    for (let j = midPoint; j < numPlayers; j++) {
      for (let k = j + 1; k < numPlayers; k++) {
        const player1 = shuffled[j];
        const player2 = shuffled[k];
        const history1 = histories.get(player1.id);
        if (history1?.partners.has(player2.id)) {
          sharedPartnerships++;
        }
      }
    }

    if (sharedPartnerships < minSharedPartnerships) {
      minSharedPartnerships = sharedPartnerships;
      bestPairing = shuffled;
      if (minSharedPartnerships === 0) break; // Found optimal pairing
    }
  }

  return bestPairing;
}

function generateRound(
  players: Player[],
  numberOfCourts: number,
  playerHistories: Map<string, PlayerHistory>
): Match[] {
  const roundMatches: Match[] = [];
  const playersNeeded = numberOfCourts * 4;

  // Select all players needed for this round at once
  const selectedPlayers = findLeastPlayedPlayers(
    playerHistories,
    playersNeeded
  );

  if (selectedPlayers.length < playersNeeded) {
    return roundMatches; // Not enough players for a full round
  }

  // Shuffle all selected players together before distributing to courts
  const shuffledPlayers = [...selectedPlayers];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }

  // Distribute players to courts
  for (let court = 1; court <= numberOfCourts; court++) {
    const courtPlayers = shuffledPlayers.slice((court - 1) * 4, court * 4);
    const optimizedPlayers = findOptimalPairing(courtPlayers, playerHistories);

    const match: Match = {
      id: crypto.randomUUID(),
      players: optimizedPlayers as [Player, Player, Player, Player],
      court,
      side: Math.random() < 0.5 ? 'left' : 'right',
    };

    roundMatches.push(match);
    updatePlayerHistories(playerHistories, match);
  }

  return roundMatches;
}

export function generateSession(
  players: Player[],
  numberOfCourts: number,
  previousMatches: Match[] = []
): Session {
  if (players.length < 4) {
    throw new Error('Need at least 4 players to generate matches');
  }

  // Reset round counter and histories when starting a new session
  currentRound = 1;
  globalPlayerHistories.clear();

  // Initialize player histories
  players.forEach((player) => {
    globalPlayerHistories.set(player.id, createPlayerHistory(player));
  });

  // Update histories with previous matches
  previousMatches.forEach((match) => {
    updatePlayerHistories(globalPlayerHistories, match);
  });

  // Generate first round of matches
  const matches = generateRound(players, numberOfCourts, globalPlayerHistories);

  return {
    players,
    numberOfCourts,
    matches,
  };
}

export function generateNextRound(
  players: Player[],
  numberOfCourts: number,
  completedMatches: Match[]
): Match[] {
  // Update histories with completed matches
  completedMatches.forEach((match) => {
    updatePlayerHistories(globalPlayerHistories, match);
  });

  // Increment round number
  currentRound++;

  // Generate next round of matches
  return generateRound(players, numberOfCourts, globalPlayerHistories);
}

// Get the current round number
export function getCurrentRound(): number {
  return currentRound;
}
