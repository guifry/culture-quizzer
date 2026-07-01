import type { Topic } from '../types'
import { buildHistoryTopic } from './types'
import { worldDates } from './world-dates'
import { franceDates } from './france-dates'
import { ukDates } from './uk-dates'
import { polandDates } from './poland-dates'

export const historyDateTopics: Topic[] = [
  buildHistoryTopic(
    'world-history-dates',
    'World History Dates',
    'Given the event, recall the date and location — or given the date, name the event.',
    'Top 36 turning points in world history, playable both ways.',
    worldDates,
  ),
  buildHistoryTopic(
    'france-history-dates',
    'French History Dates',
    'Given the event, recall the date and location — or given the date, name the event.',
    'Top 21 dates in French history, playable both ways.',
    franceDates,
  ),
  buildHistoryTopic(
    'uk-history-dates',
    'UK History Dates',
    'Given the event, recall the date and location — or given the date, name the event.',
    'Top 24 dates in United Kingdom history, playable both ways.',
    ukDates,
  ),
  buildHistoryTopic(
    'poland-history-dates',
    'Poland History Dates',
    'Given the event, recall the date and location — or given the date, name the event.',
    'Top 20 dates in Polish history, playable both ways.',
    polandDates,
  ),
]
