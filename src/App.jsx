import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import NewRound from './pages/NewRound'
import Scorecard from './pages/Scorecard'
import RoundDetail from './pages/RoundDetail'

function RequireAuth({ children }) {
  const { session } = useAuth()
  if (session === undefined) return <p className="center-note">Loading…</p>
  if (session === null) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/new" element={<RequireAuth><NewRound /></RequireAuth>} />
      <Route path="/round/:id" element={<RequireAuth><RoundDetail /></RequireAuth>} />
      <Route path="/round/:id/play" element={<RequireAuth><Scorecard /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
