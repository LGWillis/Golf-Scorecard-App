// OpenGolfAPI: free, no key needed for reading courses.
// Docs: https://opengolfapi.org/docs
//
// The response shapes below are handled defensively because I couldn't test
// against live data. Open the browser console while searching: if names or pars
// come back empty, check the logged response and adjust the field names here.

const BASE = 'https://api.opengolfapi.org'

export async function searchCourses(query) {
  const res = await fetch(`${BASE}/v1/courses/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Course search failed. Try again or enter the course manually.')
  const data = await res.json()
  console.log('Course search response:', data)

  const list = Array.isArray(data) ? data : data.courses ?? data.results ?? data.data ?? []
  return list
    .map((c) => ({
      id: String(c.id ?? c.course_id ?? ''),
      name: c.name ?? c.course_name ?? 'Unnamed course',
      city: c.city ?? c.address?.city ?? '',
      state: c.state ?? c.address?.state ?? '',
    }))
    .filter((c) => c.id)
}

// Returns an array of pars (index 0 = hole 1), or null if the course has no usable scorecard.
export async function getCoursePars(courseId) {
  try {
    const res = await fetch(`${BASE}/api/v1/courses/${encodeURIComponent(courseId)}`)
    if (!res.ok) return null
    const data = await res.json()
    console.log('Course detail response:', data)

    const course = data.course ?? data
    const raw = course.holes ?? course.scorecard?.holes ?? course.scorecard ?? []
    if (!Array.isArray(raw) || raw.length === 0) return null

    const holes = raw
      .map((h, i) => ({ number: Number(h.number ?? h.hole ?? i + 1), par: Number(h.par) }))
      .filter((h) => Number.isInteger(h.par) && h.par >= 3 && h.par <= 6)
      .sort((a, b) => a.number - b.number)

    return holes.length ? holes.map((h) => h.par) : null
  } catch {
    return null
  }
}
