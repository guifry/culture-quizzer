import type { Topic } from '../types'
import { buildDynastyTopic } from './types'
import { franceDynasties } from './france-dynasties'

export const dynastyTopics: Topic[] = [
  buildDynastyTopic(
    'france-dynasties',
    'Dynasties et régimes français',
    'Rebuild the chain of French dynasties from Clovis to today — and optionally recall each regime\u2019s name, dates and leaders.',
    'Eighteen dynasties and regimes from the Merovingians to the Fifth Republic, ordered as one chain, with optional name, date and leader recall layered on top.',
    ['dynasty-chain'],
    franceDynasties,
  ),
]
