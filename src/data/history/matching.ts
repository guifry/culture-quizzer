import type { HistoryDate } from '../types'

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
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

// Moderately strict: exact for short tokens, at most two edits, capped ratio.
function editThreshold(length: number): number {
  if (length < 4) return 0
  return Math.min(2, Math.floor(length / 4))
}

function closeEnough(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 3) return false
  return levenshtein(a, b) <= editThreshold(Math.max(a.length, b.length))
}

function extractYears(value: string): number[] {
  const matches = value.replace(/,/g, '').match(/\d+/g)
  return matches ? matches.map(Number) : []
}

export function matchesDate(input: string, date: string): boolean {
  const nums = extractYears(input)
  if (!nums.length) return false

  const expected = extractYears(date)
  if (!expected.length) return false

  const wantBC = /bc/i.test(date)
  const inputEra = input.toLowerCase().replace(/[^a-z]/g, '')
  const inputBC = inputEra.includes('bc') // covers bc and bce
  if (inputBC !== wantBC) return false

  if (expected.some((year) => nums.includes(year))) return true

  // Ranges (e.g. 1997-1999, 563-483 BC): accept any year inside the span.
  if (expected.length >= 2) {
    const lo = Math.min(...expected)
    const hi = Math.max(...expected)
    if (nums.some((year) => year >= lo && year <= hi)) return true
  }

  return false
}

export function matchesLocation(input: string, entry: Pick<HistoryDate, 'locationAccept'>): boolean {
  const normInput = normalizeText(input)
  if (!normInput) return false
  const inputTokens = normInput.split(' ').filter(Boolean)

  return entry.locationAccept.some((raw) => {
    const place = normalizeText(raw)
    if (!place) return false
    const placeTokens = place.split(' ')

    if (placeTokens.length === 1) {
      return inputTokens.some((token) => closeEnough(token, place))
    }

    if (normInput.includes(place)) return true

    for (let i = 0; i + placeTokens.length <= inputTokens.length; i += 1) {
      const window = inputTokens.slice(i, i + placeTokens.length).join(' ')
      if (closeEnough(window, place)) return true
    }

    // Distinctive-token fallback, e.g. "salvador" for "san salvador".
    const distinctive = placeTokens.reduce((longest, token) => (token.length > longest.length ? token : longest))
    return distinctive.length >= 5 && inputTokens.some((token) => closeEnough(token, distinctive))
  })
}

export function matchesEvent(input: string, entry: Pick<HistoryDate, 'event' | 'eventAccept'>): boolean {
  const normInput = normalizeText(input)
  if (normInput.length < 2) return false

  const candidates = [entry.event, ...entry.eventAccept].map(normalizeText).filter(Boolean)

  return candidates.some((candidate) => {
    if (normInput === candidate) return true
    if (candidate.length >= 6 && (normInput.includes(candidate) || candidate.includes(normInput))) {
      const shorter = Math.min(normInput.length, candidate.length)
      if (shorter >= Math.max(4, candidate.length * 0.5)) return true
    }
    return closeEnough(normInput, candidate)
  })
}

export function eventCountByDate(dates: HistoryDate[]): Record<string, number> {
  return dates.reduce<Record<string, number>>((counts, entry) => {
    const key = normalizeText(entry.date)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

export function eventsForDate(dates: HistoryDate[], date: string): HistoryDate[] {
  const key = normalizeText(date)
  return dates.filter((entry) => normalizeText(entry.date) === key)
}
