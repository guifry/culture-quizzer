import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { feature } from 'topojson-client'
import { geoContains, geoPath } from 'd3-geo'
import { BookOpen, Check, ChevronRight, Globe2, Image, MapPinned, Menu, RotateCcw, X } from 'lucide-react'
import countries110m from 'world-atlas/countries-110m.json'
import usStatesAtlas from 'us-atlas/states-10m.json'
import frDepartments from './data/geo/fr-departments.json'
import frRegions from './data/geo/fr-regions.json'
import ukAdmin from './data/geo/uk-counties-unitaries-2022.json'
import seas from './data/geo/seas.json'
import { seaMeta } from './data/geo/seas-meta'
import './App.css'
import { topics, type QuizItem, type QuizMode, type Topic } from './data/curriculum'
import { resolveImageUrl, shuffle, stripTrailingPunctuation } from './utils'
import { HistoryDateQuiz } from './components/HistoryDateQuiz'
import { ColoniesQuiz } from './components/ColoniesQuiz'
import { CityQuiz } from './components/CityQuiz'
import { CityCourse } from './components/CityCourse'
import { LandmarkQuiz } from './components/LandmarkQuiz'
import { LandmarkCourse } from './components/LandmarkCourse'
import { PaintingQuiz } from './components/PaintingQuiz'
import { PaintingCourse } from './components/PaintingCourse'
import { WIDTH, HEIGHT, defaultMapView, buildProjection, type MapView } from './map/projection'

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
  expectedName: string
  submittedName: string
  expectedCode?: string
  submittedCode?: string
  insight?: AnswerInsight
  sequence?: SequenceResult
}

type AnswerInsight = {
  location?: string
  fact?: string
  note?: string
}

type PageView = 'practice' | 'course' | 'questions'
type CountryScope = 'world' | 'europe' | 'latin-america' | 'asia' | 'oceania' | 'africa'

type CourseSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

type CourseArticle = {
  title: string
  deckLabel: string
  lede: string
  sections: CourseSection[]
  takeaways: string[]
}

type SequenceResult = {
  planets: Array<{
    expected: string
    submitted: string
    ok: boolean
  }>
  belt: {
    expected: string
    submitted: string
    ok: boolean
  }
  correctCount: number
  total: number
}

type RoundState = {
  index: number
  roundId: number
  order: number[]
  position: number
  deckKey: string
  completed?: boolean
}

const defaultModeLabels: Record<QuizMode, string> = {
  'map-click': 'Click location',
  'map-number': 'Locate by number',
  'map-type': 'Name highlighted',
  'map-multi': 'Select colonies',
  type: 'Typed recall',
  choice: 'Multiple choice',
  image: 'Image typing',
  sequence: 'Order quiz',
  'date-recall': 'Event → date',
  'event-recall': 'Date → event',
  'city-locate': 'Locate',
  'city-photos': 'Photos',
  'city-clue': 'Clue',
  'landmark-locate': 'Locate',
  'landmark-photos': 'Photos',
  'landmark-clue': 'Clue',
  'paintings-identify': 'Identify',
  'paintings-clue': 'Clue',
  'paintings-expert': 'Expert',
}

function isHistoryDateTopic(topic: Topic) {
  return topic.kind === 'history-dates'
}

function isColoniesTopic(topic: Topic) {
  return topic.kind === 'colonies'
}

function isCityTopic(topic: Topic) {
  return topic.kind === 'city-quiz'
}

function isLandmarkTopic(topic: Topic) {
  return topic.kind === 'landmark-quiz'
}

function isPaintingTopic(topic: Topic) {
  return topic.kind === 'paintings-quiz'
}

// City, landmark and painting games share the same "Play / Course" shell (no generic
// engine, no questions view, own score strip).
function isCoursePairTopic(topic: Topic) {
  return isCityTopic(topic) || isLandmarkTopic(topic) || isPaintingTopic(topic)
}

