import { describe, expect, it } from 'vitest'
import { poemsByLanguage, poemsForTopic, poemTopics } from './index'
import type { Poem } from './types'

const requiredFields: Array<keyof Poem> = ['slug', 'language', 'title', 'author', 'yearWritten', 'yearPublished', 'sourceUrl', 'description', 'textNote', 'content']

function checkPoem(poem: Poem, language: 'en' | 'fr') {
  expect(poem.language).toBe(language)
  requiredFields.forEach((field) => {
    expect(poem[field], `${poem.slug} missing ${field}`).toBeDefined()
  })
  expect(poem.slug).toMatch(/^[a-z0-9-]+$/)
  expect(poem.title.length).toBeGreaterThan(0)
  expect(poem.author.length).toBeGreaterThan(0)
  expect(poem.content.length).toBeGreaterThan(0)
  expect(poem.sourceUrl).toMatch(/^https?:\/\//)
  expect(poem.content).not.toMatch(/[ \t]+$/m)
}

describe('poem database', () => {
  it('holds 12 English poems', () => {
    expect(poemsByLanguage.en).toHaveLength(12)
  })

  it('holds 12 French poems', () => {
    expect(poemsByLanguage.fr).toHaveLength(12)
  })

  it('has unique slugs per language', () => {
    const slugs = poemsByLanguage.en.map((poem) => poem.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const frSlugs = poemsByLanguage.fr.map((poem) => poem.slug)
    expect(new Set(frSlugs).size).toBe(frSlugs.length)
  })

  it('orders the English poems by curriculum', () => {
    expect(poemsByLanguage.en.map((poem) => poem.slug)).toEqual([
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
    ])
  })

  it('orders the French poems by curriculum', () => {
    expect(poemsByLanguage.fr.map((poem) => poem.slug)).toEqual([
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
    ])
  })

  it('validates every English poem file', () => {
    poemsByLanguage.en.forEach((poem) => checkPoem(poem, 'en'))
  })

  it('validates every French poem file', () => {
    poemsByLanguage.fr.forEach((poem) => checkPoem(poem, 'fr'))
  })

  it('registers one topic per language', () => {
    expect(poemTopics.map((topic) => topic.id)).toEqual(['english-poetry', 'french-poetry'])
    expect(poemsForTopic('english-poetry')).toHaveLength(12)
    expect(poemsForTopic('french-poetry')).toHaveLength(12)
    expect(poemsForTopic('unknown')).toEqual([])
  })

  it('keeps the canonical famous lines intact', () => {
    const bySlug = (slug: string) =>
      [...poemsByLanguage.en, ...poemsByLanguage.fr].find((poem) => poem.slug === slug) as Poem

    expect(bySlug('stopping-by-woods-on-a-snowy-evening').content.endsWith('And miles to go before I sleep,\nAnd miles to go before I sleep.')).toBe(true)
    expect(bySlug('the-tyger').content.startsWith('Tyger Tyger, burning bright,')).toBe(true)
    expect(bySlug('the-tyger').content).toContain('Could frame thy fearful symmetry?')
    expect(bySlug('if').content).toContain('If you can keep your head when all about you')
    expect(bySlug('i-wandered-lonely-as-a-cloud').content).toContain('A host, of golden daffodils;')
    expect(bySlug('sonnet-18').content).toContain("Shall I compare thee to a summer's day?")
    expect(bySlug('sonnet-116').content).toContain('Let me not to the marriage of true minds')
    expect(bySlug('sonnet-73').content).toContain('That time of year thou mayst in me behold')
    expect(bySlug('a-psalm-of-life').content).toContain('Footprints on the sands of time;')
    expect(bySlug('gods-grandeur').content).toContain('The world is charged with the grandeur of God.')
    expect(bySlug('crossing-the-bar').content).toContain('Sunset and evening star')
    expect(bySlug('love-iii').content).toContain('Guilty of dust and sin.')
    expect(bySlug('demain-des-laube').content).toContain("Demain, dès l’aube, à l’heure où blanchit la campagne,")
    expect(bySlug('heureux-qui-comme-ulysse').content).toContain('Heureux qui, comme Ulysse, a fait un beau voyage,')
    expect(bySlug('le-chene-et-le-roseau').content).toContain('Je plie, et ne romps pas.')
    expect(bySlug('stances-a-rodrigue').content).toContain('Percé jusques au fond du cœur')
    expect(bySlug('le-lac').content).toContain('Ô temps ! suspends ton vol')
    expect(bySlug('le-ciel-est-par-dessus-le-toit').content).toContain('Le ciel est, par-dessus le toit,')
    expect(bySlug('il-pleure-dans-mon-coeur').content).toContain('Il pleure dans mon cœur')
    expect(bySlug('le-temps-a-laisse-son-manteau').content).toContain('Le temps a laissé son manteau')
    expect(bySlug('la-nuit-de-decembre').content).toContain('Du temps que j\'étais écolier,')
  })
})
