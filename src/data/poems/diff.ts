import { diffArrays, diffChars } from 'diff'

export type CharSegment = {
  value: string
  removed?: boolean
  added?: boolean
}

export type DiffLine =
  | { kind: 'same'; value: string }
  | { kind: 'removed'; value: string }
  | { kind: 'added'; value: string }
  | { kind: 'changed'; expected: string; submitted: string; segments: CharSegment[] }

export type PoemDiffStats = {
  accuracy: number
  matchedChars: number
  referenceChars: number
  missingLines: number
  extraLines: number
  changedLines: number
  exact: boolean
}

export type PoemDiff = {
  lines: DiffLine[]
  stats: PoemDiffStats
}

function charSegments(expected: string, submitted: string): CharSegment[] {
  const changes = diffChars(expected, submitted)
  return changes.map((change) => ({
    value: change.value,
    removed: Boolean(change.removed),
    added: Boolean(change.added),
  }))
}

export function diffPoem(reference: string, submitted: string): PoemDiff {
  const refLines = reference.split('\n')
  // An empty submission has no lines at all — pairing its lone blank line with the first
  // reference line would misreport a deleted poem as a "changed" line.
  const subLines = submitted === '' ? [] : submitted.split('\n')
  const changes = diffArrays(refLines, subLines)

  const lines: DiffLine[] = []
  let removed: string[] = []
  let added: string[] = []

  function flush() {
    const paired = Math.min(removed.length, added.length)
    for (let index = 0; index < paired; index += 1) {
      const expected = removed[index]
      const actual = added[index]
      lines.push({ kind: 'changed', expected, submitted: actual, segments: charSegments(expected, actual) })
    }
    for (let index = paired; index < removed.length; index += 1) {
      lines.push({ kind: 'removed', value: removed[index] })
    }
    for (let index = paired; index < added.length; index += 1) {
      lines.push({ kind: 'added', value: added[index] })
    }
    removed = []
    added = []
  }

  for (const change of changes) {
    if (change.removed) {
      removed.push(...change.value)
    } else if (change.added) {
      added.push(...change.value)
    } else {
      flush()
      change.value.forEach((value) => lines.push({ kind: 'same', value }))
    }
  }
  flush()

  let matchedChars = 0
  let referenceChars = 0
  let missingLines = 0
  let extraLines = 0
  let changedLines = 0

  for (const line of lines) {
    if (line.kind === 'same') {
      matchedChars += line.value.length
      referenceChars += line.value.length
    } else if (line.kind === 'removed') {
      referenceChars += line.value.length
      missingLines += 1
    } else if (line.kind === 'added') {
      extraLines += 1
    } else {
      referenceChars += line.expected.length
      changedLines += 1
      line.segments.forEach((segment) => {
        if (!segment.removed && !segment.added) matchedChars += segment.value.length
      })
    }
  }

  const accuracy = referenceChars === 0 ? 100 : Math.round((matchedChars / referenceChars) * 100)

  return {
    lines,
    stats: {
      accuracy,
      matchedChars,
      referenceChars,
      missingLines,
      extraLines,
      changedLines,
      exact: reference === submitted,
    },
  }
}
