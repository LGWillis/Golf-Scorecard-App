import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { summarize, formatDiff, formatDate, describeHoles } from '../lib/format'
import Logo from '../components/Logo'

export default function Home() {
  const navigate = useNavigate()
  const [rounds, setRounds] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('rounds')
      .select('*, hole_scores(score, par)')
      .order('played_on', { ascending: false })
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

  // Numbers for the stats strip. Until rounds load, these are all based on an empty list.
  const list = rounds ?? []
  const completed = list.filter((r) => r.status === 'completed')
  const full18 = completed.map((r) => summarize(r.hole_scores)).filter((s) => s.holesPlayed === 18)
  const best18 = full18.length ? Math.min(...full18.map((s) => s.strokes)) : '–'
  const courseCount = new Set(list.map((r) => r.course_name)).size

  return (
    <main className="page">
      <div className="topbar">
        <div className="brand"><Logo size={36} /><h1>My rounds</h1></div>
        <button className="btn btn-ghost btn-small" onClick={logOut}>Log out</button>
      </div>

      <Link to="/new" className="btn btn-primary btn-wide start-btn">
        Start new round
      </Link>

      {error && <p className="error">{error}</p>}
      {rounds === null && !error && <p className="center-note">Loading…</p>}
      {rounds && rounds.length === 0 && (
        <p className="center-note">No rounds yet. Start one and it will show up here.</p>
      )}

      {rounds && rounds.length > 0 && (
        <>
          <div className="stats">
            <div><span className="stat-num">{completed.length}</span><span className="stat-label">Rounds</span></div>
            <div><span className="stat-num">{best18}</span><span className="stat-label">Best 18</span></div>
            <div><span className="stat-num">{courseCount}</span><span className="stat-label">Courses</span></div>
          </div>

          <ul className="round-list">
            {rounds.map((r) => {
              const s = summarize(r.hole_scores)
              const inProgress = r.status === 'in_progress'
              const trend = s.holesPlayed ? (s.diff < 0 ? 'under' : s.diff > 0 ? 'over' : 'even') : ''
              return (
                <li key={r.id}>
                  {/* In-progress rounds reopen the scorecard; finished rounds open the summary */}
                  <Link className={`round-link ${trend}`} to={inProgress ? `/round/${r.id}/play` : `/round/${r.id}`}>
                    <div>
                      <div className="round-name">
                        {r.course_name}
                        {inProgress && <span className="badge">In progress</span>}
                      </div>
                      <div className="round-meta">{formatDate(r.played_on)} · {describeHoles(r)}</div>
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
        </>
      )}
    </main>
  )
}