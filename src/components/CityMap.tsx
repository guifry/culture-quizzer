import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { geoPath } from 'd3-geo'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { CityEntry } from '../data/types'
import { WIDTH, HEIGHT, defaultMapView, clampMapView, buildProjection, type MapView } from '../map/projection'
import { usStateFeatures, worldCountryFeatures } from '../map/features'

type LonLat = [number, number]

export function CityMap({
  city,
  guess,
  review,
  locationOk,
  interactive,
  onPick,
}: {
  city: CityEntry
  guess: LonLat | null
  review: boolean
  locationOk: boolean
  interactive: boolean
  onPick: (lonLat: LonLat) => void
}) {
  const projection = useMemo(() => buildProjection('world'), [])
  const path = useMemo(() => geoPath(projection), [projection])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; moved: boolean; view: MapView } | null>(null)
  const suppressClickRef = useRef(false)
  const [mapView, setMapView] = useState<MapView>(defaultMapView)

  const countryPaths = useMemo(() => worldCountryFeatures.map((feat) => ({ key: feat.properties.name, d: path(feat) ?? '' })), [path])
  const statePaths = useMemo(() => usStateFeatures.map((feat) => ({ key: feat.properties.name, d: path(feat) ?? '' })), [path])

  const guessXY = guess ? projection(guess) : null
  const truePoint = review ? projection([city.lon, city.lat]) : null
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
      return clampMapView({ scale: nextScale, x: pointX - worldX * nextScale, y: pointY - worldY * nextScale })
    })
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1)
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (mapView.scale <= 1) return
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
    setMapView(clampMapView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy }))
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
        aria-label="World map"
      >
        <rect width={WIDTH} height={HEIGHT} className="city-ocean" />
        <g transform={mapTransform}>
          {countryPaths.map((c) => (
            <path key={c.key} d={c.d} className="city-country" />
          ))}
          {statePaths.map((s) => (
            <path key={`st-${s.key}`} d={s.d} className="city-state" />
          ))}
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
      <p className="city-map-hint">Ctrl/⌘ + scroll to zoom · drag to pan{city.usState ? ' · US cities need the correct state' : ''}</p>
    </div>
  )
}
