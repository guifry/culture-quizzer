import type { Topic } from '../types'
import { buildLandmarkTopic } from './types'
import { ukLandmarks } from './uk-landmarks'
import { ukGlossary } from './glossary'
import { franceLandmarks } from './france-landmarks'
import { franceGlossary } from './france-glossary'

export const landmarkTopics: Topic[] = [
  buildLandmarkTopic(
    'uk-landmarks-game',
    'Top 32 UK Landmarks',
    'Locate the great cultural landmarks of the UK, name them from photos, or from a knowledge clue.',
    'Thirty-two cultural landmarks of the United Kingdom, played three ways: locate, photos, and knowledge clue.',
    ['landmark-locate', 'landmark-photos', 'landmark-clue'],
    ukLandmarks,
    ukGlossary,
  ),
  buildLandmarkTopic(
    'france-landmarks-game',
    'Top 33 France Landmarks',
    'Locate the great cultural landmarks of France, name them from photos, or from a knowledge clue.',
    'Thirty-three landmarks of France spanning prehistory, Roman Gaul, medieval cathedrals, Renaissance châteaux, modern monuments and natural wonders.',
    ['landmark-locate', 'landmark-photos', 'landmark-clue'],
    franceLandmarks,
    franceGlossary,
    'france',
  ),
]
