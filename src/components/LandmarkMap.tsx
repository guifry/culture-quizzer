import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { geoPath } from 'd3-geo'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { Landmark, MapScope } from '../data/types'
import { WIDTH, HEIGHT, defaultMapView, clampMapView, buildProjection, type MapView } from '../map/projection'
import { worldCountryFeatures } from '../map/features'
import ukAdmin from '../data/geo/uk-counties-unitaries-2022.json'
import frRegions from '../data/geo/fr-regions.json'
import './CityQuiz.css'

type LonLat = [number, number]
type BoundaryFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, string | number | null>>

const PAN_SLACK = 0.5

const UK_REF_CITIES = [
  { name: 'London', lat: 51.5072, lon: -0.1276 },
  { name: 'Birmingham', lat: 52.4862, lon: -1.8904 },
  { name: 'Leeds', lat: 53.8008, lon: -1.5491 },
  { name: 'Glasgow', lat: 55.8642, lon: -4.2518 },
  { name: 'Sheffield', lat: 53.3811, lon: -1.4701 },
  { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
  { name: 'Liverpool', lat: 53.4084, lon: -2.9916 },
  { name: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
  { name: 'Bristol', lat: 51.4545, lon: -2.5879 },
  { name: 'Cardiff', lat: 51.4816, lon: -3.1791 },
]

const FR_REF_CITIES = [
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
  { name: 'Lyon', lat: 45.764, lon: 4.8357 },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
  { name: 'Nice', lat: 43.7102, lon: 7.262 },
  { name: 'Nantes', lat: 47.2184, lon: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lon: 7.7521 },
  { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
  { name: 'Lille', lat: 50.6292, lon: 3.0573 },
  { name: 'Montpellier', lat: 43.611, lon: 3.8767 },
]

function boundaryName(f: BoundaryFeature): string {
  return String(f.properties.CTYUA22NM ?? f.properties.nom ?? f.properties.name ?? '')
}

export function LandmarkMap({
  landmark,
  guess,
  review,
  locationOk,
  interactive,
  onPick,
  mapScope = 'uk',
}: {
  landmark: Landmark
  guess: LonLat | null
  review: boolean
  locationOk: boolean
  interactive: boolean
  onPick: (lonLat: LonLat) => void
  mapScope?: MapScope
}) {
  const projection = useMemo(() => buildProjection(mapScope), [mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; moved: boolean; view: MapView } | null>(null)
  const suppressClickRef = useRef(false)
  const [mapView, setMapView] = useState<MapView>(defaultMapView)

  const countryPaths = useMemo(() => worldCountryFeatures.map((feat) => ({ key: feat.properties.name, d: path(feat) ?? '' })), [path])

  const boundaryFeatures = useMemo<BoundaryFeature[]>(() => {
    if (mapScope === 'france') return (frRegions as GeoJSON.FeatureCollection).features as BoundaryFeature[]
    return (ukAdmin as GeoJSON.FeatureCollection).features as BoundaryFeature[]
  }, [mapScope])

  const boundaryPaths = useMemo(
    () => boundaryFeatures.map((feat) => ({ key: boundaryName(feat), d: path(feat) ?? '' })),
    [boundaryFeatures, path],
  )

  const refCities = useMemo(() => {
    return (mapScope === 'france' ? FR_REF_CITIES : UK_REF_CITIES)
      .map((city) => {
        const p = projection([city.lon, city.lat])
        return p ? { ...city, x: p[0], y: p[1] } : null
      })
      .filter(Boolean) as Array<{ name: string; x: number; y: number }>
  }, [mapScope, projection])

  const guessXY = guess ? projection(guess) : null
  const truePoint = review && !landmark.zone ? projection([landmark.lon, landmark.lat]) : null
  const zonePath = review && landmark.zone && landmark.zone.length >= 3
    ? path({ type: 'Polygon', coordinates: [[...landmark.zone, landmark.zone[0]]] })
    : null
  const mapTransform = `translate(${mapView.x} ${mapView.y}) scale(${mapView.scale})`

  function mapPointFromClient(clientX: number, clientY: number): [number, number] | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const viewX = ((clientX - rect.left) / rect.width) * WIDTH
    const viewY = ((clientY - rect.top) / rect.height) * HEIGHT
    return [(viewX - mapView.x) / mapView.scale, (viewY - mapView.y) / mapView.scale]
  }

  function zoomAt(clientX: number, clientY: number, direction: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const pointX = ((clientX - rect.left) / rect.width) * WIDTH
    const pointY = ((clientY - rect.top) / rect.height) * HEIGHT
    setMapView((previous) => {
      const nextScale = Math.min(8, Math.max(1, previous.scale * (direction > 0 ? 1.4 : 1 / 1.4)))
      const worldX = (pointX - previous.x) / previous.scale
      const worldY = (pointY - previous.y) / previous.scale
      return clampMapView({ scale: nextScale, x: pointX - worldX * nextScale, y: pointY - worldY * nextScale }, PAN_SLACK)
    })
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1)
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    dragRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, moved: false, view: mapView }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    const svg = svgRef.current
    if (!drag || !svg || drag.pointerId !== event.pointerId) return
    const rect = svg.getBoundingClientRect()
    const dx = ((event.clientX - drag.clientX) / rect.width) * WIDTH
    const dy = ((event.clientY - drag.clientY) / rect.height) * HEIGHT
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 4) drag.moved = true
    if (!drag.moved) return
    setMapView(clampMapView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy }, PAN_SLACK))
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return
    if (drag.moved) suppressClickRef.current = true
    dragRef.current = null
  }

  function handleClick(event: { clientX: number; clientY: number }) {
    if (!interactive) return
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    const point = mapPointFromClient(event.clientX, event.clientY)
    if (!point) return
    const lonLat = projection.invert?.(point)
    if (lonLat) onPick([lonLat[0], lonLat[1]])
  }

  function setZoom(direction: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, direction)
  }

  const isFrance = mapScope === 'france'

  return (
    <div className="city-map">
      <div className="city-map-controls">
        <button type="button" onClick={() => setZoom(1)} aria-label="Zoom in"><Plus size={16} /></button>
        <button type="button" onClick={() => setZoom(-1)} aria-label="Zoom out"><Minus size={16} /></button>
        <button type="button" onClick={() => setMapView(defaultMapView)} aria-label="Reset zoom"><RotateCcw size={15} /></button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={interactive ? 'city-map-svg interactive' : 'city-map-svg'}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        role="img"
        aria-label={`Map of ${isFrance ? 'France' : 'the United Kingdom'}`}
      >
        <rect width={WIDTH} height={HEIGHT} className="city-ocean" />
        <g transform={mapTransform}>
          {countryPaths.map((c) => (
            <path key={c.key} d={c.d} className="city-country" />
          ))}

          {boundaryPaths.map((b) => (
            <path key={b.key} d={b.d} className="city-state" />
          ))}

          {refCities.map((city) => {
            const cx = city.x
            const cy = city.y
            return (
              <g key={city.name} transform={`translate(${cx} ${cy}) scale(${1 / mapView.scale})`}>
                <circle className="ref-city-dot" r={2.5} />
                <text className="ref-city-label" dx={5} dy={3.5}>{city.name}</text>
              </g>
            )
          })}

          {zonePath ? <path className="true-zone" d={zonePath} style={{ strokeWidth: 1.6 / mapView.scale }} /> : null}
          {guessXY ? (
            <g className={review ? (locationOk ? 'guess-marker ok' : 'guess-marker bad') : 'guess-marker'} transform={`translate(${guessXY[0]} ${guessXY[1]})`}>
              <circle r={5 / mapView.scale} />
            </g>
          ) : null}
          {truePoint ? (
            <g className="true-marker" transform={`translate(${truePoint[0]} ${truePoint[1]})`}>
              <circle r={4.5 / mapView.scale} />
              <circle r={9 / mapView.scale} className="true-halo" />
            </g>
          ) : null}
        </g>
      </svg>
      <p className="city-map-hint">Ctrl/⌘ + scroll to zoom · drag to pan</p>
    </div>
  )
}
