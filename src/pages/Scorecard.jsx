import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { summarize, formatDiff } from '../lib/format'

const PAR_OPTIONS = [3, 4, 5, 6]

export default function Scorecard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [round, setRound] = useState(null)
  const [holes, setHoles] = useState([])
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: r, error: rErr } = await supabase.from('rounds').select('*').eq('id', id).single()
      const { data: h, error: hErr } = await supabase
        .from('hole_scores').select('*').eq('round_id', id).order('hole_number')
      if (rErr || hErr) return setError((rErr || hErr).message)

      setRound(r)
      setHoles(h)
      // Resume at the first hole without a score (in-progress rounds only)
      if (r.status === 'in_progress') {
        const next = h.findIndex((x) => x.score === null)
        setIndex(next === -1 ? h.length - 1 : next)
      }
    }
    load()
  }, [id])

  if (error) return <p className="center-note">{error}</p>
  if (!round) return <p className="center-note">Loading…</p>

  const hole = holes[index]
  const isFirst = index === 0
  const isLast = index === holes.length - 1
  const isEditing = round.status === 'completed'
  const { diff, holesPlayed } = summarize(holes)

  function update(patch) {
    setHoles((prev) => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)))
  }

  function setScore(value) {
    if (value === '') return update({ score: null })
    const n = parseInt(value, 10)
    if (Number.isNaN(n)) return
    update({ score: Math.min(20, Math.max(1, n)) })
  }

  function bump(amount) {
    // First tap on + starts at the hole's par, which is the most common score
    const current = hole.score ?? hole.par - (amount > 0 ? 1 : 0)
    update({ score: Math.min(20, Math.max(1, current + amount)) })
  }

  async function saveHole() {
    const { error } = await supabase
      .from('hole_scores')
      .update({ score: hole.score, par: hole.par, notes: hole.notes })
      .eq('id', hole.id)
    if (error) throw error
  }

  async function go(step) {
    setBusy(true)
    setError('')
    try {
      await saveHole()
      setIndex(index + step)
    } catch (err) {
      setError(`Couldn't save: ${err.message}`)
    }
    setBusy(false)
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await saveHole()
      const { error } = await supabase.from('rounds').update({ status: 'completed' }).eq('id', id)
      if (error) throw error
      navigate(`/round/${id}`)
    } catch (err) {
      setError(`Couldn't save: ${err.message}`)
      setBusy(false)
    }
  }

  async function discard() {
    if (!window.confirm('Discard this round? This permanently deletes it.')) return
    await supabase.from('rounds').delete().eq('id', id)
    navigate('/')
  }

  return (
    <div className="play">
      <header className="play-top">
        <div>
          <div className="play-course">{round.course_name}</div>
          {holesPlayed > 0 && <div className="play-running">Through {holesPlayed}: {formatDiff(diff)}</div>}
        </div>
        {isEditing ? (
          <button className="btn btn-ghost btn-small" onClick={() => navigate(`/round/${id}`)}>Exit</button>
        ) : (
          <button className="btn btn-danger btn-small" onClick={discard}>Discard round</button>
        )}
      </header>

      <main className="play-body">
        <div className="hole-number">{hole.hole_number}</div>
        <div className="hole-of">
          {round.num_holes === 9
          ? `${round.start_hole === 10 ? 'Back' : 'Front'} nine · ${index + 1} of ${holes.length}`
          : `Hole ${hole.hole_number} of ${holes.length}`}
        </div>

        <div className="label">Par</div>
        <div className="par-seg">
          {PAR_OPTIONS.map((p) => (
            <button key={p} aria-pressed={hole.par === p} onClick={() => update({ par: p })}>{p}</button>
          ))}
        </div>

        <div className="label">Score</div>
        <div className="stepper">
          <button className="step-btn" aria-label="Decrease score" onClick={() => bump(-1)}>−</button>
          <input
            className="score-input"
            type="number"
            inputMode="numeric"
            aria-label="Score"
            value={hole.score ?? ''}
            placeholder="–"
            onChange={(e) => setScore(e.target.value)}
          />
          <button className="step-btn" aria-label="Increase score" onClick={() => bump(1)}>+</button>
        </div>

        <div className="label">Details</div>
        <textarea
          className="textarea"
          placeholder="Club used, hazards, putts, anything you want to remember"
          value={hole.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
        {error && <p className="error">{error}</p>}
      </main>

      <footer className="play-bottom">
        {isFirst ? <span className="spacer" /> : (
          <button className="btn btn-ghost" disabled={busy} onClick={() => go(-1)}>Previous</button>
        )}
        {isLast ? (
          <button className="btn btn-primary" disabled={busy} onClick={finish}>
            {isEditing ? 'Save changes' : 'Finish round'}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={busy} onClick={() => go(1)}>Next</button>
        )}
      </footer>
    </div>
  )
}
