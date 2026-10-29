import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchCourses, getCoursePars } from '../lib/courseApi'
import { todayLocal } from '../lib/format'

export default function NewRound() {
  const navigate = useNavigate()
  const [manual, setManual] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [manualName, setManualName] = useState('')
  const [numHoles, setNumHoles] = useState(18)
  const [nine, setNine] = useState('front') // 'front' | 'back', only used for 9 holes
  const [playedOn, setPlayedOn] = useState(todayLocal())
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setError('')
    setSearching(true)
    setSelected(null)
    try {
      setResults(await searchCourses(query.trim()))
    } catch (err) {
      setError(err.message)
      setResults(null)
    }
    setSearching(false)
  }

  const courseName = manual ? manualName.trim() : selected?.name
  const canStart = Boolean(courseName) && Boolean(playedOn) && !starting

  async function startRound() {
    setError('')
    setStarting(true)

    const startHole = numHoles === 9 && nine === 'back' ? 10 : 1

    // Default to par 4 everywhere. Used for manual courses, or when the API has no scorecard.
    let pars = Array(numHoles).fill(4)
    if (!manual && selected) {
      const apiPars = await getCoursePars(selected.id)
      const slice = apiPars ? apiPars.slice(startHole - 1, startHole - 1 + numHoles) : []
      if (slice.length === numHoles) pars = slice
    }

    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        course_name: courseName,
        course_api_id: manual ? null : selected.id,
        num_holes: numHoles,
        start_hole: startHole,
        played_on: playedOn,
      })
      .select()
      .single()

    if (roundError) {
      setError(roundError.message)
      setStarting(false)
      return
    }

    const holeRows = pars.map((par, i) => ({
      round_id: round.id,
      hole_number: startHole + i,
      par,
    }))
    const { error: holesError } = await supabase.from('hole_scores').insert(holeRows)

    if (holesError) {
      await supabase.from('rounds').delete().eq('id', round.id) // don't leave an empty round behind
      setError(holesError.message)
      setStarting(false)
      return
    }

    navigate(`/round/${round.id}/play`)
  }

  return (
    <main className="page page-narrow">
      <div className="topbar">
        <h1>New round</h1>
        <Link to="/" className="btn btn-ghost btn-small" style={{ textDecoration: 'none' }}>Cancel</Link>
      </div>

      {!manual ? (
        <>
          <form onSubmit={handleSearch}>
            <label className="label" htmlFor="course-search" style={{ marginTop: 0 }}>Find your course</label>
            <div className="row">
              <input id="course-search" className="input" placeholder="Course name"
                value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn btn-primary" disabled={searching}>{searching ? '…' : 'Search'}</button>
            </div>
          </form>

          {results && results.length === 0 && <p className="muted" style={{ marginTop: 12 }}>No courses found.</p>}
          {results && results.length > 0 && (
            <ul className="result-list">
              {results.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <button className="result-btn" aria-pressed={selected?.id === c.id} onClick={() => setSelected(c)}>
                    <strong>{c.name}</strong>
                    {(c.city || c.state) && <div className="round-meta">{[c.city, c.state].filter(Boolean).join(', ')}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="link-btn" onClick={() => { setManual(true); setSelected(null) }}>
            Can't find it? Enter the course manually
          </button>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor="manual-name">Course name</label>
            <input id="manual-name" className="input" value={manualName} onChange={(e) => setManualName(e.target.value)} />
          </div>
          <p className="muted" style={{ marginBottom: 12 }}>Every hole will start at par 4. You can change the par on each hole as you play.</p>
          <button className="link-btn" onClick={() => setManual(false)}>Back to course search</button>
        </>
      )}

      <p className="label">How many holes?</p>
      <div className="seg">
        {[9, 18].map((n) => (
          <button key={n} aria-pressed={numHoles === n} onClick={() => setNumHoles(n)}>{n}</button>
        ))}
      </div>

      {numHoles === 9 && (
        <>
          <p className="label">Which nine?</p>
          <div className="seg">
            <button aria-pressed={nine === 'front'} onClick={() => setNine('front')}>Front 9</button>
            <button aria-pressed={nine === 'back'} onClick={() => setNine('back')}>Back 9</button>
          </div>
        </>
      )}

      <div className="field" style={{ marginTop: 18 }}>
        <label htmlFor="played-on">Date played</label>
        <input id="played-on" type="date" className="input" value={playedOn}
          max={todayLocal()} onChange={(e) => setPlayedOn(e.target.value)} />
      </div>

      {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

      <button className="btn btn-primary btn-wide" style={{ marginTop: 24 }} disabled={!canStart} onClick={startRound}>
        {starting ? 'Starting…' : 'Start round'}
      </button>
    </main>
  )
}