function modeLabel(topic: Topic, mode: QuizMode) {
  if (mode === 'type' && (topic.id === 'french-regions' || topic.id === 'french-departments')) {
    return 'Recall biggest city'
  }

  if (topic.id === 'us-cities') {
    if (mode === 'map-click') return 'Locate the state'
    if (mode === 'type') return 'Type the city'
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
  return item.label ?? itemAnswer(item, mode)
}

function removeLabel(value: string, label: string) {
  return value.replace(new RegExp(`^${label}:\\s*`, 'i'), '')
}

function answerInsight(item: QuizItem): AnswerInsight | undefined {
  const randomFact = item.facts?.length ? item.facts[Math.floor(Math.random() * item.facts.length)] : undefined
  const insight = {
    location: item.location ? removeLabel(item.location, 'Location') : undefined,
    fact: randomFact,
    note: item.detail,
  }

  return insight.location || insight.fact || insight.note ? insight : undefined
}

function matchesAnswer(input: string, item: QuizItem, mode: QuizMode) {
  const clean = normalize(input)
  const answers = [itemAnswer(item, mode), item.name, item.answer, ...(item.aliases ?? [])].filter(Boolean).map((answer) => normalize(String(answer)))
  return answers.includes(clean)
}

function matchesAsteroidBelt(input: string) {
  const clean = normalize(input)
  return clean.includes('mars') && clean.includes('jupiter')
}

function isMapMode(mode: QuizMode) {
  return mode === 'map-click' || mode === 'map-type' || mode === 'map-number'
}

function isMetropolitanFrance(item: QuizItem) {
  return typeof item.lat === 'number' && typeof item.lon === 'number' &&
    item.lat >= 41 && item.lat <= 52 &&
    item.lon >= -5 && item.lon <= 10
}

function poolForTopic(topic: Topic, mode: QuizMode, scope: string = 'world', usGuess: UsGuess = 'capital') {
  if (topic.id === 'world-countries') {
    return countryItemsForScope(scope as CountryScope, topic.items)
  }
  if (topic.id === 'us-states' || topic.id === 'seas') {
    return scope === 'all' ? topic.items : topic.items.filter((item) => item.region === scope)
  }
  if (topic.id === 'us-cities') {
    const filtered = scope === 'all' ? topic.items : topic.items.filter((item) => item.region === scope)
    return filtered.map((item) =>
      usGuess === 'main'
        ? { ...item, answer: item.mainCity, prompt: `Biggest city of ${item.name}` }
        : { ...item, prompt: `Capital of ${item.name}` },
    )
  }
  if (topic.id === 'french-departments') {
    const filtered = scope === 'all' ? topic.items : topic.items.filter((item) => item.region === scope)
    return isMapMode(mode) ? filtered.filter(isMetropolitanFrance) : filtered
  }
  if (isMapMode(mode) && topic.mapScope === 'france') {
    return topic.items.filter(isMetropolitanFrance)
  }
  return topic.items
}

function createRoundState(pool: QuizItem[], roundId = 0, firstIndex?: number): RoundState {
  if (!pool.length) {
    return {
      index: 0,
      roundId,
      order: [],
      position: 0,
      deckKey: deckKey(pool),
      completed: true,
    }
  }

  const indexes = pool.map((_, index) => index)
  const order = shuffle(indexes)
  const validFirstIndex = typeof firstIndex === 'number' && firstIndex >= 0 && firstIndex < pool.length ? firstIndex : undefined
  const ordered = validFirstIndex === undefined ? order : [validFirstIndex, ...order.filter((index) => index !== validFirstIndex)]

  return {
    index: ordered[0],
    roundId,
    order: ordered,
    position: 0,
    deckKey: deckKey(pool),
    completed: false,
  }
}

function ensureRoundState(state: RoundState | undefined, pool: QuizItem[]) {
  if (!isRoundStateValid(state, pool)) {
    return createRoundState(pool, state?.roundId ?? 0, state?.index)
  }

  return state as RoundState
}

function isRoundStateValid(state: RoundState | undefined, pool: QuizItem[]) {
  if (!state?.order?.length) return false
  const uniqueOrder = new Set(state?.order ?? [])

  return (
    state.deckKey === deckKey(pool) &&
    state.order.length === pool.length &&
    uniqueOrder.size === state.order.length &&
    state.position >= 0 &&
    state.position < state.order.length &&
    state.order.every((index) => index >= 0 && index < pool.length)
  )
}

function deckKey(pool: QuizItem[]) {
  return pool.map((item) => item.id).join('|')
}

function clampMapView(view: MapView): MapView {
  if (view.scale <= 1) return defaultMapView
  const minX = WIDTH - WIDTH * view.scale
  const minY = HEIGHT - HEIGHT * view.scale

  return {
    scale: view.scale,
    x: Math.min(0, Math.max(minX, view.x)),
    y: Math.min(0, Math.max(minY, view.y)),
  }
}

function scoreKey(topic: Topic, mode: QuizMode, scope: string = 'world', usGuess: UsGuess = 'capital') {
  if (topic.id === 'world-countries' || topic.id === 'us-states' || topic.id === 'seas') {
    return `${topic.id}:${scope}:${mode}`
  }
  if (topic.id === 'us-cities') {
    return `${topic.id}:${scope}:${usGuess}:${mode}`
  }
  if (topic.id === 'french-departments') {
    return `${topic.id}:${scope}:${mode}`
  }
  return `${topic.id}:${mode}`
}

function roundKey(topic: Topic, mode?: QuizMode, scope: string = 'world', usGuess: UsGuess = 'capital') {
  if (topic.id === 'world-countries' || topic.id === 'us-states' || topic.id === 'seas') {
    return `${topic.id}:${scope}`
  }
  if (topic.id === 'us-cities') {
    return `${topic.id}:${scope}:${usGuess}`
  }
  if (topic.id === 'french-departments') {
    return mode && isMapMode(mode) ? `${topic.id}:${scope}:map` : `${topic.id}:${scope}:${mode}`
  }
  if (mode && isMapMode(mode) && topic.mapScope === 'france') {
    return `${topic.id}:map`
  }
  return topic.id
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

const territoryLabels: Record<string, string> = {
  'Puerto Rico': 'Puerto Rico (US territory)',
  'French Guiana': 'French Guiana (French territory)',
}

function countryItemsFromFeatures(features: CountryFeature[]): QuizItem[] {
  return features
    .map((country) => {
      const name = country.properties.name
      const label = territoryLabels[name]
      return { id: normalize(name).replaceAll(' ', '-'), name, ...(label ? { label } : {}) }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// The world-atlas France feature bundles French Guiana as a sub-polygon in South America.
// Split it into its own feature so it can be a distinct map target.
function splitFrenchGuiana(features: CountryFeature[]): CountryFeature[] {
  const france = features.find((feature) => feature.properties.name === 'France')
  if (!france || france.geometry.type !== 'MultiPolygon') return features
  const isGuiana = (polygon: GeoJSON.Position[][]) =>
    polygon[0].every(([lon, lat]) => lon >= -60 && lon <= -50 && lat >= 0 && lat <= 10)
  const guianaPolygons = france.geometry.coordinates.filter(isGuiana)
  const mainlandPolygons = france.geometry.coordinates.filter((polygon) => !isGuiana(polygon))
  if (!guianaPolygons.length) return features
  const nextFrance = { ...france, geometry: { type: 'MultiPolygon', coordinates: mainlandPolygons } } as CountryFeature
  const guiana = {
    type: 'Feature',
    properties: { name: 'French Guiana' },
    geometry: { type: 'MultiPolygon', coordinates: guianaPolygons },
  } as CountryFeature
  return features.map((feature) => (feature.properties.name === 'France' ? nextFrance : feature)).concat(guiana)
}

const countrySubsetNames = {
  europe: new Set([
    'Albania',
    'Austria',
    'Belarus',
    'Belgium',
    'Bosnia and Herz.',
    'Bulgaria',
    'Croatia',
    'Cyprus',
    'Czechia',
    'Denmark',
    'Estonia',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Ireland',
    'Italy',
    'Kosovo',
    'Latvia',
    'Lithuania',
    'Luxembourg',
    'Macedonia',
    'Moldova',
    'Montenegro',
    'N. Cyprus',
    'Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Romania',
    'Russia',
    'Serbia',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'Ukraine',
    'United Kingdom',
  ]),
  'latin-america': new Set([
    'Argentina',
    'Bahamas',
    'Belize',
    'Bolivia',
    'Brazil',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Cuba',
    'Dominican Rep.',
    'Ecuador',
    'El Salvador',
    'French Guiana',
    'Guatemala',
    'Guyana',
    'Haiti',
    'Honduras',
    'Jamaica',
    'Mexico',
    'Nicaragua',
    'Panama',
    'Paraguay',
    'Peru',
    'Puerto Rico',
    'Suriname',
    'Trinidad and Tobago',
    'Uruguay',
    'Venezuela',
  ]),
  asia: new Set([
    'Afghanistan',
    'Armenia',
    'Azerbaijan',
    'Bangladesh',
    'Bhutan',
    'Brunei',
    'Cambodia',
    'China',
    'Georgia',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Israel',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Lebanon',
    'Malaysia',
    'Mongolia',
    'Myanmar',
    'Nepal',
    'North Korea',
    'Oman',
    'Pakistan',
    'Palestine',
    'Philippines',
    'Qatar',
    'Saudi Arabia',
    'South Korea',
    'Sri Lanka',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Thailand',
    'Timor-Leste',
    'Turkey',
    'Turkmenistan',
    'United Arab Emirates',
    'Uzbekistan',
    'Vietnam',
    'Yemen',
  ]),
  oceania: new Set(['Australia', 'Fiji', 'New Caledonia', 'New Zealand', 'Papua New Guinea', 'Solomon Is.', 'Vanuatu']),
  africa: new Set([
    'Algeria',
    'Angola',
    'Benin',
    'Botswana',
    'Burkina Faso',
    'Burundi',
    'Cameroon',
    'Central African Rep.',
    'Chad',
    'Congo',
    "Côte d'Ivoire",
    'Dem. Rep. Congo',
    'Djibouti',
    'Egypt',
    'Eq. Guinea',
    'Eritrea',
    'Ethiopia',
    'Gabon',
    'Gambia',
    'Ghana',
    'Guinea',
    'Guinea-Bissau',
    'Kenya',
    'Lesotho',
    'Liberia',
    'Libya',
    'Madagascar',
    'Malawi',
    'Mali',
    'Mauritania',
    'Morocco',
    'Mozambique',
    'Namibia',
    'Niger',
    'Nigeria',
    'Rwanda',
    'S. Sudan',
    'Senegal',
    'Sierra Leone',
    'Somalia',
    'South Africa',
    'Sudan',
    'Tanzania',
    'Togo',
    'Tunisia',
    'Uganda',
    'W. Sahara',
    'Zambia',
    'Zimbabwe',
    'eSwatini',
  ]),
} as const

const countryScopeOptions: Array<{ key: CountryScope; label: string }> = [
  { key: 'world', label: 'Whole world' },
  { key: 'europe', label: 'Europe' },
  { key: 'latin-america', label: 'Latin America / Caribbean' },
  { key: 'asia', label: 'Asia' },
  { key: 'oceania', label: 'Oceania' },
  { key: 'africa', label: 'Africa' },
]

function countryItemsForScope(scope: CountryScope, countryTopicItems: QuizItem[]) {
  if (scope === 'world') return countryTopicItems
  const names = countrySubsetNames[scope]
  return countryTopicItems.filter((item) => names.has(item.name))
}

type UsGuess = 'capital' | 'main'

const usRegionOptions: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Whole US' },
  { key: 'west', label: 'West' },
  { key: 'mid', label: 'Mid' },
  { key: 'east', label: 'East' },
]

const usGuessOptions: Array<{ key: UsGuess; label: string }> = [
  { key: 'capital', label: 'State capital' },
  { key: 'main', label: 'Biggest city' },
]

// Keys match QuizItem.region on the French departments; labels are the display forms.
const frRegionOptions: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Whole France' },
  { key: 'Ile-de-France', label: 'Île-de-France' },
  { key: 'Auvergne-Rhone-Alpes', label: 'Auvergne-Rhône-Alpes' },
  { key: 'Bourgogne-Franche-Comte', label: 'Bourgogne-Franche-Comté' },
  { key: 'Brittany', label: 'Brittany' },
  { key: 'Centre-Val de Loire', label: 'Centre-Val de Loire' },
  { key: 'Corsica', label: 'Corsica' },
  { key: 'Grand Est', label: 'Grand Est' },
  { key: 'Hauts-de-France', label: 'Hauts-de-France' },
  { key: 'Normandy', label: 'Normandy' },
  { key: 'Nouvelle-Aquitaine', label: 'Nouvelle-Aquitaine' },
  { key: 'Occitanie', label: 'Occitanie' },
  { key: 'Pays de la Loire', label: 'Pays de la Loire' },
  { key: 'Provence-Alpes-Cote d Azur', label: 'Provence-Alpes-Côte d’Azur' },
]

const seaRegionOptions: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Whole world' },
  { key: 'europe', label: 'Europe & Mediterranean' },
  { key: 'asia-pacific', label: 'Asia-Pacific' },
  { key: 'americas', label: 'Americas' },
  { key: 'indian', label: 'Indian Ocean & Middle East' },
  { key: 'polar', label: 'Polar' },
]

function isUsScopedTopic(topic: Topic) {
  return topic.id === 'us-states' || topic.id === 'us-cities'
}

function isRegionScopedTopic(topic: Topic) {
  return isUsScopedTopic(topic) || topic.id === 'french-departments' || topic.id === 'seas'
}

function regionOptions(topic: Topic): Array<{ key: string; label: string }> {
  if (topic.id === 'world-countries') return countryScopeOptions
  if (isUsScopedTopic(topic)) return usRegionOptions
  if (topic.id === 'french-departments') return frRegionOptions
  if (topic.id === 'seas') return seaRegionOptions
  return []
}

function defaultScope(topic: Topic) {
  if (topic.id === 'world-countries') return 'world'
  if (isRegionScopedTopic(topic)) return 'all'
  return 'world'
}

type GameParams = { topicId: string; mode: QuizMode; scope: string; usGuess: UsGuess; pageView: PageView }

// The active game (topic + all its parameters) is mirrored in the URL query string so a refresh
// or shared link restores the exact same game, mode, region, guess and view.
function readGameParams(topics: Topic[]): GameParams {
  const params = new URLSearchParams(window.location.search)
  const topic = topics.find((entry) => entry.id === params.get('topic')) ?? topics[0]

  const modeParam = params.get('mode') as QuizMode | null
  const mode = modeParam && topic.modes.includes(modeParam) ? modeParam : topic.modes[0]

  const regionParam = params.get('region')
  const scope = regionParam && regionOptions(topic).some((option) => option.key === regionParam) ? regionParam : defaultScope(topic)

  const usGuess: UsGuess = params.get('guess') === 'main' ? 'main' : 'capital'

  const viewParam = params.get('view')
  const pageView: PageView = viewParam === 'course' || viewParam === 'questions' ? viewParam : 'practice'

  return { topicId: topic.id, mode, scope, usGuess, pageView }
}

function writeGameParams(topic: Topic, params: { mode: QuizMode; scope: string; usGuess: UsGuess; pageView: PageView }) {
  const query = new URLSearchParams()
  query.set('topic', topic.id)
  query.set('mode', params.mode)
  if (regionOptions(topic).length) query.set('region', params.scope)
  if (topic.id === 'us-cities') query.set('guess', params.usGuess)
  if (Boolean(courseArticles[topic.id]) || topic.kind === 'city-quiz') query.set('view', params.pageView)
  if (topic.kind === 'paintings-quiz') {
    const cur = new URLSearchParams(window.location.search)
    const t = cur.get('tier')
    if (t && ['10', '20', '31'].includes(t)) query.set('tier', t)
  }
  const next = `${window.location.pathname}?${query.toString()}${window.location.hash}`
  window.history.replaceState(null, '', next)
}

function asFeatures(collection: unknown): BoundaryFeature[] {
  return (collection as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number | null>>).features
}

function usStateFeatures() {
  const collection = feature(usStatesAtlas as never, (usStatesAtlas as never as { objects: { states: never } }).objects.states)
  return (collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number | null>>).features
}

const boundaryFeatures = {
  'fr-departments': asFeatures(frDepartments),
  'fr-regions': asFeatures(frRegions),
  'uk-admin': asFeatures(ukAdmin),
  'us-states': usStateFeatures(),
  seas: asFeatures(seas),
}

function seaItemsFromFeatures(): QuizItem[] {
  return boundaryFeatures.seas
    .map((featureItem) => {
      const name = boundaryName(featureItem)
      const meta = seaMeta[name]
      return { id: normalize(name).replaceAll(' ', '-'), name, region: meta?.region, note: meta?.note }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function boundaryName(featureItem: BoundaryFeature) {
  const properties = featureItem.properties
  return String(properties.nom ?? properties.CTYUA22NM ?? properties.name ?? '')
}

function boundaryCode(featureItem: BoundaryFeature) {
  const code = featureItem.properties.code ?? featureItem.id
  return code == null ? undefined : String(code)
}


// Link region/department/state items to their GeoJSON feature by code so map-click
// matching keys off geographic identity, not localised name strings (Corse vs Corsica).
function attachBoundaryCodes(topic: Topic): Topic {
  if (!topic.boundaryTarget || !topic.boundaryLayer) return topic
  const codeByName = new Map<string, string>()
  boundaryFeatures[topic.boundaryLayer].forEach((featureItem) => {
    const code = boundaryCode(featureItem)
    if (code == null) return
    codeByName.set(normalize(boundaryName(featureItem)), code)
  })
  const items = topic.items.map((item) => {
    const code = [item.name, ...(item.aliases ?? [])].map((candidate) => codeByName.get(normalize(candidate))).find(Boolean)
    return code ? { ...item, code } : item
  })
  return { ...topic, items }
}

function promptLabel(topic: Topic, mode: QuizMode, item: QuizItem) {
  if (mode === 'map-click' && topic.id === 'us-cities') return `Click the state of ${item.answer ?? item.name}`
  if (mode === 'map-click') return `Click ${item.label ?? item.name}`
  if (mode === 'map-number') return `Click department ${item.code ?? item.name}`
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

function roundVerdict(accuracy: number) {
  if (accuracy >= 90) {
    return {
      tone: 'excellent',
      title: 'Excellent round',
      label: 'Mastery',
      message: 'You know this deck very well. Start a new shuffled round to keep it automatic.',
    }
  }
  if (accuracy >= 75) {
    return {
      tone: 'good',
      title: 'Strong round',
      label: 'Nearly automatic',
      message: 'Most of the deck is solid. A short review pass will clean up the remaining misses.',
    }
  }
  if (accuracy >= 55) {
    return {
      tone: 'mid',
      title: 'Building round',
      label: 'Taking shape',
      message: 'The core map is taking shape. The missed answers below are the ones to drill next.',
    }
  }
  return {
    tone: 'low',
    title: 'Practice round complete',
    label: 'Needs reps',
    message: 'This deck still needs repetition. Read the misses, then start another shuffled round.',
  }
}

function RoundResultsPanel({
  topic,
  results,
  deckSize,
  onStartNewRound,
  mobile = false,
}: {
  topic: Topic
  results: AnswerResult[]
  deckSize: number
  onStartNewRound: () => void
  mobile?: boolean
}) {
  const correct = results.filter((result) => result.ok).length
  const missed = results.filter((result) => !result.ok)
  const missCount = Math.max(deckSize - correct, 0)
  const accuracy = deckSize ? Math.round((correct / deckSize) * 100) : 0
  const verdict = roundVerdict(accuracy)

  const actions = (
    <div className="round-actions">
      <button className="primary-action" type="button" onClick={onStartNewRound}>
        Start new shuffled round
      </button>
      <span>{verdict.label}</span>
    </div>
  )

  return (
    <section className={`round-results round-results-${verdict.tone}${mobile ? ' round-results-plain' : ''}`}>
      <div className="round-results-hero" style={{ '--score': `${accuracy}%` } as CSSProperties}>
        <div className="round-visual" aria-hidden="true">
          <div className="score-orbit">
            <span>{accuracy}%</span>
          </div>
          <i />
          <i />
          <i />
          <i />
        </div>
        <div>
          <span className="eyebrow">Deck complete</span>
          <h2>{verdict.title}</h2>
          <p>{verdict.message}</p>
        </div>
      </div>

      {mobile ? actions : null}

      <div className="round-results-stats" aria-label="Round score">
        <Stat label="Round score" value={`${correct}/${deckSize}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Misses" value={missCount} />
      </div>

      {missed.length ? (
        <div className="round-review-list">
          <div className="round-review-header">
            <h3>Review misses</h3>
            <span>{missed.length} to replay</span>
          </div>
          {missed.slice(0, 12).map((result) => (
            <article key={result.id}>
              <strong>{result.prompt}</strong>
              <p>
                You answered <b>{stripTrailingPunctuation(result.submitted)}</b>. Answer: <b>{stripTrailingPunctuation(result.expected)}</b>.
              </p>
            </article>
          ))}
        </div>
      ) : missCount ? (
        <p className="round-perfect">No wrong answers were recorded, but skipped questions count as misses.</p>
      ) : (
        <p className="round-perfect">No misses in this round.</p>
      )}

      {mobile ? null : actions}
      <p className="coverage">{topic.coverage}</p>
    </section>
  )
}

function TopicIcon({ topic }: { topic: Topic }) {
  if (topic.group === 'Art') return <Image size={18} />
  if (topic.group === 'Geography') return <MapPinned size={18} />
  if (topic.group === 'Science') return <Globe2 size={18} />
  return <BookOpen size={18} />
}

const courseArticles: Record<string, CourseArticle> = {
  'political-systems': {
    title: 'How Four Political Systems Work',
    deckLabel: 'Constitutional mechanics',
    lede: 'This course is about the rules of the game: who gets power, who can block whom, how leaders are chosen, and where people often confuse institutions with similar names.',
    sections: [
      {
        heading: 'France: a semi-presidential republic',
        paragraphs: [
          'France gives real power to both an elected president and a government led by a prime minister. The president is elected directly and is strongest in foreign policy, defence, appointments, and national direction. The prime minister runs the government day to day and must survive politically in the National Assembly.',
          'When the president and the Assembly majority come from the same camp, the president dominates the system. When they come from opposing camps, France enters cohabitation: the president remains head of state, but domestic policy shifts toward the prime minister and parliamentary majority.',
        ],
        bullets: [
          'The National Assembly is the lower house and can bring down the government through a censure motion.',
          'The Senate is elected indirectly and represents territorial communities.',
          'The Constitutional Council reviews whether laws fit the Constitution.',
          'Article 11 allows some bills to be submitted to referendum; Article 89 is the normal amendment route.',
        ],
      },
      {
        heading: 'The United Kingdom: parliamentary government without one written constitution',
        paragraphs: [
          'The UK is a constitutional monarchy and parliamentary democracy. The monarch is head of state, but political authority rests with ministers who must command the confidence of the House of Commons. The prime minister is not directly elected as prime minister; they are appointed because they can lead a Commons majority or workable government.',
          'The UK constitution is spread across statutes, court decisions, conventions, and political practice. That makes conventions important: ministerial responsibility, the monarch acting on advice, and the Sewel convention all shape behaviour even when they are not ordinary enforceable rules.',
        ],
        bullets: [
          'General elections use First Past the Post in single-member constituencies.',
          'The House of Commons controls confidence, taxation, and money bills.',
          'The House of Lords revises and delays legislation but is weaker than the Commons.',
          'Devolution gives Scotland, Wales, and Northern Ireland powers over areas such as health and education.',
        ],
      },
      {
        heading: 'The European Union: shared law between states',
        paragraphs: [
          'The European Union is not a normal state and not just an international club. It is a legal and political system where member states share powers in defined areas. The useful shortcut is to separate agenda-setting, law-making, execution, and interpretation.',
          'The European Commission usually proposes legislation and enforces EU law. The European Parliament is directly elected by EU citizens. The Council of the EU represents national ministers and passes legislation with Parliament. The European Council is different: it is the summit of heads of state or government and sets broad direction.',
        ],
        bullets: [
          'Do not confuse the European Council with the Council of the EU.',
          'The Schengen Area concerns border controls; the Eurozone concerns the euro.',
          'The Court of Justice of the EU interprets EU law.',
        ],
      },
      {
        heading: 'The United States: separated powers and federalism',
        paragraphs: [
          'The United States is a federal presidential republic. The president is separately elected from Congress, so the executive does not need day-to-day confidence from the legislature. Congress writes laws and controls money. The courts can review laws and executive action.',
          'Federalism matters as much as separation of powers. The federal government and the states each have their own constitutional roles. Every state has two senators regardless of population, while House seats are population-based. Presidents are chosen through the Electoral College, where a candidate needs a majority of electoral votes.',
        ],
        bullets: [
          'Judicial review is associated with Marbury v. Madison.',
          'The First Amendment protects speech, religion, press, assembly, and petition.',
          'Checks and balances are the tools each branch uses; separation of powers is the division of jobs.',
        ],
      },
    ],
    takeaways: ['France mixes president and parliament.', 'The UK government lives or dies by Commons confidence.', 'The EU separates Commission, Parliament, Council, and European Council.', 'The US separates executive, legislature, courts, and federal/state power.'],
  },
  'history-outline': {
    title: 'Scotland, England, and France: the broad outline',
    deckLabel: 'Historical scaffolding',
    lede: 'This course gives the big chapters first. The dates and names in the quiz are anchors for a mental timeline, not isolated trivia.',
    sections: [
      {
        heading: 'Scotland: from Alba to devolution',
        paragraphs: [
          'Early Scotland was shaped by Picts, Gaels, Britons, Angles, and Vikings. The kingdom of Alba gradually became the core of medieval Scotland. The Wars of Independence then created the heroic memory of William Wallace and Robert the Bruce.',
          'The Union of the Crowns in 1603 joined the Scottish and English crowns under James VI and I, but the parliaments stayed separate. The Acts of Union in 1707 created the Parliament of Great Britain. Later, the Scottish Enlightenment made Edinburgh a centre of philosophy, economics, medicine, and science. Modern devolution restored a Scottish Parliament after the 1997 referendum.',
        ],
      },
      {
        heading: 'England: conquest, parliament, and empire',
        paragraphs: [
          'Roman Britain begins with Claudius in 43 CE, followed by Anglo-Saxon kingdoms after Roman withdrawal. The Norman Conquest in 1066 is the major hinge: William of Normandy defeats Harold Godwinson and reshapes landholding, language, and monarchy.',
          'Magna Carta in 1215 becomes a symbolic limit on royal power. The English Civil War pits Royalists against Parliamentarians and ends with the execution of Charles I. The Glorious Revolution of 1688 confirms parliamentary supremacy. Victorian Britain then combines industrialisation, social reform, and imperial expansion.',
        ],
      },
      {
        heading: 'France: dynasties, revolution, republic',
        paragraphs: [
          'The simple royal sequence to remember is Merovingian, Carolingian, Capetian, Valois, Bourbon. The Hundred Years War turns dynastic conflict into national memory, with Joan of Arc fighting for France. The Wars of Religion then divide Catholics and Protestants until the Edict of Nantes.',
          'The French Revolution begins in 1789 and breaks the Bourbon monarchy. Napoleon turns revolutionary France into empire, then Waterloo ends his final return to power. The Third Republic anchors secular republican France; the Fifth Republic, created in 1958 by Charles de Gaulle, is the current strong-presidency system.',
        ],
      },
    ],
    takeaways: ['1603 joins crowns; 1707 joins parliaments.', '1066, 1215, 1642-1651, and 1688 are core English anchors.', 'French history moves from dynasties to Revolution, Napoleon, and republics.'],
  },
  'empires-battles': {
    title: 'Empires and Battles as Timeline Anchors',
    deckLabel: 'Power, territory, and turning points',
    lede: 'The purpose of this course is not to memorise every campaign. It is to know which powers mattered, roughly when they existed, where they were, and why a few battles became turning points.',
    sections: [
      {
        heading: 'Ancient imperial models',
        paragraphs: [
          'The Achaemenid Persian Empire is the first huge Near Eastern empire to keep in mind, stretching from Iran toward Egypt and Anatolia. Alexander the Great destroys it and briefly creates a Macedonian empire from Greece to the edge of India.',
          'Rome is the central Mediterranean empire: republic, then empire, then a western fall in 476 CE while the eastern Byzantine Empire continues from Constantinople until 1453. These states become reference points for law, roads, citizenship, Christianity, and imperial prestige.',
        ],
      },
      {
        heading: 'Medieval and early modern empires',
        paragraphs: [
          'The Abbasid Caliphate is tied to Baghdad and the House of Wisdom. The Mongol Empire is the great land empire of Eurasia. The Ottoman Empire takes Constantinople in 1453 and controls major territory across the Middle East, Balkans, and North Africa.',
          'The Mughal Empire rules much of India. The Spanish and Portuguese empires open the age of oceanic empire in the Americas, Africa, and Asia. Dutch, British, French, Russian, Qing, Inca, and other empires show that expansion happened by sea, steppe, trade, conquest, and bureaucracy.',
        ],
      },
      {
        heading: 'Battles as memory hooks',
        paragraphs: [
          'A few battles stand in for larger historical changes. Marathon and Thermopylae anchor the Greek-Persian wars. Cannae shows Hannibal at his tactical peak against Rome. Tours is remembered in Frankish and Islamic expansion narratives. Agincourt anchors the Hundred Years War.',
          'Yorktown helps end the American Revolutionary War. Trafalgar secures British naval dominance. Austerlitz is Napoleon at his best; Waterloo ends him. Gettysburg turns the US Civil War. Stalingrad and Midway mark World War II turning points, and Normandy opens the road to the liberation of Western Europe.',
        ],
      },
    ],
    takeaways: ['Empires are remembered by era, core territory, and ruling logic.', 'Battles are useful when they mark a turning point or symbol.', 'Know the ancient, medieval, early modern, and modern sequence before details.'],
  },
  'modern-leaders': {
    title: 'France and UK Leaders Since 1960',
    deckLabel: 'Modern political chronology',
    lede: 'This course gives the basic line of political leadership in Britain and France since 1960. The goal is to recognise the order and the political context attached to each name.',
    sections: [
      {
        heading: 'Britain: postwar consensus to Brexit and after',
        paragraphs: [
          'At the start of 1960, Harold Macmillan leads Conservative Britain. Alec Douglas-Home briefly follows, then Labour returns with Harold Wilson. Edward Heath takes Britain into the European Communities in 1973. James Callaghan ends the 1970s Labour period.',
          'Margaret Thatcher dominates 1979-1990 with privatisation, union conflict, and a new Conservative settlement. John Major follows, then Tony Blair brings New Labour landslides in 1997, 2001, and 2005. Gordon Brown handles the financial crisis period. David Cameron leads coalition government and the Brexit referendum. Theresa May negotiates Brexit, Boris Johnson wins the 2019 majority, Liz Truss is shortest-serving PM, Rishi Sunak follows, and Keir Starmer becomes prime minister on 5 July 2024.',
        ],
      },
      {
        heading: 'France: Fifth Republic presidents',
        paragraphs: [
          'Charles de Gaulle creates and leads the Fifth Republic. Georges Pompidou continues Gaullist modernisation. Valery Giscard d Estaing represents liberal centre-right reform. Francois Mitterrand is the great Socialist president, serving from 1981 to 1995.',
          'Jacques Chirac follows from 1995 to 2007. Nicolas Sarkozy serves 2007-2012. Francois Hollande serves 2012-2017. Emmanuel Macron, first elected in 2017, is president as of May 2026.',
        ],
      },
      {
        heading: 'Prime ministers matter differently',
        paragraphs: [
          'In Britain, the prime minister is the central executive figure because the system is parliamentary. In France, the president is usually the headline executive figure, but prime ministers become especially important during cohabitation or major domestic reform periods.',
          'For France, know a few prime minister anchors: Pompidou before becoming president, Chaban-Delmas under Pompidou, Mauroy under Mitterrand, Balladur and Jospin during cohabitations, Fillon under Sarkozy, Valls under Hollande, and Edouard Philippe under Macron.',
        ],
      },
    ],
    takeaways: ['UK leadership is a prime-ministerial sequence.', 'French leadership is primarily a presidential sequence.', 'French prime ministers are crucial context, especially under cohabitation.'],
  },
  'classical-music': {
    title: 'Classical Music Movements in Europe',
    deckLabel: 'Periods, composers, anchor works',
    lede: 'Classical music is easiest to remember as a sequence of styles. Each period has a sound-world, a social setting, and a few composers whose works become anchors.',
    sections: [
      {
        heading: 'From medieval chant to Renaissance polyphony',
        paragraphs: [
          'Medieval music is tied to church, chant, and early notation. Hildegard of Bingen is a rare named medieval composer whose liturgical music survives with a strong personality.',
          'Renaissance music develops smoother polyphony: several independent vocal lines balanced together. Palestrina is the clean mental anchor for sacred Renaissance choral music, especially the Missa Papae Marcelli.',
        ],
      },
      {
        heading: 'Baroque and Classical balance',
        paragraphs: [
          'Baroque music loves contrast, basso continuo, ornament, and expressive drive. Bach stands for contrapuntal mastery, Vivaldi for the concerto and The Four Seasons, Handel for large public works such as Messiah.',
          'The Classical era aims for clarity, balance, and form. Haydn develops the symphony and string quartet. Mozart combines elegance, drama, and melody. Beethoven begins in Classical form but pushes toward Romantic intensity.',
        ],
      },
      {
        heading: 'Romanticism and modernism',
        paragraphs: [
          'Romantic music expands emotion, colour, virtuosity, nationalism, and the scale of orchestra and opera. Schubert, Chopin, Liszt, Wagner, Verdi, Brahms, Tchaikovsky, Mahler, and Puccini are core anchors.',
          'Around 1900, modernism fragments the old language. Debussy and Ravel explore colour and ambiguity. Stravinsky makes rhythm and shock central in The Rite of Spring. Schoenberg develops twelve-tone technique. Bartok, Gershwin, and Copland connect modernism with folk, jazz, and national sound.',
        ],
      },
    ],
    takeaways: ['Medieval and Renaissance are vocal and church-centred.', 'Baroque is contrast and counterpoint; Classical is balance and form.', 'Romanticism expands emotion; modernism breaks old rules.'],
  },
  'art-movements-sculpture': {
    title: 'Painting Movements and Sculpture',
    deckLabel: 'Visual culture timeline',
    lede: 'This course is organised chronologically. The aim is to recognise the movement by its visual logic, then attach a few artists and masterpieces to that style.',
    sections: [
      {
        heading: 'Medieval foundations: Byzantine, Romanesque, Gothic',
        paragraphs: [
          'Byzantine art is tied to the Eastern Roman and Orthodox Christian world: gold grounds, icons, mosaics, and sacred frontality. The goal is not realism but spiritual presence. Ravenna mosaics and Christ Pantocrator icons are useful anchors.',
          'Gothic art grows in medieval Europe with cathedrals, stained glass, pointed arches, and devotional imagery. Chartres is the architectural and stained-glass anchor. Late Gothic and early Italian painting begin to move toward more human space and emotion.',
        ],
      },
      {
        heading: 'Renaissance to Baroque: human form, space, drama',
        paragraphs: [
          'The Renaissance turns toward classical antiquity, anatomy, perspective, and the dignity of the human figure. Leonardo, Michelangelo, and Raphael are the central High Renaissance names. In sculpture, Donatello and Michelangelo make the human body a vehicle for civic and spiritual force.',
          'Baroque art keeps technical mastery but adds movement, theatrical light, and emotional drama. Caravaggio uses sharp light and ordinary bodies; Rubens uses energy and flesh; Rembrandt turns light into psychology. Bernini is the great Baroque sculptor, making marble feel like action.',
        ],
      },
      {
        heading: 'Eighteenth and nineteenth centuries: taste, reason, emotion, reality',
        paragraphs: [
          'Rococo is elegant, playful, decorative, and aristocratic. Neoclassicism reacts with moral seriousness and ancient Roman clarity: David and Ingres are core names. Canova is the sculpture anchor for polished Neoclassical ideal beauty.',
          'Romanticism values emotion, nature, violence, and the sublime; Delacroix, Gericault, and Turner are strong anchors. Realism turns away from myth and courtly polish toward ordinary labour and modern life, with Courbet and Millet.',
        ],
      },
      {
        heading: 'Modern movements: seeing breaks apart',
        paragraphs: [
          'Impressionism studies light, colour, and modern leisure with visible brushwork; Monet, Renoir, and Degas are central. Fauvism pushes colour away from naturalism through Matisse and Derain. Expressionism makes inner emotion more important than outward accuracy.',
          'Cubism, led by Picasso and Braque, breaks objects into multiple viewpoints. Surrealism, with Dali and Magritte, makes dream logic visible. Abstract Expressionism, Pop Art, Art Nouveau, and Minimalism each teach a different modern idea: gesture, mass culture, decorative organic line, and reduction to simple form.',
        ],
      },
      {
        heading: 'Sculpture anchors',
        paragraphs: [
          'For broad culture, know the sculptural line from Phidias and Myron in ancient Greece, through Donatello and Michelangelo in the Renaissance, Bernini in the Baroque, Canova in Neoclassicism, Rodin in modern expressive sculpture, then Brancusi, Henry Moore, and Giacometti in modern abstraction and existential form.',
        ],
      },
    ],
    takeaways: ['Renaissance: perspective and ideal human form.', 'Baroque: drama, movement, light.', 'Impressionism onward: modern vision breaks into colour, viewpoint, dream, gesture, mass culture, and abstraction.'],
  },
  'philosophy-literature': {
    title: 'Philosophy, Poetry, and Books',
    deckLabel: 'Ideas and literary canon',
    lede: 'This course turns a long cultural list into a map: ancient ethics and metaphysics, early modern knowledge and politics, modern freedom and society, then poets and books that became global reference points.',
    sections: [
      {
        heading: 'Ancient and medieval philosophy',
        paragraphs: [
          'Socrates stands for questioning and the examined life. Plato turns that questioning into dialogues about justice, forms, education, and the ideal city. Aristotle is more systematic, writing on ethics, politics, logic, biology, rhetoric, and tragedy.',
          'Stoicism teaches virtue, reason, and discipline toward what cannot be controlled. Confucius anchors a different tradition: moral cultivation, ritual, hierarchy, and filial piety. Thomas Aquinas later synthesises Aristotle with Christian theology in medieval scholasticism.',
        ],
      },
      {
        heading: 'Modern philosophy: knowledge, politics, freedom',
        paragraphs: [
          'Descartes begins from doubt and the thinking self. Hume pushes empiricism and scepticism. Kant tries to answer Hume by explaining the structures that make experience possible. Rousseau makes popular sovereignty and the social contract central to modern politics.',
          'Mill gives liberalism and utilitarianism a classic voice. Marx analyses capitalism, class, and historical change. Nietzsche attacks inherited morality and religion. Existentialism and Simone de Beauvoir put freedom, responsibility, ambiguity, and gender at the centre.',
        ],
      },
      {
        heading: 'Poetry and books as cultural anchors',
        paragraphs: [
          'Homer anchors epic poetry with the Iliad and Odyssey. Dante turns Christian cosmology into the Divine Comedy. Shakespeare is both poet and playwright. Milton gives English epic its great religious-political monument in Paradise Lost.',
          'The novel canon starts with landmarks such as The Tale of Genji and Don Quixote, then expands through Austen, Dickens, Tolstoy, Dostoevsky, Joyce, Orwell, and Garcia Marquez. The point is to know author, title, period, and the broad cultural role of the work.',
        ],
      },
    ],
    takeaways: ['Ancient philosophy asks how to live and what is real.', 'Modern philosophy asks how we know, govern, and choose.', 'Literary anchors connect title, author, period, and cultural role.'],
  },
}

function CoursePanel({ article }: { article: CourseArticle }) {
  return (
    <section className="course-surface">
      <div className="course-header">
        <span className="eyebrow">Course</span>
        <h2>{article.title}</h2>
        <p>{article.lede}</p>
      </div>

      <article className="course-article">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <aside className="course-takeaways">
          <h3>What to know by heart</h3>
          <ul>
            {article.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </aside>
      </article>
    </section>
  )
}

function QuestionReferencePanel({ topic, article }: { topic: Topic; article?: CourseArticle }) {
  return (
    <section className="course-surface">
      <div className="course-header">
        <span className="eyebrow">Question list</span>
        <h2>{topic.title}</h2>
        <p>{article ? `Practice prompts for the ${article.deckLabel.toLowerCase()} deck.` : topic.coverage}</p>
      </div>

      <div className="question-reference-list">
        {topic.items.map((item) => {
          const answer = item.answer && normalize(item.answer) !== normalize(item.name) ? item.answer : undefined
          return (
            <article key={item.id} className="question-reference-row">
              <div>
                <strong>{item.prompt ?? item.label ?? item.name}</strong>
                <span>{answer ?? item.label ?? item.name}</span>
              </div>
              <p>{item.detail ?? item.location ?? item.era ?? topic.coverage}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const MOBILE_QUERY = '(max-width: 820px), (max-width: 950px) and (max-height: 540px)'
const LANDSCAPE_PHONE_QUERY = '(max-width: 950px) and (max-height: 540px) and (orientation: landscape)'

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function CultureMap({
  topic,
  mode,
  current,
  items,
  countries,
  review,
  pendingCode,
  onPick,
}: {
  topic: Topic
  mode: QuizMode
  current: QuizItem
  items: QuizItem[]
  countries: CountryFeature[]
  review?: AnswerResult
  pendingCode?: string
  onPick: (item: QuizItem) => void
}) {
  const projection = useMemo(() => buildProjection(topic.mapScope ?? 'world'), [topic.mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; moved: boolean; view: MapView } | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ startDist: number; startScale: number; anchor: [number, number] } | null>(null)
  const [mapView, setMapView] = useState<MapView>(defaultMapView)
  const countriesByName = useMemo(() => new Map(countries.map((country) => [normalize(country.properties.name), country])), [countries])
  const itemNameSet = useMemo(() => new Set(items.map((item) => normalize(item.name))), [items])
  const boundaries = useMemo(() => (topic.boundaryLayer ? boundaryFeatures[topic.boundaryLayer] : []), [topic.boundaryLayer])
  const itemsByName = useMemo(() => new Map(items.map((item) => [normalize(item.name), item])), [items])
  const itemsByCode = useMemo(() => new Map(items.filter((item) => item.code).map((item) => [item.code as string, item])), [items])
  // Layers where the boundary shapes are themselves the quiz targets: keep the whole
  // country visible but grey out (and disable) any area outside the current subset.
  const greyOutOfScope = topic.boundaryLayer === 'us-states' || Boolean(topic.boundaryLayer?.startsWith('fr-'))
  const boundaryInScope = useCallback(
    (boundary: BoundaryFeature) => {
      if (!greyOutOfScope) return true
      const code = boundaryCode(boundary)
      return Boolean((code && itemsByCode.has(code)) || itemsByName.has(normalize(boundaryName(boundary))))
    },
    [greyOutOfScope, itemsByCode, itemsByName],
  )
  const boundaryMatchesItem = useCallback((boundary: BoundaryFeature, item: QuizItem) => (item.code && boundaryCode(boundary) ? boundaryCode(boundary) === item.code : normalize(boundaryName(boundary)) === normalize(item.name)), [])
  const resolveBoundaryItem = useCallback(
    (boundary: BoundaryFeature): QuizItem => {
      const code = boundaryCode(boundary)
      const name = boundaryName(boundary)
      return (code ? itemsByCode.get(code) : undefined) ?? itemsByName.get(normalize(name)) ?? { id: normalize(name), name, ...(code ? { code } : {}) }
    },
    [itemsByCode, itemsByName],
  )
  const currentBoundary = useMemo(() => boundaries.find((boundary) => boundaryMatchesItem(boundary, current)), [boundaries, boundaryMatchesItem, current])

  const currentCountry = topic.mapKind === 'country-polygons' ? countriesByName.get(normalize(current.name)) : undefined
  const canClickBoundaries = Boolean(topic.boundaryTarget && (mode === 'map-click' || mode === 'map-number'))
  const showCountryLayer = topic.boundaryLayer !== 'us-states'
  const expectedName = review ? normalize(review.expectedName) : ''
  const submittedName = review ? normalize(review.submittedName) : ''
  const expectedCode = review?.expectedCode
  const submittedCode = review?.submittedCode
  const mapTransform = `translate(${mapView.x} ${mapView.y}) scale(${mapView.scale})`

  // Convert client coords to viewBox (960x560) coords, accounting for the SVG's
  // preserveAspectRatio="xMidYMid meet" letterboxing (so the element need not match the
  // viewBox aspect — the mobile map can fill a portrait container).
  function clientToViewBox(clientX: number, clientY: number, rect: DOMRect): [number, number] {
    const fit = Math.min(rect.width / WIDTH, rect.height / HEIGHT)
    const offsetX = (rect.width - WIDTH * fit) / 2
    const offsetY = (rect.height - HEIGHT * fit) / 2
    return [(clientX - rect.left - offsetX) / fit, (clientY - rect.top - offsetY) / fit]
  }

  function zoomAt(clientX: number, clientY: number, direction: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const [pointX, pointY] = clientToViewBox(clientX, clientY, rect)

    setMapView((previous) => {
      const nextScale = Math.min(12, Math.max(1, previous.scale * (direction > 0 ? 1.22 : 1 / 1.22)))
      const ratio = nextScale / previous.scale
      return clampMapView({
        scale: nextScale,
        x: pointX - (pointX - previous.x) * ratio,
        y: pointY - (pointY - previous.y) * ratio,
      })
    })
  }

  function mapPointFromClient(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return undefined
    const rect = svg.getBoundingClientRect()
    const [viewX, viewY] = clientToViewBox(clientX, clientY, rect)
    return [(viewX - mapView.x) / mapView.scale, (viewY - mapView.y) / mapView.scale] as [number, number]
  }

  function pickAtClientPoint(clientX: number, clientY: number) {
    if ((mode !== 'map-click' && mode !== 'map-number') || review) return
    const point = mapPointFromClient(clientX, clientY)
    if (!point) return

    if (topic.mapKind === 'country-polygons') {
      const lonLat = projection.invert?.(point)
      if (!lonLat) return
      const pickedCountry = countries.find((country) => itemNameSet.has(normalize(country.properties.name)) && geoContains(country, lonLat))
      if (pickedCountry) onPick({ id: normalize(pickedCountry.properties.name), name: pickedCountry.properties.name })
      return
    }

    if (canClickBoundaries) {
      const lonLat = projection.invert?.(point)
      if (!lonLat) return
      const pickedBoundary = boundaries.find((boundary) => geoContains(boundary, lonLat))
      if (!pickedBoundary || !boundaryInScope(pickedBoundary)) return
      onPick(resolveBoundaryItem(pickedBoundary))
      return
    }

    if (topic.mapKind === 'points') {
      let closest: { item: QuizItem; distance: number } | undefined
      items.forEach((item) => {
        if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return
        const projected = projection([item.lon, item.lat])
        if (!projected) return
        const distance = Math.hypot(projected[0] - point[0], projected[1] - point[1])
        if (!closest || distance < closest.distance) closest = { item, distance }
      })
      if (closest && closest.distance <= 12) onPick(closest.item)
    }
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1)
  }

  function toView(clientX: number, clientY: number, rect: DOMRect) {
    return clientToViewBox(clientX, clientY, rect)
  }

  function beginPinch() {
    const svg = svgRef.current
    if (!svg) return
    const [a, b] = [...pointersRef.current.values()]
    if (!a || !b) return
    dragRef.current = null
    const rect = svg.getBoundingClientRect()
    const startDist = Math.hypot(a.x - b.x, a.y - b.y)
    const [mx, my] = toView((a.x + b.x) / 2, (a.y + b.y) / 2, rect)
    pinchRef.current = {
      startDist,
      startScale: mapView.scale,
      anchor: [(mx - mapView.x) / mapView.scale, (my - mapView.y) / mapView.scale],
    }
  }

  function capturePointer(event: ReactPointerEvent<SVGSVGElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // synthetic/stale pointer — capture is best-effort
    }
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    // Only capture the pointer when we actually drive a gesture (pinch or pan). Capturing on a
    // plain scale-1 tap would retarget the follow-up click event to the SVG and break the
    // path onClick handlers that pick at scale 1.
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
    const [vx, vy] = clientToViewBox(event.clientX, event.clientY, rect)
    const [sx, sy] = clientToViewBox(drag.clientX, drag.clientY, rect)
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 4) {
      drag.moved = true
    }
    setMapView(clampMapView({ ...drag.view, x: drag.view.x + (vx - sx), y: drag.view.y + (vy - sy) }))
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    const drag = dragRef.current
    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null
      if (!drag.moved && mapView.scale > 1) {
        pickAtClientPoint(event.clientX, event.clientY)
      }
    }
    // One finger remains after a pinch: let it pan (but not register as a tap).
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
        <button type="button" onClick={() => setZoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => setZoom(-1)} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={() => setMapView(defaultMapView)} aria-label="Reset zoom">
          {mapView.scale.toFixed(1)}x
        </button>
      </div>
      <svg
        ref={svgRef}
        className={mapView.scale > 1 ? 'map map-zoomed' : 'map'}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${topic.title} map quiz`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect width={WIDTH} height={HEIGHT} rx="0" className="ocean" />
        <g transform={mapTransform}>
          {showCountryLayer ? (
            <g>
              {countries.map((country) => {
                const name = country.properties.name
                const isTarget = normalize(name) === normalize(current.name)
                const isExpected = review && normalize(name) === expectedName
                const isWrongPick = review && !review.ok && normalize(name) === submittedName
                const isInteractive = topic.mapKind === 'country-polygons' && mode === 'map-click' && itemNameSet.has(normalize(name))
                const klass = [
                  'country',
                  isInteractive && !review ? 'country-clickable' : '',
                  mode === 'map-type' && isTarget ? 'target-country' : '',
                  isExpected ? 'correct-country' : '',
                  isWrongPick ? 'wrong-country' : '',
                ].join(' ')

                return (
                  <path
                    key={name}
                    className={klass}
                    d={path(country) ?? undefined}
                    onClick={isInteractive && !review && mapView.scale <= 1 ? () => onPick({ id: normalize(name), name }) : undefined}
                  />
                )
              })}
            </g>
          ) : null}

          {boundaries.length ? (
            <g className={topic.boundaryLayer === 'seas' ? 'boundary-layer seas-layer' : 'boundary-layer'}>
              {boundaries.map((boundary, index) => {
                const name = boundaryName(boundary)
                const code = boundaryCode(boundary)
                const inScope = boundaryInScope(boundary)
                const isTarget = inScope && boundaryMatchesItem(boundary, current)
                const isExpected = inScope && review && (code ? code === expectedCode : normalize(name) === expectedName)
                const isWrongPick = inScope && review && !review.ok && (code ? code === submittedCode : normalize(name) === submittedName)
                const isPending = inScope && !review && Boolean(code && pendingCode && code === pendingCode)
                const matchedItem = resolveBoundaryItem(boundary)
                const klass = [
                  'boundary-area',
                  !inScope ? 'boundary-out' : '',
                  inScope && canClickBoundaries && !review ? 'boundary-clickable' : '',
                  mode === 'map-type' && isTarget ? 'target-boundary' : '',
                  isPending ? 'selected-boundary' : '',
                  isExpected ? 'correct-boundary' : '',
                  isWrongPick ? 'wrong-boundary' : '',
                ].filter(Boolean).join(' ')

                return <path key={`${name}-${index}`} className={klass} d={path(boundary) ?? undefined} onClick={inScope && canClickBoundaries && !review && mapView.scale <= 1 ? () => onPick(matchedItem) : undefined} />
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
                const isExpected = review && normalize(item.name) === expectedName
                const isWrongPick = review && !review.ok && normalize(item.name) === submittedName
                // map-number must not reveal the target: the prompt is only a number, so a
                // highlighted dot would give away which area to click.
                const revealTarget = isTarget && mode !== 'map-click' && mode !== 'map-number'
                const pointClass = [
                  'map-point',
                  mode === 'map-click' && !review ? 'map-point-clickable' : '',
                  mode === 'map-type' && isTarget ? 'map-point-target' : '',
                  isExpected ? 'map-point-correct' : '',
                  isWrongPick ? 'map-point-wrong' : '',
                ].join(' ')
                return (
                  <g key={item.id} transform={`translate(${point[0]} ${point[1]}) scale(${1 / mapView.scale})`} onClick={mode === 'map-click' && !review && mapView.scale <= 1 ? () => onPick(item) : undefined}>
                    {mode === 'map-click' && !review ? <circle className="map-point-hit" r={9} /> : null}
                    <circle className={pointClass} r={revealTarget ? 5 : 3} />
                    {revealTarget ? <circle className="map-point-pulse" r={10} /> : null}
                  </g>
                )
              })
            : null}
        </g>
      </svg>
      {review && current.note ? <div className="map-note">{current.note}</div> : null}
    </div>
  )
}

function QuizPanel({
  topic,
  mode,
  item,
  pool,
  history,
  review,
  nameInput = false,
  pickReady = false,
  onSubmit,
  onNext,
}: {
  topic: Topic
  mode: QuizMode
  item: QuizItem
  pool: QuizItem[]
  history: AnswerResult[]
  review?: AnswerResult
  nameInput?: boolean
  pickReady?: boolean
  onSubmit: (value: string) => void
  onNext: () => void
}) {
  const [input, setInput] = useState('')
  const options = useMemo(() => {
    const answer = itemAnswer(item, mode)
    // Prefer the item's curated distractor bank (kept compatible in kind with the answer);
    // only every distractor is randomly sampled, the correct answer is always shown. Fall
    // back to other pool answers when a question ships no bank (single-kind decks only).
    const curated = (item.options ?? []).filter((option) => normalize(option) !== normalize(answer))
    const source = curated.length ? curated : pool.filter((candidate) => candidate.id !== item.id).map((candidate) => itemAnswer(candidate, mode))
    const distractors = shuffle([...new Set(source.filter((option) => normalize(option) !== normalize(answer)))]).slice(0, 3)
    return shuffle([answer, ...distractors])
  }, [item, mode, pool])

  const title =
    mode === 'map-click' && topic.id === 'us-cities'
          ? `Click the state of ${item.answer ?? item.name}`
          : mode === 'map-click'
          ? `Click: ${item.name}`
          : mode === 'map-number'
            ? `Click department ${item.code ?? item.name}`
            : mode === 'map-type'
              ? 'Name the highlighted target'
              : mode === 'image'
                ? item.prompt ?? 'Name this work or artist'
                : item.prompt ?? `Answer for ${item.name}`
  const insightRows = review?.insight
    ? [
        ['Location', review.insight.location],
        ['Fact', review.insight.fact],
        ['Note', review.insight.note],
      ].filter((row): row is [string, string] => Boolean(row[1]))
    : []

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

      {mode === 'image' && item.imageUrl && topic.mapKind ? <img className="quiz-image" src={resolveImageUrl(item.imageUrl)} alt="Quiz prompt" /> : null}

      {mode === 'choice' ? (
        <div className="choice-grid">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSubmit(option)} disabled={Boolean(review)}>
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
            if (review) {
              onNext()
              return
            }
            if (input.trim()) onSubmit(input)
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && review) {
                event.preventDefault()
                event.stopPropagation()
                onNext()
                return
              }
              if (event.key === 'Enter' && input.trim()) {
                event.preventDefault()
                onSubmit(input)
              }
            }}
            placeholder="Type the answer"
            autoComplete="off"
            readOnly={Boolean(review)}
            autoFocus
          />
          <button type="submit" disabled={!review && !input.trim()}>
            {review ? 'Next' : 'Check'}
          </button>
        </form>
      ) : null}

      {mode === 'map-number' && nameInput ? (
        <form
          className="answer-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (review) {
              onNext()
              return
            }
            if (pickReady && input.trim()) onSubmit(input)
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && review) {
                event.preventDefault()
                event.stopPropagation()
                onNext()
                return
              }
              if (event.key === 'Enter' && pickReady && input.trim()) {
                event.preventDefault()
                onSubmit(input)
              }
            }}
            placeholder="Type the department name"
            autoComplete="off"
            readOnly={Boolean(review)}
            autoFocus
          />
          <button type="submit" disabled={review ? false : !(pickReady && input.trim())}>
            {review ? 'Next' : 'Check'}
          </button>
        </form>
      ) : null}

      {mode === 'map-number' && !review ? (
        <p className="review-hint">
          {nameInput ? (pickReady ? 'Department selected — type its name, then Check.' : 'Click the department on the map, then type its name.') : 'Click the matching department on the map.'}
        </p>
      ) : null}

      <p className="coverage">{topic.coverage}</p>

      {review ? <p className="review-hint">Press Enter, Space, or the arrow button for the next question.</p> : null}

      {insightRows.length ? (
        <aside className="insight-card" aria-label="Did you know">
          <span className="eyebrow">Did you know?</span>
          {insightRows.map(([label, value]) => (
            <p key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </p>
          ))}
        </aside>
      ) : null}

      {history.length ? (
        <div className="answer-history" aria-label="Answer history">
          {history.map((result) => (
            <article key={result.id} className={result.ok ? 'history-card history-ok' : 'history-card history-bad'}>
              <span>{result.ok ? <Check size={16} /> : <X size={16} />}</span>
              <div>
                <strong>{result.prompt}</strong>
                <p>
                  You answered <b>{stripTrailingPunctuation(result.submitted)}</b>. {result.ok ? 'Correct.' : `Answer: ${stripTrailingPunctuation(result.expected)}.`}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

const planetVisuals = [
  { name: 'Mercury', color: '#8d8780', size: 20 },
  { name: 'Venus', color: '#d9b26f', size: 28 },
  { name: 'Earth', color: '#3579b8', size: 30 },
  { name: 'Mars', color: '#b35a3c', size: 24 },
  { name: 'Jupiter', color: '#d7b184', size: 48 },
  { name: 'Saturn', color: '#d8c28a', size: 44 },
  { name: 'Uranus', color: '#7bc7cf', size: 34 },
  { name: 'Neptune', color: '#496fc4', size: 34 },
]

function SolarSystemQuiz({
  topic,
  history,
  onSubmitSequence,
  onClearResult,
}: {
  topic: Topic
  history: AnswerResult[]
  onSubmitSequence: (sequence: SequenceResult) => void
  onClearResult: () => void
}) {
  const planetItems = topic.items.filter((item) => item.id !== 'asteroid-belt')
  const beltItem = topic.items.find((item) => item.id === 'asteroid-belt')
  const latestResult = history.find((result) => result.sequence)?.sequence
  const [planetAnswers, setPlanetAnswers] = useState(() => planetItems.map(() => ''))
  const [beltAnswer, setBeltAnswer] = useState('')

  function updatePlanetAnswer(index: number, value: string) {
    setPlanetAnswers((previous) => previous.map((answer, answerIndex) => (answerIndex === index ? value : answer)))
  }

  function resetPractice() {
    setPlanetAnswers(planetItems.map(() => ''))
    setBeltAnswer('')
    onClearResult()
  }

  function submitSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const planets = planetItems.map((planet, index) => {
      const submitted = planetAnswers[index]?.trim() ?? ''
      return {
        expected: planet.name,
        submitted,
        ok: matchesAnswer(submitted, planet, 'sequence'),
      }
    })
    const submittedBelt = beltAnswer.trim()
    const belt = {
      expected: beltItem?.answer ?? 'Mars and Jupiter',
      submitted: submittedBelt,
      ok: matchesAsteroidBelt(submittedBelt),
    }
    const correctCount = planets.filter((planet) => planet.ok).length + (belt.ok ? 1 : 0)

    onSubmitSequence({
      planets,
      belt,
      correctCount,
      total: planets.length + 1,
    })
  }

  return (
    <section className="solar-surface">
      <form onSubmit={submitSequence}>
        <div className="solar-diagram" aria-label="Planets from the Sun outward">
          <div className="sun-marker">
            <span />
            <strong>Sun</strong>
          </div>
          <div className="planet-sequence">
            {planetItems.map((planet, index) => {
              const visual = planetVisuals[index] ?? planetVisuals[0]
              const result = latestResult?.planets[index]
              const slotClass = ['planet-slot', result ? (result.ok ? 'slot-ok' : 'slot-bad') : ''].join(' ')

              return (
                <label key={planet.id} className={slotClass}>
                  <span className="planet-orb" style={{ background: visual.color, width: visual.size, height: visual.size }} />
                  <span className="slot-number">{index + 1}</span>
                  <input
                    value={planetAnswers[index] ?? ''}
                    onChange={(event) => updatePlanetAnswer(index, event.target.value)}
                    placeholder={`Planet ${index + 1}`}
                    autoComplete="off"
                  />
                  {result && !result.ok ? <small>{result.expected}</small> : null}
                </label>
              )
            })}
          </div>
        </div>

        <div className="belt-quiz">
          <div>
            <span className="eyebrow">Asteroid belt</span>
            <h2>{beltItem?.prompt ?? 'Between which two planets is the main asteroid belt?'}</h2>
            <p>The belt is deliberately not drawn on the planet line.</p>
          </div>
          <div className={latestResult ? (latestResult.belt.ok ? 'belt-answer belt-ok' : 'belt-answer belt-bad') : 'belt-answer'}>
            <input value={beltAnswer} onChange={(event) => setBeltAnswer(event.target.value)} placeholder="Example: Mars and Jupiter" autoComplete="off" />
            {latestResult ? <span>{latestResult.belt.ok ? 'Correct' : `Answer: ${latestResult.belt.expected}`}</span> : null}
          </div>
        </div>

        <div className="solar-actions">
          <button type="submit">Check sequence</button>
          <button type="button" onClick={resetPractice}>
            Clear
          </button>
        </div>
      </form>

      {latestResult ? (
        <section className={latestResult.correctCount === latestResult.total ? 'solar-result result-ok' : 'solar-result result-bad'}>
          <strong>
            {latestResult.correctCount}/{latestResult.total} correct
          </strong>
          <p>Planet order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.</p>
          <p>Asteroid belt: between Mars and Jupiter.</p>
        </section>
      ) : null}
    </section>
  )
}

function quizTitle(topic: Topic, mode: QuizMode, item: QuizItem) {
  if (mode === 'map-click' && topic.id === 'us-cities') return `Click the state of ${item.answer ?? item.name}`
  if (mode === 'map-click') return `Click: ${item.name}`
  if (mode === 'map-number') return `Click department ${item.code ?? item.name}`
  if (mode === 'map-type') return 'Name the highlighted area'
  return item.prompt ?? `Answer for ${item.name}`
}

type MobileMapGameProps = {
  topic: Topic
  mode: QuizMode
  current: QuizItem
  pool: QuizItem[]
  countries: CountryFeature[]
  review?: AnswerResult
  pendingPick: { code?: string; name: string } | null
  scope: string
  usGuess: UsGuess
  alsoNameDepartment: boolean
  score: Score
  accuracy: number
  round: RoundState
  roundResults: AnswerResult[]
  roundComplete: boolean
  landscape: boolean
  grouped: Record<string, Topic[]>
  activeTopicId: string
  onSelectTopic: (id: string) => void
  onPick: (item: QuizItem) => void
  onSubmit: (value: string) => void
  onNext: () => void
  onStartNewRound: () => void
  onScope: (scope: string) => void
  onGuess: (guess: UsGuess) => void
  onMode: (mode: QuizMode) => void
  onToggleName: (value: boolean) => void
  onReset: () => void
}

function MobileMapGame(props: MobileMapGameProps) {
  const { topic, mode, current, pool, countries, review, pendingPick, scope, usGuess, alsoNameDepartment, score, accuracy, round, roundComplete, landscape } = props
  const [input, setInput] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const questionKey = `${current.id}:${mode}:${scope}:${usGuess}`
  const [lastKey, setLastKey] = useState(questionKey)
  if (questionKey !== lastKey) {
    // New question/deck: clear the field without remounting the map (keeps zoom/pan).
    setLastKey(questionKey)
    setInput('')
  }
  const regions = regionOptions(topic)
  const needsInput = mode === 'type' || mode === 'map-type' || (mode === 'map-number' && alsoNameDepartment)
  const pickReady = Boolean(pendingPick)

  if (roundComplete) {
    return (
      <section className="mobile-map-game mmg-results">
        <RoundResultsPanel topic={topic} results={props.roundResults} deckSize={pool.length} onStartNewRound={props.onStartNewRound} mobile />
      </section>
    )
  }

  const progress = round.completed ? `${pool.length}/${pool.length}` : `${Math.min(round.position + 1, pool.length)}/${pool.length}`
  const inputValid = needsInput && (mode === 'map-number' ? pickReady && input.trim() : Boolean(input.trim()))

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review) {
      props.onNext()
      return
    }
    if (inputValid) props.onSubmit(input)
  }

  const regionSelect = regions.length ? (
    <label className="mmg-select">
      <span>Region</span>
      <select value={scope} onChange={(event) => props.onScope(event.target.value)}>
        {regions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ) : null

  const guessSelect =
    topic.id === 'us-cities' ? (
      <label className="mmg-select">
        <span>Guess</span>
        <select value={usGuess} onChange={(event) => props.onGuess(event.target.value as UsGuess)}>
          {usGuessOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ) : null

  const modeSelect = (
    <label className="mmg-select">
      <span>Quiz type</span>
      <select value={mode} onChange={(event) => props.onMode(event.target.value as QuizMode)}>
        {topic.modes.map((availableMode) => (
          <option key={availableMode} value={availableMode}>
            {modeLabel(topic, availableMode)}
          </option>
        ))}
      </select>
    </label>
  )

  const toggleControl =
    mode === 'map-number' ? (
      <label className="mmg-toggle">
        <input type="checkbox" checked={alsoNameDepartment} onChange={(event) => props.onToggleName(event.target.checked)} />
        <span>Also type the department name</span>
      </label>
    ) : null

  const promptBlock = (
    <>
      <div className="mmg-status">
        <span>{progress}</span>
        <span>{accuracy}% acc</span>
        <span>🔥 {score.streak}</span>
      </div>
      <h2>{quizTitle(topic, mode, current)}</h2>

      {needsInput ? (
        <form className="mmg-input" onSubmit={handleFormSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === 'map-number' ? (pickReady ? 'Type the department name' : 'Tap the department first') : 'Type the answer'}
            autoComplete="off"
            readOnly={Boolean(review)}
            enterKeyHint={review ? 'next' : 'done'}
          />
          <button type="submit" disabled={review ? false : !inputValid}>
            {review ? 'Next' : 'Check'}
          </button>
        </form>
      ) : null}

      {review ? (
        <div className={review.ok ? 'mmg-result ok' : 'mmg-result bad'}>
          <span>{review.ok ? 'Correct' : `Answer: ${stripTrailingPunctuation(review.expected)}`}</span>
          {needsInput ? null : (
            <button type="button" onClick={props.onNext}>
              Next
            </button>
          )}
        </div>
      ) : !needsInput ? (
        <button className="mmg-skip" type="button" onClick={props.onNext}>
          Skip
        </button>
      ) : null}
    </>
  )

  const mapNode = (
    <div className="mmg-map">
      <CultureMap key={`${topic.id}:${mode}:${scope}:${usGuess}`} topic={topic} mode={mode} current={current} items={pool} countries={countries} review={review} pendingCode={pendingPick?.code} onPick={props.onPick} />
    </div>
  )

  if (landscape) {
    return (
      <section className="mobile-map-game mmg-landscape">
        {mapNode}
        <div className="mmg-widget">{promptBlock}</div>
        <button className="mmg-drawer-toggle" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        {drawerOpen ? <div className="mmg-scrim" onClick={() => setDrawerOpen(false)} /> : null}
        <aside className={drawerOpen ? 'mmg-drawer open' : 'mmg-drawer'} aria-hidden={!drawerOpen}>
          <div className="mmg-drawer-head">
            <strong>Menu</strong>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <label className="mmg-select">
            <span>Deck</span>
            <select value={props.activeTopicId} onChange={(event) => props.onSelectTopic(event.target.value)}>
              {Object.entries(props.grouped).map(([group, groupTopics]) => (
                <optgroup key={group} label={group}>
                  {groupTopics.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {regionSelect}
          {guessSelect}
          {modeSelect}
          {toggleControl}
          <button className="mmg-drawer-reset" type="button" onClick={props.onReset}>
            <RotateCcw size={16} />
            Reset scores
          </button>
        </aside>
      </section>
    )
  }

  return (
    <section className="mobile-map-game">
      <div className="mmg-toolbar">
        {regionSelect}
        {guessSelect}
        {modeSelect}
        <button className="mmg-reset" type="button" onClick={props.onReset} aria-label="Reset scores">
          <RotateCcw size={16} />
        </button>
      </div>

      {toggleControl}

      <div className="mmg-prompt">{promptBlock}</div>

      {mapNode}
    </section>
  )
}

function App() {
  const countryFeatures = useMemo(() => {
    const collection = feature(countries110m as never, (countries110m as never as { objects: { countries: never } }).objects.countries)
    return splitFrenchGuiana((collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>).features)
  }, [])

  const fullTopics = useMemo<Topic[]>(() => {
    const countryTopicItems = countryItemsFromFeatures(countryFeatures)
    const seaTopicItems = seaItemsFromFeatures()
    return topics.map((topic) => {
      const withItems = topic.id === 'world-countries' ? { ...topic, items: countryTopicItems } : topic.id === 'seas' ? { ...topic, items: seaTopicItems } : topic
      return attachBoundaryCodes(withItems)
    })
  }, [countryFeatures])

  const initialParams = useMemo(() => readGameParams(fullTopics), [fullTopics])
  const [topicId, setTopicId] = useState(initialParams.topicId)
  const activeTopic = fullTopics.find((topic) => topic.id === topicId) ?? fullTopics[0]
  const [mode, setMode] = useState<QuizMode>(initialParams.mode)
  const [scope, setScope] = useState<string>(initialParams.scope)
  const [usGuess, setUsGuess] = useState<UsGuess>(initialParams.usGuess)
  const [scores, setScores] = useState<Record<string, Score>>(() => loadScores())
  const [histories, setHistories] = useState<Record<string, AnswerResult[]>>({})
  const [roundResults, setRoundResults] = useState<Record<string, AnswerResult[]>>({})
  const [reviews, setReviews] = useState<Record<string, AnswerResult | undefined>>({})
  const [pageView, setPageView] = useState<PageView>(initialParams.pageView)
  const [alsoNameDepartment, setAlsoNameDepartment] = useState(false)
  const [pendingPick, setPendingPick] = useState<{ code?: string; name: string } | null>(null)
  const [roundStates, setRoundStates] = useState<Record<string, RoundState>>(() => {
    const firstTopic = fullTopics.find((topic) => topic.id === initialParams.topicId) ?? fullTopics[0]
    return {
      [roundKey(firstTopic, initialParams.mode, initialParams.scope, initialParams.usGuess)]: createRoundState(
        poolForTopic(firstTopic, initialParams.mode, initialParams.scope, initialParams.usGuess),
      ),
    }
  })

  const pool = useMemo(() => poolForTopic(activeTopic, mode, scope, usGuess), [activeTopic, mode, scope, usGuess])
  const activeRoundKey = roundKey(activeTopic, mode, scope, usGuess)
  const activePracticeKey = scoreKey(activeTopic, mode, scope, usGuess)
  const activeRound = ensureRoundState(roundStates[activeRoundKey], pool)
  const current = pool[Math.min(activeRound.index, Math.max(pool.length - 1, 0))] ?? pool[0]
  const activeScore = scores[activePracticeKey] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
  const activeHistory = histories[activePracticeKey] ?? []
  const activeRoundResults = roundResults[activeRoundKey] ?? []
  const activeReview = reviews[activePracticeKey]
  const accuracy = activeScore.attempts ? Math.round((activeScore.correct / activeScore.attempts) * 100) : 0
  const activeCourse = courseArticles[activeTopic.id]
  const hasCourseView = Boolean(activeCourse) || isCoursePairTopic(activeTopic)
  const activePageView: PageView = hasCourseView ? (isCoursePairTopic(activeTopic) && pageView === 'questions' ? 'practice' : pageView) : 'practice'

  useEffect(() => {
    writeGameParams(activeTopic, { mode, scope, usGuess, pageView: activePageView })
  }, [activeTopic, mode, scope, usGuess, activePageView])
  const roundResultsVisible = activeRound.completed && !activeReview
  // Self-contained course-pair games (cities, landmarks, paintings) render their own component
  // even though a landmark topic carries a mapKind — never route them through the generic map engine.
  const isMapTopic = Boolean(activeTopic.mapKind) && !isHistoryDateTopic(activeTopic) && activeTopic.id !== 'solar-system' && !isCoursePairTopic(activeTopic)
  const mapWorkspace = activePageView === 'practice' && isMapTopic
  const showingMapStage = mapWorkspace && !roundResultsVisible
  const isMobile = useMedia(MOBILE_QUERY)
  const isLandscapePhone = useMedia(LANDSCAPE_PHONE_QUERY)
  const mobileMapGame = isMobile && mapWorkspace
  // Self-contained map games (colonies) reuse the map-first shell: compact header + full-height
  // flex so the component's own .map-stage fills the viewport with floating overlays.
  const coloniesStage = activePageView === 'practice' && isColoniesTopic(activeTopic)
  // Cities and landmarks are map-first (full-bleed map + floating overlays). Paintings is a
  // course-pair game too, but it has no map — it uses the normal, padded document workspace.
  const mapCoursePair = activePageView === 'practice' && (isCityTopic(activeTopic) || isLandmarkTopic(activeTopic))
  const paintingPractice = activePageView === 'practice' && isPaintingTopic(activeTopic)
  // Paintings gets the compact header (reclaims vertical space) but NOT the full-bleed map shell.
  const compactHeader = mapWorkspace || coloniesStage || mapCoursePair || paintingPractice
  const fullBleedWorkspace = showingMapStage || coloniesStage || mapCoursePair
  const mobileSelfContained = isMobile && (coloniesStage || mapCoursePair)
  const mobileMapActive = mobileMapGame || mobileSelfContained

  const advanceRound = useCallback(() => {
    setPendingPick(null)
    setReviews((previous) => ({ ...previous, [activePracticeKey]: undefined }))
    setRoundStates((previous) => {
      const previousRound = ensureRoundState(previous[activeRoundKey], pool)
      const nextPosition = previousRound.position + 1
      const nextRoundId = previousRound.roundId + 1

      if (nextPosition < previousRound.order.length) {
        return {
          ...previous,
          [activeRoundKey]: {
            ...previousRound,
            index: previousRound.order[nextPosition],
            position: nextPosition,
            roundId: nextRoundId,
            completed: false,
          },
        }
      }

      return {
        ...previous,
        [activeRoundKey]: {
          ...previousRound,
          roundId: nextRoundId,
          completed: true,
        },
      }
    })
  }, [activePracticeKey, activeRoundKey, pool])

  function record(submitted: string, ok: boolean, expected: string, insight?: AnswerInsight, codes?: { submittedCode?: string; expectedCode?: string }) {
    if (activeReview) return
    const key = activePracticeKey
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
    const result: AnswerResult = {
      id: `${activePracticeKey}:${activeRound.roundId}:${Date.now()}`,
      ok,
      prompt: promptLabel(activeTopic, mode, current),
      submitted,
      expected,
      expectedName: current.name,
      submittedName: submitted,
      expectedCode: codes?.expectedCode,
      submittedCode: codes?.submittedCode,
      insight,
    }
    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [
        result,
        ...(previousHistories[activePracticeKey] ?? []),
      ].slice(0, 20),
    }))
    setRoundResults((previousResults) => ({
      ...previousResults,
      [activeRoundKey]: [...(previousResults[activeRoundKey] ?? []), result],
    }))
    setReviews((previous) => ({ ...previous, [activePracticeKey]: result }))
  }

  function submit(value: string) {
    if (mode === 'map-number') {
      submitDepartmentName(value)
      return
    }
    record(value, matchesAnswer(value, current, mode), displayAnswer(current, mode), answerInsight(current))
  }

  function pickMapItem(item: QuizItem) {
    if (mode === 'map-number' && alsoNameDepartment) {
      setPendingPick({ code: item.code, name: item.name })
      return
    }
    const ok = current.code && item.code ? item.code === current.code : matchesAnswer(item.name, current, mode)
    record(item.name, ok, current.label ?? current.name, answerInsight(current), { submittedCode: item.code, expectedCode: current.code })
  }

  function submitDepartmentName(value: string) {
    if (!pendingPick) return
    const locationOk = Boolean(current.code && pendingPick.code && pendingPick.code === current.code)
    const nameOk = matchesAnswer(value, current, 'map-type')
    const submitted = `${pendingPick.name} clicked, "${value.trim()}" typed`
    record(submitted, locationOk && nameOk, current.name, answerInsight(current), { submittedCode: pendingPick.code, expectedCode: current.code })
    setPendingPick(null)
  }

  function recordSequence(sequence: SequenceResult) {
    const key = activePracticeKey
    const previous = scores[key] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
    const perfect = sequence.correctCount === sequence.total
    const streak = perfect ? previous.streak + 1 : 0
    const updated = {
      ...scores,
      [key]: {
        attempts: previous.attempts + sequence.total,
        correct: previous.correct + sequence.correctCount,
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      },
    }
    setScores(updated)
    saveScores(updated)

    const result = {
      id: `${activePracticeKey}:sequence:${Date.now()}`,
      ok: perfect,
      prompt: 'Solar system order',
      submitted: `${sequence.correctCount}/${sequence.total} correct`,
      expected: 'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune; asteroid belt between Mars and Jupiter.',
      expectedName: 'Solar system order',
      submittedName: 'Solar system order',
      sequence,
    }

    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [
        result,
        ...(previousHistories[activePracticeKey] ?? []),
      ].slice(0, 10),
    }))
  }

  function clearSequenceResult() {
    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [],
    }))
  }

  function nextRound() {
    advanceRound()
  }

  function startNewRound() {
    const nextRoundId = activeRound.roundId + 1
    setPendingPick(null)
    setReviews((previous) => ({ ...previous, [activePracticeKey]: undefined }))
    setHistories((previous) => ({ ...previous, [activePracticeKey]: [] }))
    setRoundResults((previous) => ({ ...previous, [activeRoundKey]: [] }))
    setRoundStates((previous) => ({
      ...previous,
      [activeRoundKey]: createRoundState(pool, nextRoundId),
    }))
  }

  function activateMode(topic: Topic, nextMode: QuizMode) {
    const nextKey = roundKey(topic, nextMode, scope, usGuess)
    const nextPool = poolForTopic(topic, nextMode, scope, usGuess)
    setPendingPick(null)
    setMode(nextMode)
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
  }

  function activateScope(nextScope: string) {
    const nextKey = roundKey(activeTopic, mode, nextScope, usGuess)
    const nextPool = poolForTopic(activeTopic, mode, nextScope, usGuess)
    setScope(nextScope)
    setPendingPick(null)
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
  }

  function activateGuess(nextGuess: UsGuess) {
    const nextKey = roundKey(activeTopic, mode, scope, nextGuess)
    const nextPool = poolForTopic(activeTopic, mode, scope, nextGuess)
    setUsGuess(nextGuess)
    setPendingPick(null)
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
  }

  function activateTopic(topic: Topic) {
    const nextMode = topic.modes[0]
    const nextScope = defaultScope(topic)
    const nextGuess: UsGuess = 'capital'
    const nextKey = roundKey(topic, nextMode, nextScope, nextGuess)
    const nextPool = poolForTopic(topic, nextMode, nextScope, nextGuess)
    setTopicId(topic.id)
    setMode(nextMode)
    setScope(nextScope)
    setUsGuess(nextGuess)
    setPageView('practice')
    setPendingPick(null)
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
    window.scrollTo(0, 0)
  }

  function resetScores() {
    if (!window.confirm('Reset all scores for every topic? This cannot be undone.')) return
    localStorage.removeItem('culture-quizzer-scores')
    localStorage.removeItem('culture-quizzer-history-scores')
    localStorage.removeItem('culture-quizzer-city-scores')
    setScores({})
    setHistories({})
    setRoundResults({})
    setReviews({})
  }

  useEffect(() => {
    if (!activeReview) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      advanceRound()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeReview, advanceRound])

  const grouped = useMemo(() => {
    return fullTopics.reduce<Record<string, Topic[]>>((acc, topic) => {
      acc[topic.group] ??= []
      acc[topic.group].push(topic)
      return acc
    }, {})
  }, [fullTopics])

  return (
    <main className={['app-shell', mobileMapActive ? 'mobile-map-active' : '', mobileMapGame && isLandscapePhone ? 'mobile-landscape' : ''].filter(Boolean).join(' ')}>
      <header className="mobile-header">
        <div className="mobile-brand">
          <Globe2 size={20} />
          <strong>Culture Quizzer</strong>
        </div>
        <select
          className="mobile-topic-select"
          value={activeTopic.id}
          onChange={(e) => {
            const topic = fullTopics.find((t) => t.id === e.target.value)
            if (topic) activateTopic(topic)
          }}
          aria-label="Select topic"
        >
          {Object.entries(grouped).map(([group, groupTopics]) => (
            <optgroup key={group} label={group}>
              {groupTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </header>

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

      {mobileMapGame ? (
        <MobileMapGame
          topic={activeTopic}
          mode={mode}
          current={current}
          pool={pool}
          countries={countryFeatures}
          review={activeReview}
          pendingPick={pendingPick}
          scope={scope}
          usGuess={usGuess}
          alsoNameDepartment={alsoNameDepartment}
          score={activeScore}
          accuracy={accuracy}
          round={activeRound}
          roundResults={activeRoundResults}
          roundComplete={Boolean(roundResultsVisible)}
          landscape={isLandscapePhone}
          grouped={grouped}
          activeTopicId={activeTopic.id}
          onSelectTopic={(id) => {
            const nextTopic = fullTopics.find((entry) => entry.id === id)
            if (nextTopic) activateTopic(nextTopic)
          }}
          onPick={pickMapItem}
          onSubmit={submit}
          onNext={nextRound}
          onStartNewRound={startNewRound}
          onScope={activateScope}
          onGuess={activateGuess}
          onMode={(nextMode) => activateMode(activeTopic, nextMode)}
          onToggleName={(value) => {
            setAlsoNameDepartment(value)
            setPendingPick(null)
          }}
          onReset={resetScores}
        />
      ) : mobileSelfContained && isColoniesTopic(activeTopic) ? (
        <ColoniesQuiz key={activeTopic.id} topic={activeTopic} mobile onReset={resetScores} />
      ) : mobileSelfContained && isCityTopic(activeTopic) ? (
        <CityQuiz
          key={`${activeTopic.id}:${mode}`}
          topic={activeTopic}
          mode={mode}
          mobile
          pageView={activePageView}
          onPageView={setPageView}
          onMode={(nextMode) => activateMode(activeTopic, nextMode)}
          onReset={resetScores}
        />
      ) : mobileSelfContained && isLandmarkTopic(activeTopic) ? (
        <LandmarkQuiz
          key={`${activeTopic.id}:${mode}`}
          topic={activeTopic}
          mode={mode}
          mobile
          pageView={activePageView}
          onPageView={setPageView}
          onMode={(nextMode) => activateMode(activeTopic, nextMode)}
          onReset={resetScores}
        />
      ) : (
      <section className={['workspace', compactHeader ? 'map-workspace' : '', fullBleedWorkspace ? 'map-full' : ''].filter(Boolean).join(' ')}>
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

        {hasCourseView ? (
          <div className="view-control" role="tablist" aria-label="Section view">
            {(isCoursePairTopic(activeTopic) ? (['practice', 'course'] as PageView[]) : (['practice', 'course', 'questions'] as PageView[])).map((view) => (
              <button key={view} className={activePageView === view ? 'view-button active' : 'view-button'} type="button" onClick={() => setPageView(view)}>
                {isCoursePairTopic(activeTopic) ? (view === 'practice' ? 'Play' : 'Course') : view === 'practice' ? 'Practice' : view === 'course' ? 'Course' : 'Questions'}
              </button>
            ))}
          </div>
        ) : null}

        {activePageView === 'practice' ? (
          <>
            {isColoniesTopic(activeTopic) ? null : (
            <div className="control-bar">
            {regionOptions(activeTopic).length ? (
              <div className="mode-control">
                <span>Region</span>
                <div className="mode-row" role="tablist" aria-label="Region">
                  {regionOptions(activeTopic).map((option) => (
                    <button
                      key={option.key}
                      className={option.key === scope ? 'mode-button active' : 'mode-button'}
                      type="button"
                      onClick={() => activateScope(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTopic.id === 'us-cities' ? (
              <div className="mode-control">
                <span>Guess</span>
                <div className="mode-row" role="tablist" aria-label="Guess">
                  {usGuessOptions.map((option) => (
                    <button
                      key={option.key}
                      className={option.key === usGuess ? 'mode-button active' : 'mode-button'}
                      type="button"
                      onClick={() => activateGuess(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

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

            {mode === 'map-number' ? (
              <div className="mode-control">
                <span>Options</span>
                <label className="name-toggle">
                  <input
                    type="checkbox"
                    checked={alsoNameDepartment}
                    onChange={(event) => {
                      setAlsoNameDepartment(event.target.checked)
                      setPendingPick(null)
                    }}
                  />
                  <span>Also type the department name</span>
                </label>
              </div>
            ) : null}
            </div>
            )}

            {isHistoryDateTopic(activeTopic) || isColoniesTopic(activeTopic) || isCoursePairTopic(activeTopic) || showingMapStage ? null : (
              <section className="score-strip" aria-label="Current score">
                <Stat label="Deck" value={pool.length} />
                <Stat label="Progress" value={activeRound.completed ? `${pool.length}/${pool.length}` : `${Math.min(activeRound.position + 1, pool.length)}/${pool.length}`} />
                <Stat label="Correct" value={activeScore.correct} />
                <Stat label="Attempts" value={activeScore.attempts} />
                <Stat label="Accuracy" value={`${accuracy}%`} />
                <Stat label="Best streak" value={activeScore.bestStreak} />
              </section>
            )}

            {isColoniesTopic(activeTopic) ? (
              <ColoniesQuiz key={activeTopic.id} topic={activeTopic} />
            ) : isCityTopic(activeTopic) ? (
              <CityQuiz key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} />
            ) : isLandmarkTopic(activeTopic) ? (
              <LandmarkQuiz key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} />
            ) : isPaintingTopic(activeTopic) ? (
              <PaintingQuiz key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} />
            ) : isHistoryDateTopic(activeTopic) ? (
              <HistoryDateQuiz key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} />
            ) : activeTopic.id === 'solar-system' ? (
              <SolarSystemQuiz topic={activeTopic} history={activeHistory} onSubmitSequence={recordSequence} onClearResult={clearSequenceResult} />
            ) : roundResultsVisible ? (
              <RoundResultsPanel topic={activeTopic} results={activeRoundResults} deckSize={pool.length} onStartNewRound={startNewRound} />
            ) : activeTopic.mapKind ? (
              <div className="map-stage">
                <CultureMap key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} current={current} items={pool} countries={countryFeatures} review={activeReview} pendingCode={pendingPick?.code} onPick={pickMapItem} />

                <section className="score-strip score-overlay" aria-label="Current score">
                  <Stat label="Deck" value={pool.length} />
                  <Stat label="Progress" value={activeRound.completed ? `${pool.length}/${pool.length}` : `${Math.min(activeRound.position + 1, pool.length)}/${pool.length}`} />
                  <Stat label="Correct" value={activeScore.correct} />
                  <Stat label="Attempts" value={activeScore.attempts} />
                  <Stat label="Accuracy" value={`${accuracy}%`} />
                  <Stat label="Best streak" value={activeScore.bestStreak} />
                </section>

                <div className="quiz-overlay">
                  <QuizPanel
                    key={`${activePracticeKey}:${activeRound.roundId}`}
                    topic={activeTopic}
                    mode={mode}
                    item={current}
                    pool={pool}
                    history={activeHistory}
                    review={activeReview}
                    nameInput={mode === 'map-number' && alsoNameDepartment}
                    pickReady={Boolean(pendingPick)}
                    onSubmit={submit}
                    onNext={nextRound}
                  />
                </div>
              </div>
            ) : (
              <div className={current.imageUrl ? 'practice-grid' : 'practice-grid quiz-only'}>
                {current.imageUrl ? (
                  <section className="study-surface image-surface">
                    <img src={resolveImageUrl(current.imageUrl)} alt="Quiz prompt" />
                  </section>
                ) : null}

                <QuizPanel
                  key={`${activePracticeKey}:${activeRound.roundId}`}
                  topic={activeTopic}
                  mode={mode}
                  item={current}
                  pool={pool}
                  history={activeHistory}
                  review={activeReview}
                  nameInput={mode === 'map-number' && alsoNameDepartment}
                  pickReady={Boolean(pendingPick)}
                  onSubmit={submit}
                  onNext={nextRound}
                />
              </div>
            )}
          </>
        ) : activePageView === 'course' && isCityTopic(activeTopic) ? (
          <CityCourse topic={activeTopic} />
        ) : activePageView === 'course' && isLandmarkTopic(activeTopic) ? (
          <LandmarkCourse topic={activeTopic} />
        ) : activePageView === 'course' && isPaintingTopic(activeTopic) ? (
          <PaintingCourse topic={activeTopic} />
        ) : activePageView === 'course' && activeCourse ? (
          <CoursePanel article={activeCourse} />
        ) : activePageView === 'questions' ? (
          <QuestionReferencePanel topic={activeTopic} article={activeCourse} />
        ) : null}
      </section>
      )}
    </main>
  )
}

export default App
