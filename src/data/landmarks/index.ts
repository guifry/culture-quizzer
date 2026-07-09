import type { Topic } from '../types'
import { buildLandmarkTopic } from './types'
import { ukLandmarks } from './uk-landmarks'
import { ukGlossary } from './glossary'

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
]
