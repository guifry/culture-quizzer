export type MapScope = 'world' | 'europe' | 'uk' | 'france' | 'usa'

export type QuizMode =
  | 'map-click'
  | 'map-number'
  | 'map-type'
  | 'map-multi'
  | 'type'
  | 'choice'
  | 'image'
  | 'sequence'
  | 'date-recall'
  | 'event-recall'
  | 'city-locate'
  | 'city-photos'
  | 'city-clue'
  | 'landmark-locate'
  | 'landmark-photos'
  | 'landmark-clue'
  | 'paintings-identify'
  | 'paintings-clue'
  | 'paintings-expert'
  | 'dynasty-chain'

export type TopicGroup =
  | 'Geography'
  | 'History'
  | 'Politics'
  | 'Music'
  | 'Art'
  | 'Literature'
  | 'Philosophy'
  | 'Science'

export type QuizItem = {
  id: string
  name: string
  code?: string
  region?: string
  mainCity?: string
  label?: string
  answer?: string
  prompt?: string
  detail?: string
  note?: string
  location?: string
  facts?: string[]
  lat?: number
  lon?: number
  aliases?: string[]
  imageUrl?: string
  options?: string[]
  era?: string
}

export type ColonyStatus = 'former' | 'current'

export type ColonyRelation = {
  coloniser: string
  country: string
  status: ColonyStatus
  lostYear?: number
  independenceYear?: number
  note?: string
}

export type HistoryDate = {
  id: string
  date: string
  event: string
  location: string
  locationAccept: string[]
  eventAccept: string[]
  summary: string
}

export type CityEntry = {
  id: string
  name: string
  aliases?: string[]
  country: string
  usState?: string
  lat: number
  lon: number
  fact: string
  blurb?: string
  population?: number
  course?: string
  images?: number
}

export type Nation = string

export type LandmarkCourse = {
  nutshell: string
  when: string
  who: string
  people?: string[]
  events?: string[]
  concepts: string[]
}

export type Landmark = {
  id: string
  name: string
  nameFr?: string
  aliases?: string[]
  nation: Nation
  region?: string
  lat: number
  lon: number
  zone?: Array<[number, number]>
  essential?: boolean
  mapBlurb: string
  course: LandmarkCourse
  clues: string[]
}

export type PaintingCourse = {
  nutshell: string
  when: string
  who: string
  analysis: string
  anecdote?: string
  concepts: string[]
}

export type Painting = {
  id: string
  name: string
  aliases?: string[]
  artist: string
  artistAliases?: string[]
  nationality: string
  century: string
  movement: string
  movementAliases?: string[]
  year: number
  essential?: boolean
  course: PaintingCourse
  clues: string[]
}

export type GlossaryTerm = {
  key: string
  term: string
  span?: string
  definition: string
}

export type Topic = {
  id: string
  title: string
  group: TopicGroup
  description: string
  modes: QuizMode[]
  mapScope?: MapScope
  mapKind?: 'country-polygons' | 'points'
  boundaryLayer?: 'fr-departments' | 'fr-regions' | 'uk-admin' | 'us-states' | 'seas'
  // When true the boundary regions ARE the answer targets (click the region, matched by
  // identity). When false/absent the boundary layer is a decorative backdrop and the quiz
  // clicks point markers instead.
  boundaryTarget?: boolean
  items: QuizItem[]
  coverage: string
  kind?: 'history-dates' | 'colonies' | 'city-quiz' | 'landmark-quiz' | 'paintings-quiz' | 'dynasty-quiz'
  dates?: HistoryDate[]
  colonies?: ColonyRelation[]
  cities?: CityEntry[]
  landmarks?: Landmark[]
  paintings?: Painting[]
  dynasties?: Dynasty[]
  glossary?: GlossaryTerm[]
}

export type DynastyBranch = {
  name: string
  start: number
  end: number
}

export type Dynasty = {
  id: string
  name: string
  nameEn: string
  start: number
  // null for the current regime.
  end: number | null
  startLabel?: string
  endLabel?: string
  // Extra years accepted as correct, where the regime's span is legitimately reported two
  // ways (e.g. the chain's Restauration link absorbs the Cent-Jours, so 1814 or 1815).
  acceptStart?: number[]
  acceptEnd?: number[]
  // Accepted spellings when the player types the regime name. Matched EXACTLY (after
  // normalising accents/punctuation) — fuzzy matching would let "IIe" pass for "IIIe".
  nameAliases?: string[]
  // Part of the sixteen-link minimal chain to memorise.
  chain?: boolean
  chainLabel?: string
  branches?: DynastyBranch[]
  // Absent where the regime had no single head of state (e.g. the First Republic).
  rulers?: { first: string; last: string }
  rulerAliases?: Record<string, string[]>
  note: string
}
