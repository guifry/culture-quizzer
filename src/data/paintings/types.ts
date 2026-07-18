import type { GlossaryTerm, Painting, QuizMode, Topic } from '../types'
import { levenshtein, normalizeAnswer as normalize } from '../matching'

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
