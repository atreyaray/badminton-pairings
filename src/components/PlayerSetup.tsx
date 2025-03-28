import { useState } from 'react'
import { Player, Session } from '../types'
import { generateSession } from '../utils/matchGenerator'

interface PlayerSetupProps {
  onSessionGenerated: (session: Session) => void;
}

export function PlayerSetup({ onSessionGenerated }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [numberOfCourts, setNumberOfCourts] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: newPlayerName.trim()
      }
      setPlayers([...players, newPlayer])
      setNewPlayerName('')
      setError(null)
    }
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-[#222222]">
        Badminton Match Generator
      </h1>
      
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Courts
          </label>
          <select
            value={numberOfCourts}
            onChange={(e) => setNumberOfCourts(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
          >
            <option value={1}>1 Court</option>
            <option value={2}>2 Courts</option>
          </select>
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
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

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
  )
} 