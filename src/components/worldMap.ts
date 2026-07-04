import { geoEqualEarth, type GeoProjection } from 'd3-geo'
import { feature } from 'topojson-client'
import countries110m from 'world-atlas/countries-110m.json'

export const MAP_WIDTH = 960
export const MAP_HEIGHT = 560

export type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>

export type MapView = { scale: number; x: number; y: number }
export const defaultMapView: MapView = { scale: 1, x: 0, y: 0 }

export function clampMapView(view: MapView): MapView {
  if (view.scale <= 1) return defaultMapView
  const minX = MAP_WIDTH - MAP_WIDTH * view.scale
  const minY = MAP_HEIGHT - MAP_HEIGHT * view.scale
  return {
    scale: view.scale,
    x: Math.min(0, Math.max(minX, view.x)),
    y: Math.min(0, Math.max(minY, view.y)),
  }
}

export function buildWorldProjection(): GeoProjection {
  return geoEqualEarth().translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]).scale(168)
}

export function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// The world-atlas France feature bundles French Guiana as a sub-polygon in South
// America. Split it out so both are distinct map targets (mirrors App.tsx).
function splitFrenchGuiana(features: CountryFeature[]): CountryFeature[] {
  const france = features.find((item) => item.properties.name === 'France')
  if (!france || france.geometry.type !== 'MultiPolygon') return features
  const isGuiana = (polygon: GeoJSON.Position[][]) => {
    const [lon, lat] = polygon[0][0]
    return lon < -30 && lat < 20
  }
  const guianaPolygons = france.geometry.coordinates.filter(isGuiana)
  const mainlandPolygons = france.geometry.coordinates.filter((polygon) => !isGuiana(polygon))
  if (!guianaPolygons.length) return features
  const nextFrance = { ...france, geometry: { type: 'MultiPolygon', coordinates: mainlandPolygons } } as CountryFeature
  const guiana = {
    type: 'Feature',
    geometry: { type: 'MultiPolygon', coordinates: guianaPolygons },
    properties: { name: 'French Guiana' },
  } as CountryFeature
  return features.map((item) => (item.properties.name === 'France' ? nextFrance : item)).concat(guiana)
}

export const worldCountryFeatures: CountryFeature[] = (() => {
  const collection = feature(countries110m as never, (countries110m as never as { objects: { countries: never } }).objects.countries)
  return splitFrenchGuiana((collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>).features)
})()
