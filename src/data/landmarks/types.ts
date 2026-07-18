import type { GlossaryTerm, Landmark, MapScope, QuizMode, Topic } from '../types'
import { distanceKm } from '../../map/containment'
import { matchesAnyName } from '../matching'

// A locate-mode click counts as correct within this radius of the true point. Generous
// enough for UK-wide clicking precision; the finer knowledge lives in the photo/clue
// modes and the course map.
export const LOCATE_RADIUS_KM = 40

export function matchesLandmarkName(input: string, landmark: Landmark): boolean {
  return matchesAnyName(input, [landmark.name, landmark.nameFr, ...(landmark.aliases ?? [])])
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
  mapScope: MapScope = 'uk',
  mapKind: 'country-polygons' | 'points' = 'points',
): Topic {
  return {
    id,
    title,
    group: 'Geography',
    description,
    coverage,
    modes,
    kind: 'landmark-quiz',
    mapScope,
    mapKind,
    landmarks,
    glossary,
    items: landmarks.map((landmark) => ({ id: landmark.id, name: landmark.name, lat: landmark.lat, lon: landmark.lon })),
  }
}
