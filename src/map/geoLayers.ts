import { resolveImageUrl } from '../utils'

// Progressive map-detail layers (roads, rivers) served as static GeoJSON from public/geo/.
// Built by scripts/build-france-map-layers.md instructions from IGN ROUTE 500 (Licence
// Ouverte 2.0) and Natural Earth rivers (public domain). All attributes are stripped at
// build time so the payload can never spoil an answer.
const cache: Record<string, Promise<GeoJSON.GeoJSON | null>> = {}

export function loadGeoLayer(name: string): Promise<GeoJSON.GeoJSON | null> {
  if (!(name in cache)) {
    cache[name] = fetch(resolveImageUrl(`/geo/${name}.json`))
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
  }
  return cache[name]
}
