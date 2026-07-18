import type { GlossaryTerm, Landmark, MapScope, QuizMode, Topic } from '../types'
import { distanceKm, distanceToRingKm, pointInRing, ringAreaKm2 } from '../../map/containment'
import { matchesAnyName } from '../matching'

// A locate-mode click counts as correct within this radius of the true point. Generous
// enough for UK-wide clicking precision; the finer knowledge lives in the photo/clue
// modes and the course map.
export const LOCATE_RADIUS_KM = 40

export function matchesLandmarkName(input: string, landmark: Landmark): boolean {
  return matchesAnyName(input, [landmark.name, landmark.nameFr, ...(landmark.aliases ?? [])])
}

export type LocationVerdict = {
  ok: boolean
  distanceKm: number
  insideZone: boolean
}

// Zones: correct inside or on the border (0 km). Outside, the tolerance band shrinks as the
// zone grows — a tiny zone is as forgiving as a point, a large region must be hit directly.
export function zoneToleranceKm(zone: Array<[number, number]>): number {
  return Math.min(LOCATE_RADIUS_KM, Math.max(0, LOCATE_RADIUS_KM - Math.sqrt(ringAreaKm2(zone))))
}

export function evaluateLandmarkLocation(landmark: Landmark, lonLat: [number, number]): LocationVerdict {
  if (landmark.zone && landmark.zone.length >= 3) {
    if (pointInRing(lonLat, landmark.zone)) return { ok: true, distanceKm: 0, insideZone: true }
    const distance = distanceToRingKm(lonLat, landmark.zone)
    return { ok: distance <= zoneToleranceKm(landmark.zone), distanceKm: Math.round(distance), insideZone: false }
  }
  const distance = distanceKm([landmark.lon, landmark.lat], lonLat)
  return { ok: distance <= LOCATE_RADIUS_KM, distanceKm: Math.round(distance), insideZone: false }
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
