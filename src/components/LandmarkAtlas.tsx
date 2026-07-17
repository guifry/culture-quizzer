import { useMemo, useState } from 'react'
import { geoPath } from 'd3-geo'
import { ArrowRight } from 'lucide-react'
import type { Landmark, MapScope } from '../data/types'
import { WIDTH, HEIGHT, buildProjection } from '../map/projection'
import { worldCountryFeatures } from '../map/features'
import './CityQuiz.css'

type Placed = { landmark: Landmark; x: number; y: number }
type Cluster = { x: number; y: number; members: Placed[] }

// Markers within this pixel radius (viewBox units) collapse into one cluster badge; the
// dense Paris group expands on click into a fanned ring of its members.
const CLUSTER_PX = 8
const FAN_RADIUS = 58

type Selected = { landmark: Landmark; x: number; y: number }

export function LandmarkAtlas({ landmarks, onLearnMore, mapScope = 'uk' }: { landmarks: Landmark[]; onLearnMore: (id: string) => void; mapScope?: MapScope }) {
  const projection = useMemo(() => buildProjection(mapScope), [mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const countryPaths = useMemo(() => worldCountryFeatures.map((feat) => ({ key: feat.properties.name, d: path(feat) ?? '' })), [path])

  const clusters = useMemo(() => {
    const result: Cluster[] = []
    for (const landmark of landmarks) {
      const xy = projection([landmark.lon, landmark.lat])
      if (!xy) continue
      const placed: Placed = { landmark, x: xy[0], y: xy[1] }
      const near = result.find((cluster) => Math.hypot(cluster.x - placed.x, cluster.y - placed.y) < CLUSTER_PX)
      if (near) near.members.push(placed)
      else result.push({ x: placed.x, y: placed.y, members: [placed] })
    }
    return result
  }, [landmarks, projection])

  const [expanded, setExpanded] = useState<number | null>(null)
  const [selected, setSelected] = useState<Selected | null>(null)

  function fanPosition(cluster: Cluster, index: number, total: number): [number, number] {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2
    return [cluster.x + FAN_RADIUS * Math.cos(angle), cluster.y + FAN_RADIUS * Math.sin(angle)]
  }

  function marker(placed: Placed, x: number, y: number) {
    const active = selected?.landmark.id === placed.landmark.id
    return (
      <g
        key={placed.landmark.id}
        transform={`translate(${x} ${y})`}
        className={`atlas-marker${placed.landmark.essential ? ' essential' : ''}${active ? ' active' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          setSelected({ landmark: placed.landmark, x, y })
        }}
        role="button"
        aria-label={placed.landmark.name}
      >
        <circle r={6} />
        {placed.landmark.essential ? <text className="atlas-star" y={3.4}>★</text> : null}
      </g>
    )
  }

  return (
    <div className="landmark-atlas">
      <div className="atlas-frame">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="atlas-svg" role="img" aria-label={`Map of ${mapScope === 'uk' ? 'UK' : mapScope === 'france' ? 'France' : ''} landmarks`} onClick={() => { setSelected(null); setExpanded(null) }}>
          <rect width={WIDTH} height={HEIGHT} className="city-ocean" />
          {countryPaths.map((c) => (
            <path key={c.key} d={c.d} className="city-country" />
          ))}
          {clusters.map((cluster, index) => {
            if (cluster.members.length === 1) return marker(cluster.members[0], cluster.x, cluster.y)
            if (expanded === index) {
              return (
                <g key={`cluster-${index}`}>
                  {cluster.members.map((placed, memberIndex) => {
                    const [mx, my] = fanPosition(cluster, memberIndex, cluster.members.length)
                    return (
                      <g key={placed.landmark.id}>
                        <line className="atlas-leader" x1={cluster.x} y1={cluster.y} x2={mx} y2={my} />
                        {marker(placed, mx, my)}
                      </g>
                    )
                  })}
                  <circle className="atlas-cluster-hub" cx={cluster.x} cy={cluster.y} r={4} />
                </g>
              )
            }
            return (
              <g
                key={`cluster-${index}`}
                transform={`translate(${cluster.x} ${cluster.y})`}
                className="atlas-cluster"
                onClick={(event) => { event.stopPropagation(); setSelected(null); setExpanded(index) }}
                role="button"
                aria-label={`${cluster.members.length} landmarks — expand`}
              >
                <circle r={12} />
                <text y={4}>{cluster.members.length}</text>
              </g>
            )
          })}
        </svg>

        {selected ? (
          <div
            className="atlas-popup"
            style={{ left: `${(selected.x / WIDTH) * 100}%`, top: `${(selected.y / HEIGHT) * 100}%` }}
            onClick={(event) => event.stopPropagation()}
          >
            <strong>{selected.landmark.name}{selected.landmark.essential ? ' ★' : ''}</strong>
            <p>{selected.landmark.mapBlurb}</p>
            <button type="button" onClick={() => onLearnMore(selected.landmark.id)}>
              Learn more <ArrowRight size={14} />
            </button>
          </div>
        ) : null}
      </div>
      <p className="atlas-hint">{`Click a marker for a summary · the ${mapScope === 'uk' ? 'London' : mapScope === 'france' ? 'Paris' : ''} cluster expands on click.`}</p>
    </div>
  )
}
