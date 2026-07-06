import type { Topic } from '../types'
import { buildCityTopic } from './types'
import { worldCities } from './world-cities'
import { lostCities } from './lost-cities'

export const cityTopics: Topic[] = [
  buildCityTopic(
    'world-cities-game',
    'Top 30 World Cities',
    'Locate great world cities on the map, name them from photos, or from a cultural clue.',
    'Thirty major world cities, played three ways: locate, photos, and cultural clue.',
    ['city-locate', 'city-photos', 'city-clue'],
    worldCities,
  ),
  buildCityTopic(
    'lost-cities-game',
    'Top 20 Lost Cities',
    'Locate the great ruined and lost cities of history, name them from their ruins, or from a cultural clue.',
    'Twenty famous lost and ancient cities, played three ways: locate, photos, and cultural clue.',
    ['city-locate', 'city-photos', 'city-clue'],
    lostCities,
  ),
]
