import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchCourses, getCoursePars } from '../lib/courseApi'

export default function NewRound() {
  const navigate = useNavigate()
  const [manual, setManual] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [manualName, setManualName] = useState('')
  const [numHoles, setNumHoles] = useState(18)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
  const canStart = Boolean(courseName) && !starting

  async function startRound() {
    setError('')
    setStarting(true)

    // Default to par 4 everywhere. Used for manual courses, or when the API has no scorecard.
    let pars = Array(numHoles).fill(4)
    if (!manual && selected) {
      const apiPars = await getCoursePars(selected.id)
      if (apiPars && apiPars.length >= numHoles) {
        pars = apiPars.slice(0, numHoles)
      } else {
        setNotice('No scorecard found for this course, so every hole starts at par 4. You can change the par on each hole.')
      }
    }

    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        course_name: courseName,
        course_api_id: manual ? null : selected.id,
        num_holes: numHoles,
      })
      .select()
      .single()

    if (roundError) {
      setError(roundError.message)
      setStarting(false)
      return
    }

    const holeRows = pars.map((par, i) => ({ round_id: round.id, hole_number: i + 1, par }))
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
    <main className="page">
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

      {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}
      {notice && <p className="muted" style={{ marginTop: 16 }}>{notice}</p>}

      <button className="btn btn-primary btn-wide" style={{ marginTop: 24 }} disabled={!canStart} onClick={startRound}>
        {starting ? 'Starting…' : 'Start round'}
      </button>
    </main>
  )
}
