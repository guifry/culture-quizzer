import type { Topic } from '../types'
import { buildPaintingsTopic } from './types'
import { famousPaintings } from './paintings'
import { paintingsGlossary } from './glossary'

export const paintingTopics: Topic[] = [
  buildPaintingsTopic(
    'famous-paintings',
    'Famous Paintings',
    'See the painting; name the work and the artist. Clue mode tests from text. Expert mode requires title, painter, century, movement and nationality.',
    'Thirty-one of the world\'s most recognised paintings, played three ways: identify, clue, and expert.',
    ['paintings-identify', 'paintings-clue', 'paintings-expert'],
    famousPaintings,
    paintingsGlossary,
  ),
]
