import { useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import { geoAlbersUsa, geoEqualEarth, geoMercator, geoPath } from 'd3-geo'
import { BookOpen, Check, ChevronRight, Globe2, Image, MapPinned, RotateCcw, X } from 'lucide-react'
import countries110m from 'world-atlas/countries-110m.json'
import frDepartments from './data/geo/fr-departments.json'
import frRegions from './data/geo/fr-regions.json'
import ukAdmin from './data/geo/uk-counties-unitaries-2022.json'
import './App.css'
import { topics, type MapScope, type QuizItem, type QuizMode, type Topic } from './data/curriculum'

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>
type BoundaryFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, string | number | null>>

type Score = {
  attempts: number
  correct: number
  streak: number
  bestStreak: number
}

type AnswerResult = {
  id: string
  ok: boolean
  prompt: string
  submitted: string
  expected: string
  detail?: string
}

type RoundState = {
  index: number
  roundId: number
}

const WIDTH = 960
const HEIGHT = 560

const defaultModeLabels: Record<QuizMode, string> = {
  'map-click': 'Click location',
  'map-type': 'Name highlighted',
  type: 'Typed recall',
  choice: 'Multiple choice',
  image: 'Image typing',
}

function modeLabel(topic: Topic, mode: QuizMode) {
  if (topic.id === 'paintings') {
    if (mode === 'image') return 'Image: type title or artist'
    if (mode === 'choice') return 'Image: choose artist'
  }

  return defaultModeLabels[mode]
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function itemAnswer(item: QuizItem, mode: QuizMode) {
  if (mode === 'type' || mode === 'choice') return item.answer ?? item.name
  return item.name
}

function displayAnswer(item: QuizItem, mode: QuizMode) {
  if (mode === 'image' && item.answer) return `${item.name} / ${item.answer}`
  return itemAnswer(item, mode)
}

function matchesAnswer(input: string, item: QuizItem, mode: QuizMode) {
  const clean = normalize(input)
  const answers = [itemAnswer(item, mode), item.name, item.answer, ...(item.aliases ?? [])].filter(Boolean).map((answer) => normalize(String(answer)))
  return answers.includes(clean)
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function scoreKey(topic: Topic, mode: QuizMode) {
  return `${topic.id}:${mode}`
}

function roundKey(topic: Topic, mode: QuizMode) {
  return scoreKey(topic, mode)
}

function loadScores(): Record<string, Score> {
  try {
    return JSON.parse(localStorage.getItem('culture-quizzer-scores') ?? '{}')
  } catch {
    return {}
  }
}

function saveScores(scores: Record<string, Score>) {
  localStorage.setItem('culture-quizzer-scores', JSON.stringify(scores))
}

function buildProjection(scope: MapScope) {
  if (scope === 'usa') {
    return geoAlbersUsa().translate([WIDTH / 2, HEIGHT / 2]).scale(1080)
  }

  const projection = scope === 'world' ? geoEqualEarth() : geoMercator()
  if (scope === 'world') return projection.translate([WIDTH / 2, HEIGHT / 2]).scale(168)
  if (scope === 'europe') return projection.center([10, 51]).scale(760).translate([WIDTH / 2, HEIGHT / 2])
  if (scope === 'uk') return projection.center([-3.3, 55.2]).scale(2450).translate([WIDTH / 2, HEIGHT / 2])
  return projection.center([2.7, 46.4]).scale(1900).translate([WIDTH / 2, HEIGHT / 2])
}

function countryItemsFromFeatures(features: CountryFeature[]): QuizItem[] {
  return features
    .map((country) => ({
      id: normalize(country.properties.name).replaceAll(' ', '-'),
      name: country.properties.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function asFeatures(collection: unknown): BoundaryFeature[] {
  return (collection as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number | null>>).features
}

const boundaryFeatures = {
  'fr-departments': asFeatures(frDepartments),
  'fr-regions': asFeatures(frRegions),
  'uk-admin': asFeatures(ukAdmin),
}

function boundaryName(featureItem: BoundaryFeature) {
  const properties = featureItem.properties
  return String(properties.nom ?? properties.CTYUA22NM ?? properties.name ?? '')
}

function promptLabel(topic: Topic, mode: QuizMode, item: QuizItem) {
  if (topic.id === 'paintings' && mode === 'image') return 'Painting image'
  if (topic.id === 'paintings' && mode === 'choice') return 'Painting artist'
  if (mode === 'map-click') return `Click ${item.name}`
  if (mode === 'map-type') return 'Highlighted target'
  return item.prompt ?? item.name
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TopicIcon({ topic }: { topic: Topic }) {
  if (topic.group === 'Art') return <Image size={18} />
  if (topic.group === 'Geography') return <MapPinned size={18} />
  return <BookOpen size={18} />
}

function CultureMap({
  topic,
  mode,
  current,
  items,
  countries,
  onPick,
}: {
  topic: Topic
  mode: QuizMode
  current: QuizItem
  items: QuizItem[]
  countries: CountryFeature[]
  onPick: (item: QuizItem) => void
}) {
  const projection = useMemo(() => buildProjection(topic.mapScope ?? 'world'), [topic.mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const countriesByName = useMemo(() => new Map(countries.map((country) => [normalize(country.properties.name), country])), [countries])
  const boundaries = useMemo(() => (topic.boundaryLayer ? boundaryFeatures[topic.boundaryLayer] : []), [topic.boundaryLayer])
  const itemsByName = useMemo(() => new Map(items.map((item) => [normalize(item.name), item])), [items])
  const currentBoundary = useMemo(() => boundaries.find((boundary) => normalize(boundaryName(boundary)) === normalize(current.name)), [boundaries, current.name])

  const currentCountry = topic.mapKind === 'country-polygons' ? countriesByName.get(normalize(current.name)) : undefined
  const canClickBoundaries = Boolean(topic.boundaryLayer?.startsWith('fr-') && mode === 'map-click')

  return (
    <div className="map-shell">
      <svg className="map" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${topic.title} map quiz`}>
        <rect width={WIDTH} height={HEIGHT} rx="0" className="ocean" />
        <g>
          {countries.map((country) => {
            const name = country.properties.name
            const isTarget = normalize(name) === normalize(current.name)
            const isInteractive = topic.mapKind === 'country-polygons' && mode === 'map-click'
            const klass = [
              'country',
              isInteractive ? 'country-clickable' : '',
              mode === 'map-type' && isTarget ? 'target-country' : '',
            ].join(' ')

            return (
              <path
                key={name}
                className={klass}
                d={path(country) ?? undefined}
                onClick={isInteractive ? () => onPick({ id: normalize(name), name }) : undefined}
              />
            )
          })}
        </g>

        {boundaries.length ? (
          <g className="boundary-layer">
            {boundaries.map((boundary, index) => {
              const name = boundaryName(boundary)
              const isTarget = normalize(name) === normalize(current.name)
              const matchedItem = itemsByName.get(normalize(name)) ?? { id: normalize(name), name }
              const klass = [
                'boundary-area',
                canClickBoundaries ? 'boundary-clickable' : '',
                mode === 'map-type' && isTarget ? 'target-boundary' : '',
              ].join(' ')

              return <path key={`${name}-${index}`} className={klass} d={path(boundary) ?? undefined} onClick={canClickBoundaries ? () => onPick(matchedItem) : undefined} />
            })}
          </g>
        ) : null}

        {topic.mapKind === 'country-polygons' && mode === 'map-type' && currentCountry ? (
          <path className="target-outline" d={path(currentCountry) ?? undefined} />
        ) : null}

        {topic.mapKind === 'points' && mode === 'map-type' && currentBoundary ? <path className="target-outline" d={path(currentBoundary) ?? undefined} /> : null}

        {topic.mapKind === 'points'
          ? items.map((item) => {
              if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return null
              const point = projection([item.lon, item.lat])
              if (!point) return null
              const isTarget = item.id === current.id
              const pointClass = [
                'map-point',
                mode === 'map-click' ? 'map-point-clickable' : '',
                mode === 'map-type' && isTarget ? 'map-point-target' : '',
              ].join(' ')
              return (
                <g key={item.id} transform={`translate(${point[0]} ${point[1]})`} onClick={mode === 'map-click' ? () => onPick(item) : undefined}>
                  {mode === 'map-click' ? <circle className="map-point-hit" r={9} /> : null}
                  <circle className={pointClass} r={isTarget && mode !== 'map-click' ? 5 : 3} />
                  {isTarget && mode !== 'map-click' ? <circle className="map-point-pulse" r={10} /> : null}
                </g>
              )
            })
          : null}
      </svg>
    </div>
  )
}

function QuizPanel({
  topic,
  mode,
  item,
  pool,
  history,
  onSubmit,
  onNext,
}: {
  topic: Topic
  mode: QuizMode
  item: QuizItem
  pool: QuizItem[]
  history: AnswerResult[]
  onSubmit: (value: string) => void
  onNext: () => void
}) {
  const [input, setInput] = useState('')
  const options = useMemo(() => {
    const answer = itemAnswer(item, mode)
    const distractors = shuffle(pool.filter((candidate) => candidate.id !== item.id).map((candidate) => itemAnswer(candidate, mode))).slice(0, 3)
    return shuffle([answer, ...distractors])
  }, [item, mode, pool])

  const title =
    topic.id === 'paintings' && mode === 'image'
      ? 'Name this painting or artist'
      : topic.id === 'paintings' && mode === 'choice'
        ? 'Choose the artist'
        : mode === 'map-click'
          ? `Click: ${item.name}`
          : mode === 'map-type'
            ? 'Name the highlighted target'
            : mode === 'image'
              ? item.prompt ?? 'Name this work or artist'
              : item.prompt ?? `Answer for ${item.name}`

  return (
    <section className="quiz-panel">
      <div className="prompt-row">
        <div>
          <span className="eyebrow">{modeLabel(topic, mode)}</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onNext} aria-label="Skip">
          <ChevronRight size={18} />
        </button>
      </div>

      {mode === 'image' && item.imageUrl && topic.mapKind ? <img className="quiz-image" src={item.imageUrl} alt="Quiz prompt" /> : null}

      {mode === 'choice' ? (
        <div className="choice-grid">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSubmit(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'type' || mode === 'map-type' || mode === 'image' ? (
        <form
          className="answer-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (input.trim()) onSubmit(input)
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && input.trim()) {
                event.preventDefault()
                onSubmit(input)
              }
            }}
            placeholder="Type the answer"
            autoComplete="off"
            autoFocus
          />
          <button type="submit" disabled={!input.trim()}>
            Check
          </button>
        </form>
      ) : null}

      <p className="coverage">{topic.coverage}</p>

      {history.length ? (
        <div className="answer-history" aria-label="Answer history">
          {history.map((result) => (
            <article key={result.id} className={result.ok ? 'history-card history-ok' : 'history-card history-bad'}>
              <span>{result.ok ? <Check size={16} /> : <X size={16} />}</span>
              <div>
                <strong>{result.prompt}</strong>
                <p>
                  You answered <b>{result.submitted}</b>. {result.ok ? 'Correct.' : `Answer: ${result.expected}.`}
                </p>
                {result.detail ? <small>{result.detail}</small> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function App() {
  const countryFeatures = useMemo(() => {
    const collection = feature(countries110m as never, (countries110m as never as { objects: { countries: never } }).objects.countries)
    return (collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>).features
  }, [])

  const fullTopics = useMemo<Topic[]>(() => {
    const countryTopicItems = countryItemsFromFeatures(countryFeatures)
    return topics.map((topic) => (topic.id === 'world-countries' ? { ...topic, items: countryTopicItems } : topic))
  }, [countryFeatures])

  const [topicId, setTopicId] = useState(fullTopics[0].id)
  const activeTopic = fullTopics.find((topic) => topic.id === topicId) ?? fullTopics[0]
  const [mode, setMode] = useState<QuizMode>(activeTopic.modes[0])
  const [scores, setScores] = useState<Record<string, Score>>(() => loadScores())
  const [histories, setHistories] = useState<Record<string, AnswerResult[]>>({})
  const [roundStates, setRoundStates] = useState<Record<string, RoundState>>(() => ({
    [roundKey(fullTopics[0], fullTopics[0].modes[0])]: { index: 0, roundId: 0 },
  }))

  const pool = activeTopic.items
  const activeRoundKey = roundKey(activeTopic, mode)
  const activeRound = roundStates[activeRoundKey] ?? { index: 0, roundId: 0 }
  const current = pool[Math.min(activeRound.index, Math.max(pool.length - 1, 0))] ?? pool[0]
  const activeScore = scores[scoreKey(activeTopic, mode)] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
  const activeHistory = histories[activeRoundKey] ?? []
  const accuracy = activeScore.attempts ? Math.round((activeScore.correct / activeScore.attempts) * 100) : 0

  function advanceRound() {
    setRoundStates((previous) => ({
      ...previous,
      [activeRoundKey]: {
        index: Math.floor(Math.random() * pool.length),
        roundId: (previous[activeRoundKey]?.roundId ?? 0) + 1,
      },
    }))
  }

  function record(submitted: string, ok: boolean, expected: string, detail?: string) {
    const key = scoreKey(activeTopic, mode)
    const previous = scores[key] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
    const streak = ok ? previous.streak + 1 : 0
    const updated = {
      ...scores,
      [key]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (ok ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      },
    }
    setScores(updated)
    saveScores(updated)
    setHistories((previousHistories) => ({
      ...previousHistories,
      [activeRoundKey]: [
        {
          id: `${activeRoundKey}:${activeRound.roundId}:${Date.now()}`,
          ok,
          prompt: promptLabel(activeTopic, mode, current),
          submitted,
          expected,
          detail,
        },
        ...(previousHistories[activeRoundKey] ?? []),
      ].slice(0, 20),
    }))
    advanceRound()
  }

  function submit(value: string) {
    record(value, matchesAnswer(value, current, mode), displayAnswer(current, mode), current.detail)
  }

  function pickMapItem(item: QuizItem) {
    record(item.name, matchesAnswer(item.name, current, mode), current.name, current.detail)
  }

  function nextRound() {
    advanceRound()
  }

  function activateMode(topic: Topic, nextMode: QuizMode) {
    const nextKey = roundKey(topic, nextMode)
    setMode(nextMode)
    setRoundStates((previous) => {
      if (previous[nextKey]) return previous
      return {
        ...previous,
        [nextKey]: { index: Math.min(current ? pool.indexOf(current) : 0, Math.max(topic.items.length - 1, 0)), roundId: 0 },
      }
    })
  }

  function activateTopic(topic: Topic) {
    const nextMode = topic.modes[0]
    const nextKey = roundKey(topic, nextMode)
    setTopicId(topic.id)
    setMode(nextMode)
    setRoundStates((previous) => {
      if (previous[nextKey]) return previous
      return {
        ...previous,
        [nextKey]: { index: Math.floor(Math.random() * topic.items.length), roundId: 0 },
      }
    })
  }

  function resetScores() {
    localStorage.removeItem('culture-quizzer-scores')
    setScores({})
    setHistories({})
  }

  const grouped = useMemo(() => {
    return fullTopics.reduce<Record<string, Topic[]>>((acc, topic) => {
      acc[topic.group] ??= []
      acc[topic.group].push(topic)
      return acc
    }, {})
  }, [fullTopics])

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Globe2 size={24} />
          <div>
            <strong>Culture Quizzer</strong>
            <span>Broad knowledge practice</span>
          </div>
        </div>

        <nav className="topic-list" aria-label="Quiz topics">
          {Object.entries(grouped).map(([group, groupTopics]) => (
            <section key={group}>
              <h3>{group}</h3>
              {groupTopics.map((topic) => (
                <button
                  key={topic.id}
                  className={topic.id === activeTopic.id ? 'topic-button active' : 'topic-button'}
                  type="button"
                  onClick={() => activateTopic(topic)}
                >
                  <TopicIcon topic={topic} />
                  <span>{topic.title}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{activeTopic.title}</h1>
            <p>{activeTopic.description}</p>
          </div>
          <button className="reset-button" type="button" onClick={resetScores}>
            <RotateCcw size={16} />
            Reset scores
          </button>
        </header>

        <div className="mode-control">
          <span>Quiz type</span>
          <div className="mode-row" role="tablist" aria-label="Quiz type">
            {activeTopic.modes.map((availableMode) => (
              <button
                key={availableMode}
                className={availableMode === mode ? 'mode-button active' : 'mode-button'}
                type="button"
                onClick={() => activateMode(activeTopic, availableMode)}
              >
                {modeLabel(activeTopic, availableMode)}
              </button>
            ))}
          </div>
        </div>

        <section className="score-strip" aria-label="Current score">
          <Stat label="Deck" value={pool.length} />
          <Stat label="Correct" value={activeScore.correct} />
          <Stat label="Attempts" value={activeScore.attempts} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Best streak" value={activeScore.bestStreak} />
        </section>

        <div className={activeTopic.mapKind ? 'practice-grid with-map' : 'practice-grid'}>
          {activeTopic.mapKind ? (
            <CultureMap topic={activeTopic} mode={mode} current={current} items={pool} countries={countryFeatures} onPick={pickMapItem} />
          ) : (
            <section className={current.imageUrl ? 'study-surface image-surface' : 'study-surface'}>
              {current.imageUrl ? <img src={current.imageUrl} alt="Quiz prompt" /> : null}
              {!current.imageUrl ? (
                <>
                  <BookOpen size={36} />
                  <h2>Question ready</h2>
                  <p>Use the quiz panel to answer. The correct answer appears only after you submit.</p>
                </>
              ) : null}
            </section>
          )}

          <QuizPanel
            key={`${activeRoundKey}:${activeRound.roundId}`}
            topic={activeTopic}
            mode={mode}
            item={current}
            pool={pool}
            history={activeHistory}
            onSubmit={submit}
            onNext={nextRound}
          />
        </div>
      </section>
    </main>
  )
}

export default App
