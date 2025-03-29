import { useState, useEffect } from 'react'
import { Player, Match, Session } from '../types'
import { generateNextRound } from '../utils/matchGenerator'

interface MatchesPageProps {
  initialSession: Session;
}

interface PlayerStats {
  player: Player;
  doublesMatchesPlayed: number;
  singlesMatchesPlayed: number;
}

interface MatchState {
  match: Match;
  completed: boolean;
  completedAt?: number;
  round: number;
}

export function MatchesPage({ initialSession }: MatchesPageProps) {
  const [session, setSession] = useState<Session>(initialSession)
  const [matchStates, setMatchStates] = useState<MatchState[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [allCompletedMatches, setAllCompletedMatches] = useState<Match[]>([])
  const [lastCompletedMatch, setLastCompletedMatch] = useState<MatchState | null>(null)
  const [currentRound, setCurrentRound] = useState(1)

  // Initialize match states and player stats
  useEffect(() => {
    // Merge existing match states with new ones
    const updatedStates = session.matches.map(match => {
      // Check if this match already exists in matchStates
      const existingState = matchStates.find(ms => ms.match.id === match.id);
      if (existingState) {
        // Preserve the existing state (especially the 'completed' flag)
        return existingState;
      }
      // Create a new state for this match
      return {
        match,
        completed: false,
        round: currentRound
      };
    });
    
    setMatchStates(updatedStates);

    // Only initialize player stats if empty
    if (playerStats.length === 0) {
      const stats = session.players.map(player => ({
        player,
        doublesMatchesPlayed: 0,
        singlesMatchesPlayed: 0
      }));
      setPlayerStats(stats);
    }
  }, [session]);

  const handleMatchComplete = (matchId: string) => {
    const matchState = matchStates.find(ms => ms.match.id === matchId)
    if (!matchState || matchState.completed) return

    // Store the current state before updating
    setLastCompletedMatch({...matchState})

    // Update match state with completion time
    setMatchStates(prev => 
      prev.map(ms => 
        ms.match.id === matchId 
          ? { ...ms, completed: true, completedAt: Date.now() }
          : ms
      )
    )

    // Add to all completed matches
    const updatedCompletedMatches = [...allCompletedMatches, matchState.match]
    setAllCompletedMatches(updatedCompletedMatches)

    // Update player stats
    setPlayerStats(prev => 
      prev.map(stat => {
        if (matchState.match.players.some(p => p.id === stat.player.id)) {
          const isDoublesMatch = matchState.match.players.length === 4
          return {
            ...stat,
            doublesMatchesPlayed: isDoublesMatch ? stat.doublesMatchesPlayed + 1 : stat.doublesMatchesPlayed,
            singlesMatchesPlayed: !isDoublesMatch ? stat.singlesMatchesPlayed + 1 : stat.singlesMatchesPlayed
          }
        }
        return stat
      })
    )
  }

  const handleRoundComplete = () => {
    // Check if all matches in the current round are completed
    const currentRoundMatches = matchStates.filter(ms => ms.round === currentRound);
    const allMatchesCompleted = currentRoundMatches.every(ms => ms.completed);
    
    if (!allMatchesCompleted) {
      return; // Don't proceed if not all matches are completed
    }

    // Generate next round of matches
    const nextRoundMatches = generateNextRound(
      session.numberOfCourts,
      allCompletedMatches
    );

    // Update session with new matches
    setSession(prev => ({
      ...prev,
      matches: [...prev.matches, ...nextRoundMatches]
    }));

    // Create new match states for the next round
    const newMatchStates = nextRoundMatches.map(match => ({
      match,
      completed: false,
      round: currentRound + 1
    }));

    // Add new match states
    setMatchStates(prev => [...prev, ...newMatchStates]);
    
    // Increment current round
    setCurrentRound(prev => prev + 1);
  }

  const handleUndo = () => {
    if (!lastCompletedMatch) return

    // Get the match ID to undo
    const matchIdToUndo = lastCompletedMatch.match.id
    
    // Remove from all completed matches
    setAllCompletedMatches(prev => 
      prev.filter(m => m.id !== matchIdToUndo)
    )

    // Revert match state
    setMatchStates(prev => 
      prev.map(ms => 
        ms.match.id === matchIdToUndo 
          ? { ...ms, completed: false, completedAt: undefined }
          : ms
      )
    )

    // Revert player stats
    setPlayerStats(prev => 
      prev.map(stat => {
        if (lastCompletedMatch.match.players.some(p => p.id === stat.player.id)) {
          const isDoublesMatch = lastCompletedMatch.match.players.length === 4
          return {
            ...stat,
            doublesMatchesPlayed: isDoublesMatch ? Math.max(0, stat.doublesMatchesPlayed - 1) : stat.doublesMatchesPlayed,
            singlesMatchesPlayed: !isDoublesMatch ? Math.max(0, stat.singlesMatchesPlayed - 1) : stat.singlesMatchesPlayed
          }
        }
        return stat
      })
    )

    // Clear last completed match
    setLastCompletedMatch(null)
  }

  // Group matches by round
  const matchesByRound = matchStates.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchState[]>);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Matches List */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4 bg-white sticky top-0 z-10 py-3 px-1 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#222222]">Matches</h2>
            <div className="flex items-center gap-4">
              {lastCompletedMatch && (
                <button
                  onClick={handleUndo}
                  className="text-sm text-[#FF385C] hover:text-[#E61E4D] flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-transparent hover:border-[#FF385C] transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Undo Last Match
                </button>
              )}
            </div>
          </div>

          {/* Render matches grouped by round */}
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[#222222]">Round {round}</h3>
                {roundMatches.every(ms => ms.completed) && parseInt(round) === currentRound && (
                  <button
                    onClick={handleRoundComplete}
                    className="text-sm bg-[#FF385C] text-white px-4 py-2 rounded-lg hover:bg-[#E61E4D] transition-colors duration-200"
                  >
                    Start Next Round
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {roundMatches.map((matchState, index) => (
                  <div
                    key={`match-${matchState.match.id}-${matchState.completed ? 'completed' : 'pending'}`}
                    className={`p-4 rounded-lg border ${
                      matchState.completed
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#222222]">Court {matchState.match.court}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="font-medium text-[#222222]">Match {index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {matchState.match.side === 'left' ? 'Left Side' : 'Right Side'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        {matchState.match.players.slice(0, matchState.match.players.length / 2).map((player) => (
                          <span key={player.id} className="text-[#222222]">{player.name}</span>
                        ))}
                      </div>
                      <span className="text-gray-500">vs</span>
                      <div className="flex flex-col">
                        {matchState.match.players.slice(matchState.match.players.length / 2).map((player) => (
                          <span key={player.id} className="text-[#222222]">{player.name}</span>
                        ))}
                      </div>
                    </div>
                    {!matchState.completed && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleMatchComplete(matchState.match.id)}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-[#FF385C] transition-colors duration-200 bg-white border border-gray-200 rounded-lg px-3 py-1 hover:border-[#FF385C]"
                        >
                          <span>Complete Match</span>
                        </button>
                      </div>
                    )}
                    {matchState.completed && (
                      <div className="mt-2 flex justify-end items-center gap-2">
                        <svg 
                          className="w-5 h-5 text-green-500 animate-fade-in" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                        <span className="text-sm text-green-600 animate-fade-in">Completed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Player Stats - Fixed on scroll */}
        <div className="md:sticky md:top-6 self-start bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#222222]">Player Stats</h2>
          <div className="space-y-3">
            {playerStats.map((stat) => (
              <div
                key={stat.player.id}
                className="flex flex-col p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-[#222222] font-medium">{stat.player.name}</span>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-600">Doubles:</span>
                  <span className="font-medium text-[#FF385C]">
                    {stat.doublesMatchesPlayed} matches
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Singles:</span>
                  <span className="font-medium text-[#FF385C]">
                    {stat.singlesMatchesPlayed} matches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}