import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { summarize, formatDiff, describeHoles, todayLocal } from '../lib/format'

export default function RoundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [round, setRound] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('rounds')
      .select('*, hole_scores(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) return setError(error.message)
        data.hole_scores.sort((a, b) => a.hole_number - b.hole_number)
        setRound(data)
      })
  }, [id])

  async function deleteRound() {
    if (!window.confirm('Delete this round? This can\'t be undone.')) return
    const { error } = await supabase.from('rounds').delete().eq('id', id)
    if (error) setError(error.message)
    else navigate('/')
  }

  async function changeDate(value) {
    if (!value) return
    const { error } = await supabase.from('rounds').update({ played_on: value }).eq('id', id)
    if (error) setError(error.message)
    else setRound({ ...round, played_on: value })
  }

  if (error) return <p className="center-note">{error}</p>
  if (!round) return <p className="center-note">Loading…</p>

  const s = summarize(round.hole_scores)

  return (
    <main className="page">
      <div className="topbar">
        <Link to="/" className="btn btn-ghost btn-small" style={{ textDecoration: 'none' }}>Back</Link>
      </div>

      <h1>{round.course_name}</h1>
      <p className="muted">{describeHoles(round)}</p>
      <div className="field" style={{ maxWidth: 220, marginTop: 12 }}>
        <label htmlFor="played-on">Date played</label>
        <input id="played-on" type="date" className="input" value={round.played_on}
          max={todayLocal()} onChange={(e) => changeDate(e.target.value)} />
      </div>

      <div className="totals">
        <span className="big">{s.strokes}</span>
        <span className="muted">{formatDiff(s.diff)} through {s.holesPlayed} holes</span>
      </div>

      <table className="score-table">
        <thead>
          <tr><th>Hole</th><th>Par</th><th>Score</th><th>Details</th></tr>
        </thead>
        <tbody>
          {round.hole_scores.map((h) => (
            <tr key={h.id}>
              <td>{h.hole_number}</td>
              <td>{h.par}</td>
              <td className="num">{h.score ?? '–'}</td>
              <td className="notes">{h.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="actions">
        <Link to={`/round/${id}/play`} className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>Edit round</Link>
        <button className="btn btn-danger" onClick={deleteRound}>Delete round</button>
      </div>
    </main>
  )
}
