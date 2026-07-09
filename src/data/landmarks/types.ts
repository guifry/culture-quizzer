import type { GlossaryTerm, Landmark, QuizMode, Topic } from '../types'
import { distanceKm } from '../../map/containment'

// A locate-mode click counts as correct within this radius of the true point. Generous
// enough for UK-wide clicking precision; the finer knowledge lives in the photo/clue
// modes and the course map.
export const LOCATE_RADIUS_KM = 40

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

function threshold(length: number): number {
  if (length < 4) return 0
  if (length < 6) return 1
  return 2
}

export function matchesLandmarkName(input: string, landmark: Landmark): boolean {
  const clean = normalize(input)
  if (!clean) return false
  const candidates = [landmark.name, ...(landmark.aliases ?? [])].map(normalize)
  return candidates.some((candidate) => clean === candidate || levenshtein(clean, candidate) <= threshold(candidate.length))
}

export function isLandmarkLocationCorrect(landmark: Landmark, lonLat: [number, number]): boolean {
  return distanceKm([landmark.lon, landmark.lat], lonLat) <= LOCATE_RADIUS_KM
}

export function buildLandmarkTopic(
  id: string,
  title: string,
  description: string,
  coverage: string,
  modes: QuizMode[],
  landmarks: Landmark[],
  glossary: GlossaryTerm[],
): Topic {
  return {
    id,
    title,
    group: 'Geography',
    description,
    coverage,
    modes,
    kind: 'landmark-quiz',
    mapScope: 'uk',
    landmarks,
    glossary,
    items: landmarks.map((landmark) => ({ id: landmark.id, name: landmark.name, lat: landmark.lat, lon: landmark.lon })),
  }
}
