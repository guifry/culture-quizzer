import type { Dynasty, QuizMode, Topic } from '../types'
import { normalizeAnswer } from '../matching'

export function chainOf(dynasties: Dynasty[]): Dynasty[] {
  return dynasties.filter((dynasty) => dynasty.chain)
}

// Names and rulers are matched EXACTLY (after normalising accents, case and punctuation).
// Fuzzy matching is unsafe here: an edit distance of 2 makes "Louis XVI" pass for
// "Louis XVIII", and "IIe République" pass for "IIIe République".
function exactMatch(input: string, candidates: Array<string | undefined>): boolean {
  const clean = normalizeAnswer(input)
  if (!clean) return false
  return candidates
    .filter((candidate): candidate is string => Boolean(candidate))
    .map(normalizeAnswer)
    .some((candidate) => candidate === clean)
}

export function matchesDynastyName(input: string, dynasty: Dynasty): boolean {
  return exactMatch(input, [dynasty.name, dynasty.chainLabel, ...(dynasty.nameAliases ?? [])])
}

export function matchesRuler(input: string, expected: string, dynasty: Dynasty): boolean {
  return exactMatch(input, [expected, ...(dynasty.rulerAliases?.[expected] ?? [])])
}

const OPEN_ENDED = /^(aujourd'?hui|today|now|present|présent|en cours|—|-)$/i

export function matchesStartYear(input: string, dynasty: Dynasty): boolean {
  const accepted = dynasty.acceptStart ?? [dynasty.start]
  const value = Number(input.trim())
  return Number.isFinite(value) && input.trim() !== '' && accepted.includes(value)
}

export function matchesEndYear(input: string, dynasty: Dynasty): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false
  if (dynasty.end === null) return OPEN_ENDED.test(trimmed)
  const accepted = dynasty.acceptEnd ?? [dynasty.end]
  const value = Number(trimmed)
  return Number.isFinite(value) && accepted.includes(value)
}

export function spanLabel(dynasty: Dynasty): string {
  const start = dynasty.startLabel ?? String(dynasty.start)
  const end = dynasty.endLabel ?? (dynasty.end === null ? "aujourd'hui" : String(dynasty.end))
  return `${start}–${end}`
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
