// OpenGolfAPI: free, no key needed for reading courses.
// Docs: https://opengolfapi.org/docs

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

// On a course, "holes" is usually just a number (18), so only accept real lists.
function findHoleList(data) {
  if (Array.isArray(data) && data.length > 0) return data
  const roots = [data, data?.course, data?.data, data?.properties, data?.course?.properties]
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue
    for (const candidate of [root.scorecard, root.scorecard?.holes, root.holes]) {
      if (Array.isArray(candidate) && candidate.length > 0) return candidate
    }
  }
  return null
}

// Turns a list like [{ hole: 1, par: 4 }, ...] into [4, ...] (index 0 = hole 1).
function toPars(list) {
  const pars = []
  list.forEach((h, i) => {
    const number = Number(h.hole ?? h.number ?? h.hole_number ?? i + 1)
    const par = Number(h.par ?? h.Par)
    if (Number.isInteger(number) && number >= 1 && Number.isInteger(par) && par >= 3 && par <= 6) {
      pars[number - 1] = par
    }
  })
  const dense = Array.from(pars) // fills gaps with undefined so we can detect missing holes
  return dense.length >= 9 && dense.every(Number.isInteger) ? dense : null
}

// Returns an array of pars, or null if the course has no usable scorecard.
export async function getCoursePars(courseId) {
  const id = encodeURIComponent(courseId)
  const paths = [`/v1/courses/${id}`, `/v1/courses/${id}/holes`, `/api/v1/courses/${id}`]

  for (const path of paths) {
    try {
      const res = await fetch(`${BASE}${path}`)
      if (!res.ok) continue
      const data = await res.json()
      console.log(`Course detail response (${path}):`, data)
      const list = findHoleList(data)
      const pars = list && toPars(list)
      if (pars) return pars
    } catch {
      // try the next endpoint
    }
  }
  return null
}