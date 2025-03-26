import { Player, Match, Session } from '../types'

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Tracks player pairings - used to avoid repeating the same matchups
interface PlayerPairing {
  player1Id: string;
  player2Id: string;
  count: number;
}

interface PlayerParticipation {
  player: Player;
  doublesMatchesPlayed: number;
  singlesMatchesPlayed: number;
  lastPlayed?: number; // timestamp of last match
  partners: Set<string>; // IDs of partners this player has played with
  opponents: Set<string>; // IDs of opponents this player has played against
}

// Helper function to get all player pairings from previous matches
function getPairings(matches: Match[]): PlayerPairing[] {
  const pairings: PlayerPairing[] = [];
  const pairingMap = new Map<string, number>();
  
  matches.forEach(match => {
    if (match.players.length === 4) {
      // Get teams
      const team1 = [match.players[0], match.players[1]];
      const team2 = [match.players[2], match.players[3]];
      
      // Add partner pairings (teammates)
      addPairing(pairingMap, team1[0].id, team1[1].id);
      addPairing(pairingMap, team2[0].id, team2[1].id);
      
      // Add opponent pairings
      team1.forEach(p1 => {
        team2.forEach(p2 => {
          addPairing(pairingMap, p1.id, p2.id);
        });
      });
    }
  });
  
  // Convert map to array
  pairingMap.forEach((count, key) => {
    const [player1Id, player2Id] = key.split('-');
    pairings.push({ player1Id, player2Id, count });
  });
  
  return pairings;
}

// Helper function to add a pairing to the map
function addPairing(map: Map<string, number>, player1Id: string, player2Id: string) {
  // Ensure consistent key order regardless of input order
  const pairingKey = [player1Id, player2Id].sort().join('-');
  map.set(pairingKey, (map.get(pairingKey) || 0) + 1);
}

// Calculate a score for a pair of players based on their history
function calculatePairScore(
  player1: Player,
  player2: Player,
  pairings: PlayerPairing[],
  participationMap: Map<string, PlayerParticipation>
): number {
  // Get how many times they've played together
  const pairingKey = [player1.id, player2.id].sort().join('-');
  const pairing = pairings.find(p => {
    const key = [p.player1Id, p.player2Id].sort().join('-');
    return key === pairingKey;
  });
  
  // Get participation scores
  const p1 = participationMap.get(player1.id);
  const p2 = participationMap.get(player2.id);
  
  // Get total matches played
  const p1Matches = p1 ? p1.doublesMatchesPlayed + p1.singlesMatchesPlayed : 0;
  const p2Matches = p2 ? p2.doublesMatchesPlayed + p2.singlesMatchesPlayed : 0;
  
  // Calculate score (lower is better for new pairings)
  // We prioritize players who:
  // 1. Have played together less often (weight: 10x)
  // 2. Have lower overall participation
  return (pairing?.count || 0) * 10 + p1Matches + p2Matches;
}

