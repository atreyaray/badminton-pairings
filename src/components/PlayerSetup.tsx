import { useState } from 'react'
import { Player, Session } from '../types'
import { generateSession } from '../utils/matchGenerator'
import { Header } from './Header'

interface PlayerSetupProps {
  onSessionGenerated: (session: Session) => void;
}

export function PlayerSetup({ onSessionGenerated }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [numberOfCourts, setNumberOfCourts] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const showTemporaryError = (message: string) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (trimmedName) {
      if (players.some(player => player.name.toLowerCase() === trimmedName.toLowerCase())) {
        showTemporaryError(`${trimmedName} is already in the list`);
        return;
      }
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: trimmedName
      }
      setPlayers([...players, newPlayer])
      setNewPlayerName('')
      setError(null)
    }
  }

  const addPlayerByName = (name: string) => {
    if (players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
      showTemporaryError(`${name} is already in the list`);
      return;
    }
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name
    }
    setPlayers([...players, newPlayer])
    setError(null)
  }

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(player => player.id !== playerId))
    setError(null)
  }

  const generateMatches = () => {
    try {
      const session = generateSession(players, numberOfCourts)
      onSessionGenerated(session)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate matches')
    }
  }

  // Common players
  const commonPlayers = [
    'Ray', 'Selin', 'Long', 'Aayush',
    'Ankita', 'Rajat', 'Vivaan', 'Michael'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#222222]">Add Players</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Enter player name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
            />
            <button
              onClick={addPlayer}
              className="px-6 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#E61E4D] focus:outline-none focus:ring-2 focus:ring-[#FF385C] whitespace-nowrap"
            >
              Add Player
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Quick add player buttons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Add Players</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonPlayers.filter(name => name).map((name) => (
                <button
                  key={name}
                  onClick={() => addPlayerByName(name)}
                  className="px-4 py-2 bg-white border border-gray-300 text-[#222222] rounded-lg 
                            hover:bg-[#FFF8F6] hover:border-[#FF385C] hover:text-[#FF385C] 
                            focus:outline-none focus:ring-2 focus:ring-[#FF385C] 
                            transition-all duration-200 transform hover:scale-105"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Courts
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNumberOfCourts(1)}
                className={`px-4 py-2 rounded-lg border ${
                  numberOfCourts === 1
                    ? 'bg-[#FF385C] text-white border-[#FF385C]'
                    : 'bg-white border-gray-300 text-[#222222] hover:bg-[#FFF8F6] hover:border-[#FF385C] hover:text-[#FF385C]'
                } focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition-all duration-200 transform hover:scale-105`}
              >
                1 Court
              </button>
              <button
                onClick={() => setNumberOfCourts(2)}
                className={`px-4 py-2 rounded-lg border ${
                  numberOfCourts === 2
                    ? 'bg-[#FF385C] text-white border-[#FF385C]'
                    : 'bg-white border-gray-300 text-[#222222] hover:bg-[#FFF8F6] hover:border-[#FF385C] hover:text-[#FF385C]'
                } focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition-all duration-200 transform hover:scale-105`}
              >
                2 Courts
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-[#222222]">{player.name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-[#FF385C] hover:text-[#E61E4D]"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-[#222222] font-medium">Total Players</span>
                <span className="text-[#FF385C] font-semibold">{players.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={generateMatches}
            disabled={players.length < 4}
            className={`w-full px-4 py-2 rounded-lg text-white ${
              players.length < 4
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF385C] hover:bg-[#E61E4D]'
            } focus:outline-none focus:ring-2 focus:ring-[#FF385C]`}
          >
            Generate Matches
          </button>
        </div>
      </div>
    </div>
  )
} 