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

// Great-circle distance in km — reserved for a future "expert" (click-near) mode.
export function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}
