import type { Dynasty, QuizMode, Topic } from '../types'
import { matchesAnyName } from '../matching'

export function chainOf(dynasties: Dynasty[]): Dynasty[] {
  return dynasties.filter((dynasty) => dynasty.chain)
}

export function rulerDeck(dynasties: Dynasty[]): Dynasty[] {
  return dynasties.filter((dynasty) => dynasty.rulers)
}

export function matchesRuler(input: string, expected: string): boolean {
  // Accept the bare regnal name too: "Louis XVIII" for "Louis XVIII", "Clovis" for "Clovis Ier".
  const trimmed = expected.replace(/\s+(Ier|I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII)$/i, '')
  return matchesAnyName(input, [expected, trimmed])
}

export function buildDynastyTopic(
  id: string,
  title: string,
  description: string,
  coverage: string,
  modes: QuizMode[],
  dynasties: Dynasty[],
): Topic {
  return {
    id,
    title,
    group: 'History',
    description,
    coverage,
    modes,
    kind: 'dynasty-quiz',
    dynasties,
    items: dynasties.map((dynasty) => ({ id: dynasty.id, name: dynasty.name })),
  }
}
