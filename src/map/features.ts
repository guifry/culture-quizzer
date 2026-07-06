import { feature } from 'topojson-client'
import countries110m from 'world-atlas/countries-110m.json'
import usStatesAtlas from 'us-atlas/states-10m.json'

export type NamedFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>

function parse(atlas: unknown, objectName: string): NamedFeature[] {
  const objects = (atlas as { objects: Record<string, never> }).objects
  const collection = feature(atlas as never, objects[objectName])
  return (collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>).features
}

export function normName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const worldCountryFeatures: NamedFeature[] = parse(countries110m, 'countries')
export const usStateFeatures: NamedFeature[] = parse(usStatesAtlas, 'states')

export const countriesByName = new Map(worldCountryFeatures.map((feat) => [normName(feat.properties.name), feat]))
export const usStatesByName = new Map(usStateFeatures.map((feat) => [normName(feat.properties.name), feat]))
