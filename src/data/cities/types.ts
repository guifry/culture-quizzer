import type { CityEntry, QuizMode, Topic } from '../types'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1]
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1
      current.push(Math.min(current[j] + 1, previous[j + 1] + 1, previous[j] + cost))
    }
    previous = current
  }
  return previous[b.length]
}

function threshold(length: number): number {
  if (length < 4) return 0
  if (length < 6) return 1
  return 2
}

export function matchesCityName(input: string, city: CityEntry): boolean {
  const clean = normalize(input)
  if (!clean) return false
  const candidates = [city.name, ...(city.aliases ?? [])].map(normalize)
  return candidates.some((candidate) => clean === candidate || levenshtein(clean, candidate) <= threshold(candidate.length))
}

export function buildCityTopic(
  id: string,
  title: string,
  description: string,
  coverage: string,
  modes: QuizMode[],
  cities: CityEntry[],
): Topic {
  return {
    id,
    title,
    group: 'Geography',
    description,
    coverage,
    modes,
    kind: 'city-quiz',
    cities,
    items: cities.map((city) => ({ id: city.id, name: city.name, lat: city.lat, lon: city.lon })),
  }
}
