import type { Topic } from '../types'
import type { Poem, PoemLanguage } from './types'

export type { Poem, PoemLanguage } from './types'

const enModules = import.meta.glob('./en/*.json', { eager: true }) as Record<string, Poem>
const frModules = import.meta.glob('./fr/*.json', { eager: true }) as Record<string, Poem>

// Curriculum order: the learning sequence the poems were ranked in.
const enOrder = [
  'stopping-by-woods-on-a-snowy-evening',
  'the-tyger',
  'if',
  'i-wandered-lonely-as-a-cloud',
  'remember',
  'sonnet-18',
  'a-psalm-of-life',
  'sonnet-116',
  'gods-grandeur',
  'crossing-the-bar',
  'sonnet-73',
  'love-iii',
]

const frOrder = [
  'demain-des-laube',
  'heureux-qui-comme-ulysse',
  'le-chene-et-le-roseau',
  'stances-a-rodrigue',
  'le-lac',
  'booz-endormi',
  'le-ciel-est-par-dessus-le-toit',
  'il-pleure-dans-mon-coeur',
  'heureux-ceux-qui-sont-morts',
  'le-temps-a-laisse-son-manteau',
  'la-nuit-de-decembre',
  'cantique-des-justes',
]

function orderPoems(modules: Record<string, Poem>, order: string[]): Poem[] {
  const bySlug = new Map(Object.values(modules).map((poem) => [poem.slug, poem]))
  const ordered = order.map((slug) => bySlug.get(slug)).filter((poem): poem is Poem => Boolean(poem))
  const missing = Object.values(modules).filter((poem) => !order.includes(poem.slug))
  return [...ordered, ...missing]
}

export const poemsByLanguage: Record<PoemLanguage, Poem[]> = {
  en: orderPoems(enModules, enOrder),
  fr: orderPoems(frModules, frOrder),
}

export const poemTopicLanguage: Record<string, PoemLanguage> = {
  'english-poetry': 'en',
  'french-poetry': 'fr',
}

export function poemsForTopic(topicId: string): Poem[] {
  const language = poemTopicLanguage[topicId]
  return language ? poemsByLanguage[language] : []
}

export const poemTopics: Topic[] = [
  {
    id: 'english-poetry',
    title: 'English Poetry',
    group: 'Literature',
    description: 'Read the poems, then reproduce them from memory and compare your version character by character.',
    modes: ['type'],
    kind: 'poems',
    items: [],
    coverage: '12 classic English poems, recalled from memory with a character-level diff.',
  },
  {
    id: 'french-poetry',
    title: 'French Poetry',
    group: 'Literature',
    description: 'Read the poems, then reproduce them from memory and compare your version character by character.',
    modes: ['type'],
    kind: 'poems',
    items: [],
    coverage: '12 classic French poems, recalled from memory with a character-level diff.',
  },
]
