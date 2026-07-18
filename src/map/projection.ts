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

// panSlack (fraction of the viewport) lets the map be dragged beyond the strict fit — needed
// to pan at base zoom, e.g. to pull Corsica out from under an overlay. 0 keeps the old
// behaviour: no offset at base zoom, hard edges when zoomed.
export function clampMapView(view: MapView, panSlack = 0): MapView {
  const scale = Math.max(1, view.scale)
  if (scale <= 1 && panSlack === 0) return defaultMapView
  const slackX = WIDTH * panSlack
  const slackY = HEIGHT * panSlack
  const minX = WIDTH - WIDTH * scale - slackX
  const minY = HEIGHT - HEIGHT * scale - slackY

  return {
    scale,
    x: Math.min(slackX, Math.max(minX, view.x)),
    y: Math.min(slackY, Math.max(minY, view.y)),
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
