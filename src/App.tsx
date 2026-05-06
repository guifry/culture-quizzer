import { useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import { geoAlbersUsa, geoEqualEarth, geoMercator, geoPath } from 'd3-geo'
import { BookOpen, Check, ChevronRight, Globe2, Image, MapPinned, RotateCcw, Target, X } from 'lucide-react'
import countries110m from 'world-atlas/countries-110m.json'
import './App.css'
import { topics, type MapScope, type QuizItem, type QuizMode, type Topic } from './data/curriculum'

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>

type Score = {
  attempts: number
  correct: number
  streak: number
  bestStreak: number
}

type Feedback = {
  ok: boolean
  expected: string
  detail?: string
}

const WIDTH = 960
const HEIGHT = 560

const modeLabels: Record<QuizMode, string> = {
  'map-click': 'Click map',
  'map-type': 'Name target',
  type: 'Type answer',
  choice: 'Multiple choice',
  image: 'Image',
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

function matchesAnswer(input: string, item: QuizItem, mode: QuizMode) {
  const clean = normalize(input)
  const answers = [itemAnswer(item, mode), item.name, ...(item.aliases ?? [])].map(normalize)
  return answers.includes(clean)
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function scoreKey(topic: Topic, mode: QuizMode) {
  return `${topic.id}:${mode}`
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
  feedback,
}: {
  topic: Topic
  mode: QuizMode
  current: QuizItem
  items: QuizItem[]
  countries: CountryFeature[]
  onPick: (item: QuizItem) => void
  feedback?: Feedback | null
}) {
  const projection = useMemo(() => buildProjection(topic.mapScope ?? 'world'), [topic.mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const countriesByName = useMemo(() => new Map(countries.map((country) => [normalize(country.properties.name), country])), [countries])

  const currentCountry = topic.mapKind === 'country-polygons' ? countriesByName.get(normalize(current.name)) : undefined

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
              feedback && isTarget ? (feedback.ok ? 'correct-country' : 'wrong-country') : '',
            ].join(' ')

            return (
              <path
                key={name}
                className={klass}
                d={path(country) ?? undefined}
                onClick={isInteractive ? () => onPick({ id: normalize(name), name }) : undefined}
              >
                <title>{name}</title>
              </path>
            )
          })}
        </g>

        {topic.mapKind === 'country-polygons' && mode === 'map-type' && currentCountry ? (
          <path className="target-outline" d={path(currentCountry) ?? undefined} />
        ) : null}

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
                feedback && isTarget ? (feedback.ok ? 'map-point-correct' : 'map-point-wrong') : '',
              ].join(' ')
              return (
                <g key={item.id} transform={`translate(${point[0]} ${point[1]})`} onClick={mode === 'map-click' ? () => onPick(item) : undefined}>
                  <circle className={pointClass} r={isTarget && mode !== 'map-click' ? 8 : 5} />
                  {isTarget && mode !== 'map-click' ? <circle className="map-point-pulse" r={15} /> : null}
                  <title>{item.name}</title>
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
  onSubmit,
  onNext,
  feedback,
}: {
  topic: Topic
  mode: QuizMode
  item: QuizItem
  pool: QuizItem[]
  onSubmit: (value: string) => void
  onNext: () => void
  feedback: Feedback | null
}) {
  const [input, setInput] = useState('')
  const options = useMemo(() => {
    const answer = itemAnswer(item, mode)
    const distractors = shuffle(pool.filter((candidate) => candidate.id !== item.id).map((candidate) => itemAnswer(candidate, mode))).slice(0, 3)
    return shuffle([answer, ...distractors])
  }, [item, mode, pool])

  const title =
    mode === 'map-click'
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
          <span className="eyebrow">{modeLabels[mode]}</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onNext} aria-label="Skip">
          <ChevronRight size={18} />
        </button>
      </div>

      {mode === 'image' && item.imageUrl ? <img className="quiz-image" src={item.imageUrl} alt={item.name} /> : null}

      {mode === 'choice' ? (
        <div className="choice-grid">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSubmit(option)} disabled={Boolean(feedback)}>
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
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type the answer" autoComplete="off" />
          <button type="submit" disabled={!input.trim() || Boolean(feedback)}>
            Check
          </button>
        </form>
      ) : null}

      {feedback ? (
        <div className={feedback.ok ? 'feedback feedback-ok' : 'feedback feedback-bad'}>
          <span>{feedback.ok ? <Check size={18} /> : <X size={18} />}</span>
          <div>
            <strong>{feedback.ok ? 'Correct' : `Answer: ${feedback.expected}`}</strong>
            {feedback.detail ? <p>{feedback.detail}</p> : null}
          </div>
          <button type="button" onClick={onNext}>
            Next
          </button>
        </div>
      ) : null}

      <p className="coverage">{topic.coverage}</p>
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
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [roundState, setRoundState] = useState(() => ({
    topicId: fullTopics[0].id,
    mode: fullTopics[0].modes[0],
    index: 0,
    roundId: 0,
  }))

  const pool = activeTopic.items
  const current = pool[Math.min(roundState.index, Math.max(pool.length - 1, 0))] ?? pool[0]
  const activeScore = scores[scoreKey(activeTopic, mode)] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
  const accuracy = activeScore.attempts ? Math.round((activeScore.correct / activeScore.attempts) * 100) : 0

  function record(ok: boolean, expected: string, detail?: string) {
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
    setFeedback({ ok, expected, detail })
  }

  function submit(value: string) {
    if (feedback) return
    record(matchesAnswer(value, current, mode), itemAnswer(current, mode), current.detail)
  }

  function pickMapItem(item: QuizItem) {
    if (feedback) return
    record(matchesAnswer(item.name, current, mode), current.name, current.detail)
  }

  function nextRound() {
    setFeedback(null)
    setRoundState((previous) => ({
      topicId: activeTopic.id,
      mode,
      index: Math.floor(Math.random() * pool.length),
      roundId: previous.roundId + 1,
    }))
  }

  function resetScores() {
    localStorage.removeItem('culture-quizzer-scores')
    setScores({})
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
                  onClick={() => {
                    setTopicId(topic.id)
                    setMode(topic.modes[0])
                    setFeedback(null)
                    setRoundState((previous) => ({
                      topicId: topic.id,
                      mode: topic.modes[0],
                      index: Math.floor(Math.random() * topic.items.length),
                      roundId: previous.roundId + 1,
                    }))
                  }}
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

        <div className="mode-row" role="tablist" aria-label="Quiz mode">
          {activeTopic.modes.map((availableMode) => (
            <button
              key={availableMode}
              className={availableMode === mode ? 'mode-button active' : 'mode-button'}
              type="button"
              onClick={() => {
                setMode(availableMode)
                setFeedback(null)
                setRoundState((previous) => ({
                  topicId: activeTopic.id,
                  mode: availableMode,
                  index: Math.floor(Math.random() * pool.length),
                  roundId: previous.roundId + 1,
                }))
              }}
            >
              {modeLabels[availableMode]}
            </button>
          ))}
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
            <CultureMap topic={activeTopic} mode={mode} current={current} items={pool} countries={countryFeatures} onPick={pickMapItem} feedback={feedback} />
          ) : (
            <section className="study-surface">
              <Target size={36} />
              <h2>{current.name}</h2>
              <p>{current.detail ?? 'Use the quiz panel to test recall. This deck is deliberately concise and meant for repetition.'}</p>
            </section>
          )}

          <QuizPanel
            key={`${roundState.topicId}:${roundState.mode}:${roundState.roundId}`}
            topic={activeTopic}
            mode={mode}
            item={current}
            pool={pool}
            onSubmit={submit}
            onNext={nextRound}
            feedback={feedback}
          />
        </div>
      </section>
    </main>
  )
}

export default App
