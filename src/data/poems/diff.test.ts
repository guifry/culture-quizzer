import { describe, expect, it } from 'vitest'
import { diffPoem } from './diff'

const reference = "Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow."

describe('diffPoem', () => {
  it('reports a perfect match as exact with 100% accuracy', () => {
    const diff = diffPoem(reference, reference)
    expect(diff.stats.exact).toBe(true)
    expect(diff.stats.accuracy).toBe(100)
    expect(diff.stats.missingLines).toBe(0)
    expect(diff.stats.extraLines).toBe(0)
    expect(diff.stats.changedLines).toBe(0)
    expect(diff.lines.every((line) => line.kind === 'same')).toBe(true)
  })

  it('detects every single-character error', () => {
    const submitted = reference.replace('know.', 'knew.')
    const diff = diffPoem(reference, submitted)
    expect(diff.stats.exact).toBe(false)
    expect(diff.stats.accuracy).toBeLessThan(100)
    const changed = diff.lines.filter((line) => line.kind === 'changed')
    expect(changed).toHaveLength(1)
  })

  it('detects punctuation and spacing differences', () => {
    const diff = diffPoem(reference, reference.replace('though;', 'though ;').replace('I think', 'I  think'))
    expect(diff.stats.exact).toBe(false)
    expect(diff.lines.filter((line) => line.kind === 'changed').length).toBeGreaterThan(0)
  })

  it('flags a missing line', () => {
    const submitted = reference.split('\n').filter((_, index) => index !== 1).join('\n')
    const diff = diffPoem(reference, submitted)
    expect(diff.stats.missingLines).toBe(1)
    expect(diff.lines.some((line) => line.kind === 'removed' && line.value === 'His house is in the village though;')).toBe(true)
  })

  it('flags an extra line', () => {
    const submitted = `${reference}\nAn added line.`
    const diff = diffPoem(reference, submitted)
    expect(diff.stats.extraLines).toBe(1)
    expect(diff.lines.some((line) => line.kind === 'added' && line.value === 'An added line.')).toBe(true)
  })

  it('treats a trailing newline in the submission as an error', () => {
    const diff = diffPoem(reference, `${reference}\n`)
    expect(diff.stats.exact).toBe(false)
    expect(diff.stats.extraLines).toBe(1)
  })

  it('scores an empty submission at 0%', () => {
    const diff = diffPoem(reference, '')
    expect(diff.stats.accuracy).toBe(0)
    expect(diff.stats.missingLines).toBe(reference.split('\n').length)
  })

  it('handles curly apostrophes, em dashes and French accents', () => {
    const french = "Demain, dès l'aube, à l'heure où blanchit la campagne,\nJe partirai. Vois-tu, je sais que tu m'attends.\nJ'irai par la forêt, j'irai par la montagne.\nJe ne puis demeurer loin de toi plus longtemps."
    const exact = diffPoem(french, french)
    expect(exact.stats.exact).toBe(true)
    const wrong = diffPoem(french, french.replace('l\'aube', 'laube').replace('dès', 'des'))
    expect(wrong.stats.exact).toBe(false)
    expect(wrong.stats.accuracy).toBeGreaterThan(90)
  })

  it('rounds accuracy to a whole number', () => {
    const submitted = `${reference.slice(0, 10)}x${reference.slice(11)}`
    const diff = diffPoem(reference, submitted)
    expect(diff.stats.accuracy).toBe(Math.round(diff.stats.accuracy))
  })

  it('scores an empty reference and empty submission as exact', () => {
    const diff = diffPoem('', '')
    expect(diff.stats.exact).toBe(true)
    expect(diff.stats.accuracy).toBe(100)
  })
})
