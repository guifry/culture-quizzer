export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(?:le|la|les|l|the) /, '')
}

export function levenshtein(a: string, b: string): number {
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

export function editThreshold(length: number): number {
  if (length < 4) return 0
  if (length < 6) return 1
  return 2
}

export function fuzzyEquals(input: string, candidate: string): boolean {
  return input === candidate || levenshtein(input, candidate) <= editThreshold(candidate.length)
}

export function matchesAnyName(input: string, names: Array<string | undefined>): boolean {
  const clean = normalizeAnswer(input)
  if (!clean) return false
  return names
    .filter((name): name is string => Boolean(name))
    .map(normalizeAnswer)
    .some((candidate) => candidate && fuzzyEquals(clean, candidate))
}
