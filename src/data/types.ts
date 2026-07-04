export type MapScope = 'world' | 'europe' | 'uk' | 'france' | 'usa'

export type QuizMode =
  | 'map-click'
  | 'map-number'
  | 'map-type'
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
  boundaryLayer?: 'fr-departments' | 'fr-regions' | 'uk-admin' | 'us-states'
  items: QuizItem[]
  coverage: string
  kind?: 'history-dates'
  dates?: HistoryDate[]
}
