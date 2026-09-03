export type PoemLanguage = 'en' | 'fr'

export type Poem = {
  slug: string
  language: PoemLanguage
  title: string
  author: string
  yearWritten: number | null
  yearPublished: number | null
  sourceUrl: string
  description: string
  textNote: string | null
  content: string
}
