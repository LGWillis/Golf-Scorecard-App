// Totals only count holes that have a score, so in-progress rounds read correctly.
export function summarize(holes = []) {
  const scored = holes.filter((h) => h.score !== null && h.score !== undefined)
  const strokes = scored.reduce((sum, h) => sum + h.score, 0)
  const parPlayed = scored.reduce((sum, h) => sum + h.par, 0)
  return { strokes, parPlayed, diff: strokes - parPlayed, holesPlayed: scored.length }
}

export function formatDiff(diff) {
  if (diff === 0) return 'E'
  return diff > 0 ? `+${diff}` : `${diff}`
}

export function scoreShape(score, par) {
  if (score === null || score === undefined) return ''
  const d = score - par
  if (d <= -2) return 'shape-eagle'   // double circle
  if (d === -1) return 'shape-birdie' // circle
  if (d === 1) return 'shape-bogey'   // square
  if (d >= 2) return 'shape-double'   // double square
  return ''
}

// Accepts 'YYYY-MM-DD' (or a full timestamp) and shows it as the calendar date, with no timezone shift.
export function formatDate(value) {
  if (!value) return ''
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Today's date on the user's own clock, as 'YYYY-MM-DD'.
export function todayLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function describeHoles(round) {
  if (round.num_holes === 18) return '18 holes'
  return round.start_hole === 10 ? '9 holes (back)' : '9 holes (front)'
}