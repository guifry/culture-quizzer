import type { CityEntry, QuizMode, Topic } from '../types'
import { matchesAnyName } from '../matching'

export function matchesCityName(input: string, city: CityEntry): boolean {
  return matchesAnyName(input, [city.name, ...(city.aliases ?? [])])
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
