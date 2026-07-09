import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { geoContains, geoPath } from 'd3-geo'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { ColonyRelation, Topic } from '../data/types'
import { shuffle } from '../utils'
import {
  buildWorldProjection,
  clampMapView,
  defaultMapView,
  normalizeName,
  worldCountryFeatures,
  MAP_HEIGHT,
  MAP_WIDTH,
  type MapView,
} from './worldMap'
import './ColoniesQuiz.css'

type ColoniesScore = {
  colonisersPlayed: number
  colonisersPerfect: number
  hits: number
  missed: number
  wrong: number
  yearAttempts: number
  yearCorrect: number
  streak: number
  bestStreak: number
}

const SCORE_STORAGE_KEY = 'culture-quizzer-colonies-scores'
const YEAR_TOLERANCE = 1

const emptyScore = (): ColoniesScore => ({
  colonisersPlayed: 0,
  colonisersPerfect: 0,
  hits: 0,
  missed: 0,
  wrong: 0,
  yearAttempts: 0,
  yearCorrect: 0,
  streak: 0,
  bestStreak: 0,
})

function loadScoreBook(): Record<string, ColoniesScore> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(key: string, score: ColoniesScore) {
  const book = loadScoreBook()
  book[key] = score
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(book))
}

function yearMatches(input: string, relation: ColonyRelation) {
  const value = Number.parseInt(input, 10)
  if (Number.isNaN(value)) return false
  const targets = [relation.lostYear, relation.independenceYear].filter((year): year is number => typeof year === 'number')
  return targets.some((year) => Math.abs(value - year) <= YEAR_TOLERANCE)
}

