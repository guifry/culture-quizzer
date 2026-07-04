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
  kind?: 'history-dates' | 'colonies'
  dates?: HistoryDate[]
  colonies?: ColonyRelation[]
}
