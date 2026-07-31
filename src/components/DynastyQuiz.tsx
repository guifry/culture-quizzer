import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, GripVertical, RotateCcw, X } from 'lucide-react'
import type { Dynasty, Topic } from '../data/types'
import { chainOf, matchesDynastyName, matchesEndYear, matchesRuler, matchesStartYear, spanLabel } from '../data/dynasties/types'
import { shuffle } from '../utils'
import './CityQuiz.css'
import './DynastyQuiz.css'

type Fields = { name: boolean; dates: boolean; leaders: boolean }
type Entry = { name: string; start: string; end: string; first: string; last: string }
type RowMark = { position?: boolean; name?: boolean; dates?: boolean; leaders?: boolean }

type DynastyScore = {
  attempts: number
  points: number
  streak: number
  bestStreak: number
}

const SCORE_KEY = 'culture-quizzer-dynasty-scores'
const FIELDS_KEY = 'culture-quizzer-dynasty-fields'

const emptyEntry = (): Entry => ({ name: '', start: '', end: '', first: '', last: '' })

function emptyScore(): DynastyScore {
  return { attempts: 0, points: 0, streak: 0, bestStreak: 0 }
}

function loadScoreBook(): Record<string, DynastyScore> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(key: string, score: DynastyScore) {
  const book = loadScoreBook()
  book[key] = score
  localStorage.setItem(SCORE_KEY, JSON.stringify(book))
}

function parseFields(raw: string | null): Fields | null {
  if (raw === null) return null
  const parts = raw.split(',').filter(Boolean)
  return { name: parts.includes('name'), dates: parts.includes('dates'), leaders: parts.includes('leaders') }
}

function serialiseFields(fields: Fields): string {
  return [fields.name && 'name', fields.dates && 'dates', fields.leaders && 'leaders'].filter(Boolean).join(',')
}

function loadFields(): Fields {
  const fromUrl = parseFields(new URLSearchParams(window.location.search).get('fields'))
  if (fromUrl) return fromUrl
  try {
    const stored = parseFields(localStorage.getItem(FIELDS_KEY))
    if (stored) return stored
  } catch {
    /* ignore */
  }
  return { name: false, dates: false, leaders: false }
}

