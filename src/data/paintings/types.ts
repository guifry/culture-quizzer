import type { GlossaryTerm, Painting, QuizMode, Topic } from '../types'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1]
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1
      current.push(Math.min(current[j] + 1, previous[j + 1] + 1, previous[j] + cost))
    }
    previous = current
  }
  return previous[b.length]
}

function fuzzyIncludes(text: string, needle: string): boolean {
  return text.includes(needle) || levenshtein(text, needle) <= 2
}

export function matchesPaintingAnswer(input: string, painting: Painting): boolean {
  const clean = normalize(input)
  if (!clean) return false
  const nameCandidates = [painting.name, ...(painting.aliases ?? [])].map(normalize)
  const artistCandidates = [painting.artist, ...(painting.artistAliases ?? [])].map(normalize)
  const nameOk = nameCandidates.some((candidate) => fuzzyIncludes(clean, candidate))
  const artistOk = artistCandidates.some((candidate) => fuzzyIncludes(clean, candidate))
  return nameOk && artistOk
}

export function matchesPaintingExpertAnswer(input: string, painting: Painting): boolean {
  const clean = normalize(input)
  if (!clean) return false

  const nameCandidates = [painting.name, ...(painting.aliases ?? [])].map(normalize)
  const artistCandidates = [painting.artist, ...(painting.artistAliases ?? [])].map(normalize)
  if (!nameCandidates.some((candidate) => fuzzyIncludes(clean, candidate))) return false
  if (!artistCandidates.some((candidate) => fuzzyIncludes(clean, candidate))) return false

  const centuryNorm = normalize(painting.century)
  const centuryNum = painting.century.match(/\d+/)?.[0]
  const centuryOk = fuzzyIncludes(clean, centuryNorm) || (centuryNum ? fuzzyIncludes(clean, `${centuryNum}th`) : false)
  if (!centuryOk) return false

  const movementNorm = normalize(painting.movement)
  const movementCandidates = [
    movementNorm,
    ...(painting.movementAliases?.map((a) => normalize(a)) ?? []),
  ]
  if (!movementCandidates.some((m) => fuzzyIncludes(clean, m))) return false

  const nationalityNorm = normalize(painting.nationality)
  if (!fuzzyIncludes(clean, nationalityNorm)) return false

  return true
}

export function buildPaintingsTopic(
  id: string,
  title: string,
  description: string,
  coverage: string,
  modes: QuizMode[],
  paintings: Painting[],
  glossary: GlossaryTerm[],
): Topic {
  return {
    id,
    title,
    group: 'Art',
    description,
    coverage,
    modes,
    kind: 'paintings-quiz',
    paintings,
    glossary,
    items: paintings.map((painting) => ({ id: painting.id, name: painting.name })),
  }
}
