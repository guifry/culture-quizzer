import type { HistoryDate, Topic } from '../types'
import { aliasOverlay } from './aliases'

function mergeAliases(entry: HistoryDate): HistoryDate {
  const extra = aliasOverlay[entry.id]
  if (!extra) return entry
  return {
    ...entry,
    locationAccept: [...new Set([...entry.locationAccept, ...(extra.locationAccept ?? [])])],
    eventAccept: [...new Set([...entry.eventAccept, ...(extra.eventAccept ?? [])])],
  }
}

export function buildHistoryTopic(
  id: string,
  title: string,
  description: string,
  coverage: string,
  dates: HistoryDate[],
): Topic {
  const merged = dates.map(mergeAliases)
  return {
    id,
    title,
    group: 'History',
    description,
    coverage,
    modes: ['date-recall', 'event-recall'],
    kind: 'history-dates',
    dates: merged,
    items: merged.map((entry) => ({
      id: entry.id,
      name: entry.event,
      answer: entry.date,
      prompt: entry.event,
      location: entry.location,
    })),
  }
}
