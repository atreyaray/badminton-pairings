import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerSetup } from './components/PlayerSetup'
import { MatchesPage } from './components/MatchesPage'
import { Session } from './types'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route
            path="/"
            element={
              session ? (
                <Navigate to="/matches" replace />
              ) : (
                <PlayerSetup onSessionGenerated={setSession} />
              )
            }
          />
          <Route
            path="/matches"
            element={
              session ? (
                <MatchesPage initialSession={session} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
