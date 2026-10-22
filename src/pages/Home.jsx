import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { summarize, formatDiff, formatDate } from '../lib/format'

export default function Home() {
  const navigate = useNavigate()
  const [rounds, setRounds] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('rounds')
      .select('*, hole_scores(score, par)')
      .order('played_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRounds(data)
      })
  }, [])

  async function logOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <main className="page">
      <div className="topbar">
        <h1>My rounds</h1>
        <button className="btn btn-ghost btn-small" onClick={logOut}>Log out</button>
      </div>

      <Link to="/new" className="btn btn-primary btn-wide" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        Start new round
      </Link>

      {error && <p className="error">{error}</p>}
      {rounds === null && !error && <p className="center-note">Loading…</p>}
      {rounds && rounds.length === 0 && (
        <p className="center-note">No rounds yet. Start one and it will show up here.</p>
      )}

      {rounds && rounds.length > 0 && (
        <ul className="round-list">
          {rounds.map((r) => {
            const s = summarize(r.hole_scores)
            const inProgress = r.status === 'in_progress'
            return (
              <li key={r.id}>
                {/* In-progress rounds reopen the scorecard; finished rounds open the summary */}
                <Link className="round-link" to={inProgress ? `/round/${r.id}/play` : `/round/${r.id}`}>
                  <div>
                    <div className="round-name">
                      {r.course_name}
                      {inProgress && <span className="badge">In progress</span>}
                    </div>
                    <div className="round-meta">{formatDate(r.played_at)} · {r.num_holes} holes</div>
                  </div>
                  <div className="round-score">
                    {s.holesPlayed ? s.strokes : '–'}
                    {s.holesPlayed > 0 && <small>{formatDiff(s.diff)}</small>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
