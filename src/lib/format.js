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

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