function pct(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function DynastyQuiz({ topic }: { topic: Topic }) {
  const dynasties = useMemo(() => topic.dynasties ?? [], [topic.dynasties])
  const chain = useMemo(() => chainOf(dynasties), [dynasties])

  const [fields, setFields] = useState<Fields>(loadFields)
  // In name mode the slots are fixed in chronological order and there is no dragging;
  // otherwise the cards start shuffled and the player reorders them.
  const [order, setOrder] = useState<Dynasty[]>(() => (loadFields().name ? chainOf(topic.dynasties ?? []) : shuffle(chainOf(topic.dynasties ?? []))))
  // Keyed by dynasty id, never by row index, so typed values follow a card when it is moved.
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [checked, setChecked] = useState(false)
  const [dragArmed, setDragArmed] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const scoreKey = `${topic.id}:${serialiseFields(fields) || 'order'}`
  const [score, setScore] = useState<DynastyScore>(() => loadScoreBook()[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scoreKey, score)
  }, [scoreKey, score])

  useEffect(() => {
    localStorage.setItem(FIELDS_KEY, serialiseFields(fields))
    const url = new URL(window.location.href)
    url.searchParams.set('fields', serialiseFields(fields))
    window.history.replaceState(null, '', url.toString())
  }, [fields])

  const rows = fields.name ? chain : order
  const leaderRows = useMemo(() => chain.filter((dynasty) => dynasty.rulers).length, [chain])

  const entryOf = useCallback((id: string) => entries[id] ?? emptyEntry(), [entries])

  const setEntry = useCallback((id: string, patch: Partial<Entry>) => {
    setEntries((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyEntry()), ...patch } }))
  }, [])

  const marks: RowMark[] = useMemo(() => {
    if (!checked) return rows.map(() => ({}))
    return rows.map((dynasty, index) => {
      const entry = entries[dynasty.id] ?? emptyEntry()
      const mark: RowMark = {}
      if (!fields.name) mark.position = dynasty.id === chain[index].id
      if (fields.name) mark.name = matchesDynastyName(entry.name, dynasty)
      if (fields.dates) mark.dates = matchesStartYear(entry.start, dynasty) && matchesEndYear(entry.end, dynasty)
      if (fields.leaders && dynasty.rulers) {
        mark.leaders = matchesRuler(entry.first, dynasty.rulers.first, dynasty) && matchesRuler(entry.last, dynasty.rulers.last, dynasty)
      }
      return mark
    })
  }, [checked, rows, entries, fields, chain])

  const tally = useMemo(() => {
    const count = (key: keyof RowMark) => marks.filter((mark) => mark[key] === true).length
    return {
      position: { correct: count('position'), total: fields.name ? 0 : chain.length },
      name: { correct: count('name'), total: fields.name ? chain.length : 0 },
      dates: { correct: count('dates'), total: fields.dates ? chain.length : 0 },
      leaders: { correct: count('leaders'), total: fields.leaders ? leaderRows : 0 },
    }
  }, [marks, fields, chain.length, leaderRows])

  const totalUnits = tally.position.total + tally.name.total + tally.dates.total + tally.leaders.total
  const correctUnits = tally.position.correct + tally.name.correct + tally.dates.correct + tally.leaders.correct

  function resetBoard(next: Fields) {
    setChecked(false)
    setEntries({})
    setOrder(next.name ? chain : shuffle(chain))
  }

  function toggleField(key: keyof Fields) {
    const next = { ...fields, [key]: !fields[key] }
    setFields(next)
    resetBoard(next)
  }

  function move(from: number, to: number) {
    if (fields.name || checked) return
    if (to < 0 || to >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function submit() {
    setChecked(true)
    setScore((prev) => {
      const perfect = totalUnits > 0 && correctUnits === totalUnits
      const streak = perfect ? prev.streak + 1 : 0
      return {
        attempts: prev.attempts + totalUnits,
        points: prev.points + correctUnits,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      }
    })
  }

  if (!chain.length) return null

  const dragEnabled = !fields.name && !checked

  function revealFor(dynasty: Dynasty, mark: RowMark, index: number) {
    if (!checked) return null
    const bits: string[] = []
    if (mark.position === false) bits.push(`Position ${chain.findIndex((d) => d.id === dynasty.id) + 1}`)
    if (mark.name === false) bits.push(dynasty.chainLabel ?? dynasty.name)
    if (mark.dates === false) bits.push(spanLabel(dynasty))
    if (mark.leaders === false && dynasty.rulers) bits.push(`${dynasty.rulers.first} → ${dynasty.rulers.last}`)
    if (!bits.length) return null
    return (
      <p className="chain-reveal" key={`reveal:${index}`}>
        {bits.join(' · ')}
      </p>
    )
  }

  return (
    <div className="dynasty-quiz">
      <section className="score-strip" aria-label="Current score">
        <Stat label="Links" value={chain.length} />
        <Stat label="Accuracy" value={`${pct(score.points, score.attempts)}%`} />
        <Stat label="Answered" value={score.attempts} />
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="dynasty-board">
        <div className="dynasty-toggles" role="group" aria-label="What to fill in">
          <span className="toggles-label">Also recall</span>
          {(['name', 'dates', 'leaders'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`toggle-btn${fields[key] ? ' active' : ''}`}
              aria-pressed={fields[key]}
              onClick={() => toggleField(key)}
            >
              {key === 'name' ? 'Names' : key === 'dates' ? 'Dates' : 'Leaders'}
            </button>
          ))}
        </div>

        <p className="dynasty-help">
          {fields.name
            ? 'The sixteen slots are already in order — write the name of each regime.'
            : 'Put the sixteen links in order, earliest at the top. Drag by the handle, or use ▲▼.'}
          {fields.dates || fields.leaders ? ' Fill every field, then check.' : ''}
        </p>

        <ol className={`chain-list${checked ? ' checked' : ''}`}>
          {rows.map((dynasty, index) => {
            const mark = marks[index] ?? {}
            const entry = entryOf(dynasty.id)
            const rowWrong = Object.values(mark).some((value) => value === false)
            const rowState = checked ? (rowWrong ? ' bad' : ' ok') : ''
            return (
              <li
                key={dynasty.id}
                className={`chain-item${rowState}${dragIndex === index ? ' dragging' : ''}`}
                draggable={dragEnabled && dragArmed}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (dragIndex === null || dragIndex === index) return
                  move(dragIndex, index)
                  setDragIndex(index)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragArmed(false)
                }}
              >
                <div className="chain-head">
                  <span className="chain-rank">{index + 1}</span>
                  {dragEnabled ? (
                    <span
                      className="chain-grip"
                      onPointerDown={() => setDragArmed(true)}
                      onPointerUp={() => setDragArmed(false)}
                      aria-hidden
                    >
                      <GripVertical size={15} />
                    </span>
                  ) : null}

                  {fields.name ? (
                    <input
                      className="chain-name-input"
                      value={entry.name}
                      onChange={(event) => setEntry(dynasty.id, { name: event.target.value })}
                      placeholder={`Regime ${index + 1}`}
                      aria-label={`Name of regime ${index + 1}`}
                      autoComplete="off"
                      readOnly={checked}
                    />
                  ) : (
                    <span className="chain-name">{dynasty.chainLabel ?? dynasty.name}</span>
                  )}

                  {checked ? (
                    <span className="chain-verdict">{rowWrong ? <X size={15} /> : <Check size={15} />}</span>
                  ) : null}

                  {!fields.name ? (
                    <span className="chain-moves">
                      <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0 || checked} aria-label="Move up">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" onClick={() => move(index, index + 1)} disabled={index === rows.length - 1 || checked} aria-label="Move down">
                        <ChevronDown size={14} />
                      </button>
                    </span>
                  ) : null}
                </div>

                {fields.dates || fields.leaders ? (
                  <div className="chain-fields">
                    {fields.dates ? (
                      <>
                        <input
                          className={`chain-field${checked ? (mark.dates ? ' ok' : ' bad') : ''}`}
                          value={entry.start}
                          onChange={(event) => setEntry(dynasty.id, { start: event.target.value })}
                          placeholder="Start"
                          aria-label={`Start year, row ${index + 1}`}
                          inputMode="numeric"
                          autoComplete="off"
                          readOnly={checked}
                        />
                        <input
                          className={`chain-field${checked ? (mark.dates ? ' ok' : ' bad') : ''}`}
                          value={entry.end}
                          onChange={(event) => setEntry(dynasty.id, { end: event.target.value })}
                          placeholder="End"
                          aria-label={`End year, row ${index + 1}`}
                          autoComplete="off"
                          readOnly={checked}
                        />
                      </>
                    ) : null}

                    {fields.leaders ? (
                      dynasty.rulers ? (
                        <>
                          <input
                            className={`chain-field wide${checked ? (mark.leaders ? ' ok' : ' bad') : ''}`}
                            value={entry.first}
                            onChange={(event) => setEntry(dynasty.id, { first: event.target.value })}
                            placeholder="First leader"
                            aria-label={`First leader, row ${index + 1}`}
                            autoComplete="off"
                            readOnly={checked}
                          />
                          <input
                            className={`chain-field wide${checked ? (mark.leaders ? ' ok' : ' bad') : ''}`}
                            value={entry.last}
                            onChange={(event) => setEntry(dynasty.id, { last: event.target.value })}
                            placeholder="Last leader"
                            aria-label={`Last leader, row ${index + 1}`}
                            autoComplete="off"
                            readOnly={checked}
                          />
                        </>
                      ) : (
                        <span className="chain-no-ruler">No single head of state — not graded</span>
                      )
                    ) : null}
                  </div>
                ) : null}

                {revealFor(dynasty, mark, index)}
              </li>
            )
          })}
        </ol>

        <div className="dynasty-actions">
          {checked ? (
            <>
              <p className={correctUnits === totalUnits ? 'verdict-line ok' : 'verdict-line bad'}>
                <span>{correctUnits === totalUnits ? <Check size={15} /> : <X size={15} />}</span>
                <span>
                  {[
                    tally.position.total ? `Order ${tally.position.correct}/${tally.position.total}` : null,
                    tally.name.total ? `Names ${tally.name.correct}/${tally.name.total}` : null,
                    tally.dates.total ? `Dates ${tally.dates.correct}/${tally.dates.total}` : null,
                    tally.leaders.total ? `Leaders ${tally.leaders.correct}/${tally.leaders.total}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </p>
              <button type="button" className="primary-action" onClick={() => resetBoard(fields)}>
                <RotateCcw size={16} />
                {fields.name ? 'Clear and try again' : 'Shuffle and try again'}
              </button>
            </>
          ) : (
            <button type="button" className="primary-action" onClick={submit}>
              Check
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