function generateDoublesMatches(
  players: Player[],
  numberOfCourts: number,
  previousMatches: Match[] = []
): Match[] {
  const matches: Match[] = [];
  const participation: PlayerParticipation[] = players.map(player => ({
    player,
    doublesMatchesPlayed: 0,
    singlesMatchesPlayed: 0,
    partners: new Set<string>(),
    opponents: new Set<string>()
  }));
  
  // Create a map for faster lookups
  const participationMap = new Map<string, PlayerParticipation>();
  participation.forEach(p => participationMap.set(p.player.id, p));

  // Get all player pairings from previous matches
  const pairings = getPairings(previousMatches);

  // Count previous participations and record partnerships
  previousMatches.forEach(match => {
    // Handle doubles matches
    if (match.players.length === 4) {
      // Team 1
      const player1 = participationMap.get(match.players[0].id);
      const player2 = participationMap.get(match.players[1].id);
      
      // Team 2
      const player3 = participationMap.get(match.players[2].id);
      const player4 = participationMap.get(match.players[3].id);
      
      if (player1 && player2) {
        player1.partners.add(player2.player.id);
        player2.partners.add(player1.player.id);
      }
      
      if (player3 && player4) {
        player3.partners.add(player4.player.id);
        player4.partners.add(player3.player.id);
      }
      
      // Record opponents
      [player1, player2].forEach(p1 => {
        if (p1) {
          [player3, player4].forEach(p2 => {
            if (p2) {
              p1.opponents.add(p2.player.id);
              p2.opponents.add(p1.player.id);
            }
          });
        }
      });
    }

    // Update match counts
    match.players.forEach(player => {
      const playerParticipation = participationMap.get(player.id);
      if (playerParticipation) {
        if (match.players.length === 4) {
          playerParticipation.doublesMatchesPlayed++;
        } else {
          playerParticipation.singlesMatchesPlayed++;
        }
        playerParticipation.lastPlayed = Date.now();
      }
    });
  });

  // Sort players by total participation (least played first)
  const sortedPlayers = [...players].sort((a, b) => {
    const aParticipation = participationMap.get(a.id);
    const bParticipation = participationMap.get(b.id);
    const aTotal = aParticipation 
      ? aParticipation.doublesMatchesPlayed + aParticipation.singlesMatchesPlayed 
      : 0;
    const bTotal = bParticipation 
      ? bParticipation.doublesMatchesPlayed + bParticipation.singlesMatchesPlayed 
      : 0;
    return aTotal - bTotal;
  });

  // Handle different player count scenarios
  if (players.length === 4) {
    // Simple 2v2
    matches.push({
      id: crypto.randomUUID(),
      players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
      court: 1,
      side: 'left',
    });
  } else if (players.length === 5) {
    // 2v2 with one player sitting out (choose the player who has played the most)
    matches.push({
      id: crypto.randomUUID(),
      players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
      court: 1,
      side: 'left',
    });
  } else if (players.length === 6) {
    if (numberOfCourts === 1) {
      // 2v2 with two players sitting out
      matches.push({
        id: crypto.randomUUID(),
        players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
        court: 1,
        side: 'left',
      });
    } else {
      // 2v2 on one court, 1v1 on another
      // Prioritize players who have played fewer singles matches for the singles match
      const singlesPlayers = sortedPlayers.slice(4).sort((a, b) => {
        const aParticipation = participationMap.get(a.id);
        const bParticipation = participationMap.get(b.id);
        const aSingles = aParticipation ? aParticipation.singlesMatchesPlayed : 0;
        const bSingles = bParticipation ? bParticipation.singlesMatchesPlayed : 0;
        return aSingles - bSingles;
      });

      matches.push({
        id: crypto.randomUUID(),
        players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
        court: 1,
        side: 'left',
      });
      matches.push({
        id: crypto.randomUUID(),
        players: [singlesPlayers[0], singlesPlayers[1]],
        court: 2,
        side: 'left',
      });
    }
  } else if (players.length === 7) {
    if (numberOfCourts === 1) {
      // 2v2 with three players sitting out
      matches.push({
        id: crypto.randomUUID(),
        players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
        court: 1,
        side: 'left',
      });
    } else {
      // 2v2 on one court, 2v1 on another
      // Prioritize players who have played fewer singles matches for the singles match
      const singlesPlayers = sortedPlayers.slice(4).sort((a, b) => {
        const aParticipation = participationMap.get(a.id);
        const bParticipation = participationMap.get(b.id);
        const aSingles = aParticipation ? aParticipation.singlesMatchesPlayed : 0;
        const bSingles = bParticipation ? bParticipation.singlesMatchesPlayed : 0;
        return aSingles - bSingles;
      });

      matches.push({
        id: crypto.randomUUID(),
        players: [sortedPlayers[0], sortedPlayers[1], sortedPlayers[2], sortedPlayers[3]],
        court: 1,
        side: 'left',
      });
      matches.push({
        id: crypto.randomUUID(),
        players: [singlesPlayers[0], singlesPlayers[1], singlesPlayers[2]],
        court: 2,
        side: 'left',
      });
    }
  } else if (players.length === 8) {
    // For 8 players and 2 courts, we want to create 2 teams of 2v2
    // with fair distribution of players and minimal repetition
    
    // Step 1: Create all possible pairs (28 combinations)
    const allPossiblePairs: [Player, Player][] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        allPossiblePairs.push([players[i], players[j]]);
      }
    }
    
    // Step 2: Score each pair based on how often they've played together
    // and their total participation
    const scoredPairs = allPossiblePairs.map(pair => ({
      pair,
      score: calculatePairScore(pair[0], pair[1], pairings, participationMap)
    }));
    
    // Step 3: Sort pairs by score (lower score is better - less frequent pairings)
    scoredPairs.sort((a, b) => a.score - b.score);
    
    // Step 4: Pick the 4 best pairs (least frequent combinations)
    const selectedPairs = scoredPairs.slice(0, 4);
    
    // Step 5: Determine which players are in each pair
    const usedPlayerIds = new Set<string>();
    const finalPairs: [Player, Player][] = [];
    
    for (const {pair} of selectedPairs) {
      if (!usedPlayerIds.has(pair[0].id) && !usedPlayerIds.has(pair[1].id)) {
        finalPairs.push(pair);
        usedPlayerIds.add(pair[0].id);
        usedPlayerIds.add(pair[1].id);
        
        // Break when we've found 4 pairs
        if (finalPairs.length === 4) {
          break;
        }
      }
    }
    
    // If we couldn't find 4 non-overlapping pairs, fall back to random selection
    if (finalPairs.length < 4) {
      const remainingPlayers = players.filter(p => !usedPlayerIds.has(p.id));
      if (remainingPlayers.length >= 2) {
        // For remaining players, create random pairs
        const shuffledRemaining = shuffleArray(remainingPlayers);
        for (let i = 0; i < shuffledRemaining.length - 1; i += 2) {
          finalPairs.push([shuffledRemaining[i], shuffledRemaining[i+1]]);
          if (finalPairs.length === 4) break;
        }
      }
    }
    
    // If we still don't have 4 pairs, use a fallback approach
    if (finalPairs.length < 4) {
      const shuffledPlayers = shuffleArray(players);
      finalPairs.length = 0; // Reset pairs
      
      // Create 4 pairs from shuffled players
      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        finalPairs.push([shuffledPlayers[i], shuffledPlayers[i+1]]);
      }
    }
    
    // Step 6: Arrange the pairs into two matches with optimal team distribution
    // Try to ensure teams haven't played together before when possible
    
    // Get scores for pair combinations
    const [pair1, pair2, pair3, pair4] = finalPairs;
    
    // Option 1: (pair1 + pair2) vs (pair3 + pair4)
    const option1Score = 
      calculatePairScore(pair1[0], pair1[1], pairings, participationMap) + 
      calculatePairScore(pair2[0], pair2[1], pairings, participationMap) +
      calculatePairScore(pair3[0], pair3[1], pairings, participationMap) +
      calculatePairScore(pair4[0], pair4[1], pairings, participationMap);
    
    // Option 2: (pair1 + pair3) vs (pair2 + pair4)
    const option2Score = 
      calculatePairScore(pair1[0], pair3[0], pairings, participationMap) + 
      calculatePairScore(pair1[1], pair3[1], pairings, participationMap) +
      calculatePairScore(pair2[0], pair4[0], pairings, participationMap) +
      calculatePairScore(pair2[1], pair4[1], pairings, participationMap);
    
    // Option 3: (pair1 + pair4) vs (pair2 + pair3)
    const option3Score = 
      calculatePairScore(pair1[0], pair4[0], pairings, participationMap) + 
      calculatePairScore(pair1[1], pair4[1], pairings, participationMap) +
      calculatePairScore(pair2[0], pair3[0], pairings, participationMap) +
      calculatePairScore(pair2[1], pair3[1], pairings, participationMap);
    
    let court1Players: Player[];
    let court2Players: Player[];
    
    // Choose the option with the lowest score
    if (option1Score <= option2Score && option1Score <= option3Score) {
      // Option 1 is best
      court1Players = [pair1[0], pair1[1], pair2[0], pair2[1]];
      court2Players = [pair3[0], pair3[1], pair4[0], pair4[1]];
    } else if (option2Score <= option1Score && option2Score <= option3Score) {
      // Option 2 is best
      court1Players = [pair1[0], pair1[1], pair3[0], pair3[1]];
      court2Players = [pair2[0], pair2[1], pair4[0], pair4[1]];
    } else {
      // Option 3 is best
      court1Players = [pair1[0], pair1[1], pair4[0], pair4[1]];
      court2Players = [pair2[0], pair2[1], pair3[0], pair3[1]];
    }

    // Create the matches
    matches.push({
      id: crypto.randomUUID(),
      players: [court1Players[0], court1Players[1], court1Players[2], court1Players[3]],
      court: 1,
      side: 'left',
    });

    matches.push({
      id: crypto.randomUUID(),
      players: [court2Players[0], court2Players[1], court2Players[2], court2Players[3]],
      court: 2,
      side: 'left',
    });
  }

  return matches;
}

export function generateSession(
  players: Player[],
  numberOfCourts: number,
  previousMatches: Match[] = []
): Session {
  if (players.length < 4) {
    throw new Error('Need at least 4 players to generate matches');
  }

  const matches = generateDoublesMatches(players, numberOfCourts, previousMatches);

  return {
    players,
    numberOfCourts,
    matches,
  };
} 