import { geoAlbersUsa, geoEqualEarth, geoMercator } from 'd3-geo'
import type { MapScope } from '../data/types'

export const WIDTH = 960
export const HEIGHT = 560

export type MapView = {
  scale: number
  x: number
  y: number
}

export const defaultMapView: MapView = { scale: 1, x: 0, y: 0 }

export function clampMapView(view: MapView): MapView {
  if (view.scale <= 1) return defaultMapView
  const minX = WIDTH - WIDTH * view.scale
  const minY = HEIGHT - HEIGHT * view.scale

  return {
    scale: view.scale,
    x: Math.min(0, Math.max(minX, view.x)),
    y: Math.min(0, Math.max(minY, view.y)),
  }
}

export function buildProjection(scope: MapScope) {
  if (scope === 'usa') {
    return geoAlbersUsa().translate([WIDTH / 2, HEIGHT / 2]).scale(980)
  }

  const projection = scope === 'world' ? geoEqualEarth() : geoMercator()
  if (scope === 'world') return projection.translate([WIDTH / 2, HEIGHT / 2]).scale(168)
  if (scope === 'europe') return projection.center([10, 51]).scale(760).translate([WIDTH / 2, HEIGHT / 2])
  if (scope === 'uk') return projection.center([-3.6, 55.0]).scale(1780).translate([WIDTH / 2, HEIGHT / 2])
  return projection.center([2.7, 46.4]).scale(1900).translate([WIDTH / 2, HEIGHT / 2])
}
