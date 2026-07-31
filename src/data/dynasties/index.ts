import type { Topic } from '../types'
import { buildDynastyTopic } from './types'
import { franceDynasties } from './france-dynasties'

export const dynastyTopics: Topic[] = [
  buildDynastyTopic(
    'france-dynasties',
    'Dynasties et régimes français',
    'Rebuild the chain of French dynasties from Clovis to today, then date each regime and name its first and last leader.',
    'Eighteen dynasties and regimes from the Merovingians to the Fifth Republic, played three ways: order the chain, give the dates, name the leaders.',
    ['dynasty-chain', 'dynasty-dates', 'dynasty-rulers'],
    franceDynasties,
  ),
]
