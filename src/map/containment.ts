import { geoContains } from 'd3-geo'
import type { CityEntry } from '../data/types'
import { countriesByName, normName, usStatesByName } from './features'

// Region-level correctness: the click must land inside the city's country polygon,
// and, for US cities, inside the correct US state polygon.
export function isRegionCorrect(city: CityEntry, lonLat: [number, number]): boolean {
  const country = countriesByName.get(normName(city.country))
  if (!country || !geoContains(country, lonLat)) return false
  if (city.usState) {
    const state = usStatesByName.get(normName(city.usState))
    return Boolean(state && geoContains(state, lonLat))
  }
  return true
}

export function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

type LonLat = [number, number]

const KM_PER_DEG_LAT = 110.574

function kmPerDegLon(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180)
}

// Local equirectangular plane in km around `ref` — accurate enough for zone-sized shapes.
function toLocalKm(ref: LonLat, point: LonLat): [number, number] {
  return [(point[0] - ref[0]) * kmPerDegLon(ref[1]), (point[1] - ref[1]) * KM_PER_DEG_LAT]
}

export function pointInRing(point: LonLat, ring: LonLat[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function ringAreaKm2(ring: LonLat[]): number {
  const ref = ring[0]
  let doubled = 0
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = toLocalKm(ref, ring[i])
    const [x2, y2] = toLocalKm(ref, ring[(i + 1) % ring.length])
    doubled += x1 * y2 - x2 * y1
  }
  return Math.abs(doubled) / 2
}

function distancePointToSegmentKm(p: [number, number], a: [number, number], b: [number, number]): number {
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const len2 = abx * abx + aby * aby
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2)) : 0
  return Math.hypot(a[0] + t * abx - p[0], a[1] + t * aby - p[1])
}

export function distanceToRingKm(point: LonLat, ring: LonLat[]): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i += 1) {
    const a = toLocalKm(point, ring[i])
    const b = toLocalKm(point, ring[(i + 1) % ring.length])
    best = Math.min(best, distancePointToSegmentKm([0, 0], a, b))
  }
  return best
}