function yearLabel(relation: ColonyRelation) {
  if (relation.independenceYear && relation.independenceYear !== relation.lostYear) {
    return `${relation.lostYear} (independence ${relation.independenceYear})`
  }
  return String(relation.lostYear ?? '—')
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ColoniesQuiz({ topic, mobile = false, onReset }: { topic: Topic; mobile?: boolean; onReset?: () => void }) {
  const relations = useMemo(() => (topic.colonies ?? []).filter((relation) => relation.status === 'former'), [topic.colonies])
  const byColoniser = useMemo(() => {
    const grouped = new Map<string, ColonyRelation[]>()
    for (const relation of relations) {
      const list = grouped.get(relation.coloniser) ?? []
      list.push(relation)
      grouped.set(relation.coloniser, list)
    }
    return grouped
  }, [relations])
  const colonisers = useMemo(() => [...byColoniser.keys()], [byColoniser])

  const [order, setOrder] = useState<string[]>(() => shuffle(colonisers))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(colonisers.length === 0)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [reviewed, setReviewed] = useState(false)
  const [expert, setExpert] = useState(false)
  const [yearInputs, setYearInputs] = useState<Record<string, string>>({})
  const [yearsChecked, setYearsChecked] = useState(false)
  const [score, setScore] = useState<ColoniesScore>(() => loadScoreBook()[topic.id] ?? emptyScore())

  useEffect(() => {
    saveScore(topic.id, score)
  }, [topic.id, score])

  const coloniser = order[position]
  const expected = useMemo(() => byColoniser.get(coloniser) ?? [], [byColoniser, coloniser])
  const expectedByName = useMemo(() => new Map(expected.map((relation) => [normalizeName(relation.country), relation])), [expected])

  const hits = useMemo(() => expected.filter((relation) => selection.has(normalizeName(relation.country))), [expected, selection])
  const missed = useMemo(() => expected.filter((relation) => !selection.has(normalizeName(relation.country))), [expected, selection])
  const wrongNames = useMemo(() => [...selection].filter((name) => !expectedByName.has(name)), [selection, expectedByName])

  const needsYearStage = expert && reviewed && !yearsChecked && hits.length > 0

  const toggleCountry = useCallback(
    (name: string) => {
      if (reviewed) return
      setSelection((previous) => {
        const next = new Set(previous)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    },
    [reviewed],
  )

  const evaluate = useCallback(() => {
    const hitCount = hits.length
    const missCount = missed.length
    const wrongCount = wrongNames.length
    const perfect = missCount === 0 && wrongCount === 0
    setScore((previous) => {
      const streak = perfect ? previous.streak + 1 : 0
      return {
        ...previous,
        colonisersPlayed: previous.colonisersPlayed + 1,
        colonisersPerfect: previous.colonisersPerfect + (perfect ? 1 : 0),
        hits: previous.hits + hitCount,
        missed: previous.missed + missCount,
        wrong: previous.wrong + wrongCount,
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      }
    })
    setReviewed(true)
  }, [hits.length, missed.length, wrongNames.length])

  const checkYears = useCallback(() => {
    let correct = 0
    for (const relation of hits) {
      if (yearMatches(yearInputs[normalizeName(relation.country)] ?? '', relation)) correct += 1
    }
    setScore((previous) => ({
      ...previous,
      yearAttempts: previous.yearAttempts + hits.length,
      yearCorrect: previous.yearCorrect + correct,
    }))
    setYearsChecked(true)
  }, [hits, yearInputs])

  const next = useCallback(() => {
    setSelection(new Set())
    setReviewed(false)
    setYearInputs({})
    setYearsChecked(false)
    setPosition((previous) => {
      if (previous + 1 >= order.length) {
        setCompleted(true)
        return previous
      }
      return previous + 1
    })
  }, [order.length])

  const handleSpace = useCallback(() => {
    if (completed) return
    if (!reviewed) {
      evaluate()
      return
    }
    if (needsYearStage) {
      checkYears()
      return
    }
    next()
  }, [completed, reviewed, needsYearStage, evaluate, checkYears, next])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      event.preventDefault()
      handleSpace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSpace])

  function startNewRound() {
    setOrder(shuffle(colonisers))
    setPosition(0)
    setCompleted(false)
    setSelection(new Set())
    setReviewed(false)
    setYearInputs({})
    setYearsChecked(false)
  }

  if (!colonisers.length) return null

  const decided = score.hits + score.missed + score.wrong
  const accuracy = decided ? Math.round((score.hits / decided) * 100) : 0
  const yearAccuracy = score.yearAttempts ? Math.round((score.yearCorrect / score.yearAttempts) * 100) : 0

  const spaceHint = !reviewed
    ? 'Click every country, then press Space to check.'
    : needsYearStage
      ? 'Type the year each colony was lost, then press Space.'
      : 'Press Space for the next empire.'

  const countText = reviewed ? `${hits.length} correct · ${missed.length} missed · ${wrongNames.length} wrong` : `${selection.size} selected`
  const actionLabel = !reviewed ? 'Check' : needsYearStage ? 'Check years' : 'Next empire'

  if (mobile) {
    if (completed) {
      return (
        <section className="mobile-map-game colonies-mmg-complete">
          <div className="deck-complete">
            <span className="eyebrow">Round complete</span>
            <h2>All empires covered</h2>
            <button className="primary-action" type="button" onClick={startNewRound}>
              <RotateCcw size={16} />
              Start new shuffled round
            </button>
            <div className="deck-complete-stats">
              <Stat label="Accuracy" value={`${accuracy}%`} />
              {expert ? <Stat label="Year accuracy" value={`${yearAccuracy}%`} /> : null}
              <Stat label="Best streak" value={score.bestStreak} />
            </div>
            <p className="coverage">{topic.coverage}</p>
          </div>
        </section>
      )
    }
    return (
      <section className="mobile-map-game colonies-mmg">
        <div className="mmg-toolbar">
          <label className="mmg-toggle">
            <input type="checkbox" checked={expert} onChange={(event) => setExpert(event.target.checked)} />
            <span>Expert: also enter the year lost</span>
          </label>
          {onReset ? (
            <button className="mmg-reset" type="button" onClick={onReset} aria-label="Reset scores">
              <RotateCcw size={16} />
            </button>
          ) : null}
        </div>
        <div className="mmg-prompt">
          <div className="mmg-status">
            <span>{Math.min(position + 1, order.length)}/{order.length}</span>
            <span>{accuracy}% acc</span>
            <span>🔥 {score.streak}</span>
          </div>
          <h2>Former colonies of {coloniser}</h2>
          <div className="colonies-actions">
            <span className="colonies-count">{countText}</span>
            <div className="colonies-buttons">
              {!reviewed ? (
                <button className="ghost-action" type="button" onClick={() => setSelection(new Set())} disabled={!selection.size}>
                  Clear
                </button>
              ) : null}
              <button className="primary-action" type="button" onClick={handleSpace}>
                {actionLabel}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {reviewed ? (
            <div className="colonies-mmg-review">
              <ReviewList
                expected={expected}
                selectedNames={selection}
                wrongNames={wrongNames}
                expert={expert}
                yearInputs={yearInputs}
                yearsChecked={yearsChecked}
                onYearChange={(name, value) => setYearInputs((previous) => ({ ...previous, [name]: value }))}
              />
            </div>
          ) : (
            <p className="review-hint">{spaceHint}</p>
          )}
        </div>
        <div className="mmg-map">
          <ColoniesMap selection={selection} expectedByName={expectedByName} reviewed={reviewed} onToggle={toggleCountry} />
        </div>
      </section>
    )
  }

  if (completed) {
    return (
      <div className="colonies-quiz colonies-complete">
        <section className="score-strip" aria-label="Current score">
          <Stat label="Empires" value={colonisers.length} />
          <Stat label="Progress" value={`${order.length}/${order.length}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          {expert ? <Stat label="Year acc" value={`${yearAccuracy}%`} /> : null}
          <Stat label="Streak" value={score.streak} />
          <Stat label="Best" value={score.bestStreak} />
        </section>
        <section className="deck-complete">
          <span className="eyebrow">Round complete</span>
          <h2>All empires covered</h2>
          <div className="deck-complete-stats">
            <Stat label="Accuracy" value={`${accuracy}%`} />
            {expert ? <Stat label="Year accuracy" value={`${yearAccuracy}%`} /> : null}
            <Stat label="Best streak" value={score.bestStreak} />
          </div>
          <button className="primary-action" type="button" onClick={startNewRound}>
            <RotateCcw size={16} />
            Start new shuffled round
          </button>
          <p className="coverage">{topic.coverage}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="colonies-quiz map-stage colonies-stage">
      <ColoniesMap selection={selection} expectedByName={expectedByName} reviewed={reviewed} onToggle={toggleCountry} />

      <section className="score-strip score-overlay" aria-label="Current score">
        <Stat label="Empires" value={colonisers.length} />
        <Stat label="Progress" value={`${Math.min(position + 1, order.length)}/${order.length}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        {expert ? <Stat label="Year acc" value={`${yearAccuracy}%`} /> : null}
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="quiz-overlay colonies-overlay">
        <div className="colonies-panel">
          <div className="colonies-prompt">
            <span className="eyebrow">Former colonies of</span>
            <h2>{coloniser}</h2>
          </div>
          <label className="expert-toggle">
            <input type="checkbox" checked={expert} onChange={(event) => setExpert(event.target.checked)} />
            <span>Expert: also enter the year lost</span>
          </label>
          <div className="colonies-actions">
            <span className="colonies-count">{reviewed ? `${hits.length} correct · ${missed.length} missed · ${wrongNames.length} wrong` : `${selection.size} selected`}</span>
            <div className="colonies-buttons">
              {!reviewed ? (
                <button className="ghost-action" type="button" onClick={() => setSelection(new Set())} disabled={!selection.size}>
                  Clear
                </button>
              ) : null}
              <button className="primary-action" type="button" onClick={handleSpace}>
                {!reviewed ? 'Check' : needsYearStage ? 'Check years' : 'Next empire'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p className="review-hint">{spaceHint}</p>
          {reviewed ? (
            <ReviewList
              expected={expected}
              selectedNames={selection}
              wrongNames={wrongNames}
              expert={expert}
              yearInputs={yearInputs}
              yearsChecked={yearsChecked}
              onYearChange={(name, value) => setYearInputs((previous) => ({ ...previous, [name]: value }))}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ReviewList({
  expected,
  selectedNames,
  wrongNames,
  expert,
  yearInputs,
  yearsChecked,
  onYearChange,
}: {
  expected: ColonyRelation[]
  selectedNames: Set<string>
  wrongNames: string[]
  expert: boolean
  yearInputs: Record<string, string>
  yearsChecked: boolean
  onYearChange: (name: string, value: string) => void
}) {
  return (
    <div className="review-list">
      <ul className="colony-rows">
        {expected.map((relation) => {
          const key = normalizeName(relation.country)
          const hit = selectedNames.has(key)
          const showYearInput = expert && hit
          const yearOk = yearsChecked && yearMatches(yearInputs[key] ?? '', relation)
          return (
            <li key={key} className={hit ? 'colony-row hit' : 'colony-row miss'}>
              <span className="colony-mark">{hit ? <Check size={15} /> : <X size={15} />}</span>
              <span className="colony-name">{relation.country}</span>
              {relation.note ? <span className="colony-note">{relation.note}</span> : null}
              {showYearInput ? (
                <span className="colony-year-input">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="year"
                    value={yearInputs[key] ?? ''}
                    onChange={(event) => onYearChange(key, event.target.value)}
                    readOnly={yearsChecked}
                  />
                  {yearsChecked ? <span className={yearOk ? 'year-verdict ok' : 'year-verdict bad'}>{yearOk ? '✓' : yearLabel(relation)}</span> : null}
                </span>
              ) : (
                <span className="colony-year">{yearLabel(relation)}</span>
              )}
            </li>
          )
        })}
      </ul>
      {wrongNames.length ? (
        <p className="wrong-picks">
          Not colonies: <b>{wrongNames.map((name) => prettyName(name)).join(', ')}</b>
        </p>
      ) : null}
    </div>
  )
}

const displayNameByKey = new Map(worldCountryFeatures.map((feature) => [normalizeName(feature.properties.name), feature.properties.name]))
function prettyName(key: string) {
  return displayNameByKey.get(key) ?? key
}

function ColoniesMap({
  selection,
  expectedByName,
  reviewed,
  onToggle,
}: {
  selection: Set<string>
  expectedByName: Map<string, ColonyRelation>
  reviewed: boolean
  onToggle: (name: string) => void
}) {
  const projection = useMemo(() => buildWorldProjection(), [])
  const path = useMemo(() => geoPath(projection), [projection])
  const shapes = useMemo(
    () => worldCountryFeatures.map((feature) => ({ name: feature.properties.name, key: normalizeName(feature.properties.name), feature, d: path(feature) ?? undefined })),
    [path],
  )
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; moved: boolean; view: MapView } | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ startDist: number; startScale: number; anchor: [number, number] } | null>(null)
  const [mapView, setMapView] = useState<MapView>(defaultMapView)
  const mapTransform = `translate(${mapView.x} ${mapView.y}) scale(${mapView.scale})`

  function toView(clientX: number, clientY: number, rect: DOMRect): [number, number] {
    return [((clientX - rect.left) / rect.width) * MAP_WIDTH, ((clientY - rect.top) / rect.height) * MAP_HEIGHT]
  }

  function zoomAt(clientX: number, clientY: number, direction: number) {
    const svg = svgRef.current
    if (!svg) return
    const [pointX, pointY] = toView(clientX, clientY, svg.getBoundingClientRect())
    setMapView((previous) => {
      const nextScale = Math.min(12, Math.max(1, previous.scale * (direction > 0 ? 1.22 : 1 / 1.22)))
      const ratio = nextScale / previous.scale
      return clampMapView({ scale: nextScale, x: pointX - (pointX - previous.x) * ratio, y: pointY - (pointY - previous.y) * ratio })
    })
  }

  function pickAtClientPoint(clientX: number, clientY: number) {
    if (reviewed) return
    const svg = svgRef.current
    if (!svg) return
    const [viewX, viewY] = toView(clientX, clientY, svg.getBoundingClientRect())
    const point: [number, number] = [(viewX - mapView.x) / mapView.scale, (viewY - mapView.y) / mapView.scale]
    const lonLat = projection.invert?.(point)
    if (!lonLat) return
    const picked = worldCountryFeatures.find((feature) => geoContains(feature, lonLat))
    if (picked) onToggle(normalizeName(picked.properties.name))
  }

  function capturePointer(event: ReactPointerEvent<SVGSVGElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // best-effort
    }
  }

  function beginPinch() {
    const svg = svgRef.current
    const [a, b] = [...pointersRef.current.values()]
    if (!svg || !a || !b) return
    dragRef.current = null
    const rect = svg.getBoundingClientRect()
    const startDist = Math.hypot(a.x - b.x, a.y - b.y)
    const [mx, my] = toView((a.x + b.x) / 2, (a.y + b.y) / 2, rect)
    pinchRef.current = { startDist, startScale: mapView.scale, anchor: [(mx - mapView.x) / mapView.scale, (my - mapView.y) / mapView.scale] }
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1)
  }

  // Match Countries of the World: only capture the pointer to pan/pinch. A plain scale-1 tap
  // is left to the per-country onClick (immediate select), so it isn't retargeted to the SVG.
  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointersRef.current.size >= 2) {
      capturePointer(event)
      beginPinch()
    } else if (mapView.scale > 1) {
      capturePointer(event)
      dragRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, moved: false, view: mapView }
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    if (pointersRef.current.has(event.pointerId)) pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const rect = svg.getBoundingClientRect()

    const pinch = pinchRef.current
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const nextScale = Math.min(12, Math.max(1, (pinch.startScale * dist) / (pinch.startDist || 1)))
      const [mx, my] = toView((a.x + b.x) / 2, (a.y + b.y) / 2, rect)
      setMapView(clampMapView({ scale: nextScale, x: mx - pinch.anchor[0] * nextScale, y: my - pinch.anchor[1] * nextScale }))
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || mapView.scale <= 1) return
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 4) drag.moved = true
    const dx = ((event.clientX - drag.clientX) / rect.width) * MAP_WIDTH
    const dy = ((event.clientY - drag.clientY) / rect.height) * MAP_HEIGHT
    setMapView(clampMapView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy }))
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    const drag = dragRef.current
    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null
      if (!drag.moved && mapView.scale > 1) pickAtClientPoint(event.clientX, event.clientY)
    }
    if (pointersRef.current.size === 1 && mapView.scale > 1) {
      const [id, pos] = [...pointersRef.current.entries()][0]
      dragRef.current = { pointerId: id, clientX: pos.x, clientY: pos.y, moved: true, view: mapView }
    }
  }

  function setZoom(direction: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, direction)
  }

  return (
    <div className="map-shell">
      <div className="map-zoom-controls" aria-label="Map zoom controls">
        <button type="button" onClick={() => setZoom(1)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(-1)} aria-label="Zoom out">-</button>
        <button type="button" onClick={() => setMapView(defaultMapView)} aria-label="Reset zoom">{mapView.scale.toFixed(1)}x</button>
      </div>
      <svg
        ref={svgRef}
        className={mapView.scale > 1 ? 'map map-zoomed' : 'map'}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="Colonies map"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} className="ocean" />
        <g transform={mapTransform}>
          {shapes.map((shape) => {
            const isSelected = selection.has(shape.key)
            const isExpected = expectedByName.has(shape.key)
            const klass = [
              'country',
              !reviewed ? 'country-clickable' : '',
              !reviewed && isSelected ? 'country-selected' : '',
              reviewed && isExpected && isSelected ? 'country-hit' : '',
              reviewed && isExpected && !isSelected ? 'country-missed' : '',
              reviewed && !isExpected && isSelected ? 'country-wrong' : '',
            ].filter(Boolean).join(' ')
            return <path key={shape.name} className={klass} d={shape.d} onClick={!reviewed && mapView.scale <= 1 ? () => onToggle(shape.key) : undefined} />
          })}
        </g>
      </svg>
    </div>
  )
}
