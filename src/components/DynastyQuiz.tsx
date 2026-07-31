import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronDown, ChevronRight, ChevronUp, GripVertical, RotateCcw, X } from 'lucide-react'
import type { Dynasty, QuizMode, Topic } from '../data/types'
import { chainOf, matchesRuler, rulerDeck } from '../data/dynasties/types'
import { shuffle } from '../utils'
import './CityQuiz.css'
import './DynastyQuiz.css'

type DynastyScore = {
  attempts: number
  points: number
  streak: number
  bestStreak: number
}

const SCORE_KEY = 'culture-quizzer-dynasty-scores'

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

function pct(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0
}

function spanLabel(dynasty: Dynasty) {
  const start = dynasty.startLabel ?? String(dynasty.start)
  const end = dynasty.endLabel ?? (dynasty.end === null ? "aujourd'hui" : String(dynasty.end))
  return `${start}–${end}`
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

// ——— Mode 1: order the minimal chain ———————————————————————————————————————

function ChainMode({ chain, onScored }: { chain: Dynasty[]; onScored: (correct: number, total: number) => void }) {
  const [order, setOrder] = useState<Dynasty[]>(() => shuffle(chain))
  const [checked, setChecked] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const correctAt = useMemo(
    () => order.map((dynasty, index) => dynasty.id === chain[index].id),
    [order, chain],
  )
  const correctCount = correctAt.filter(Boolean).length

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setChecked(false)
  }

  function reset() {
    setOrder(shuffle(chain))
    setChecked(false)
  }

  return (
    <div className="dynasty-chain">
      <p className="dynasty-help">
        Put the sixteen links in order, earliest at the top. Drag a card, or use the ▲▼ buttons.
      </p>

      <ol className={`chain-list${checked ? ' checked' : ''}`}>
        {order.map((dynasty, index) => (
          <li
            key={dynasty.id}
            className={`chain-item${checked ? (correctAt[index] ? ' ok' : ' bad') : ''}${dragIndex === index ? ' dragging' : ''}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => {
              event.preventDefault()
              if (dragIndex === null || dragIndex === index) return
              move(dragIndex, index)
              setDragIndex(index)
            }}
            onDragEnd={() => setDragIndex(null)}
          >
            <span className="chain-rank">{index + 1}</span>
            <GripVertical size={15} className="chain-grip" aria-hidden />
            <span className="chain-name">{dynasty.chainLabel ?? dynasty.name}</span>
            {checked ? (
              <span className="chain-verdict">
                {correctAt[index] ? <Check size={15} /> : <X size={15} />}
              </span>
            ) : null}
            <span className="chain-moves">
              <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move up">
                <ChevronUp size={14} />
              </button>
              <button type="button" onClick={() => move(index, index + 1)} disabled={index === order.length - 1} aria-label="Move down">
                <ChevronDown size={14} />
              </button>
            </span>
          </li>
        ))}
      </ol>

      <div className="dynasty-actions">
        {checked ? (
          <>
            <p className={correctCount === chain.length ? 'verdict-line ok' : 'verdict-line bad'}>
              <span>{correctCount === chain.length ? <Check size={15} /> : <X size={15} />}</span>
              <span>{correctCount}/{chain.length} in the right place.</span>
            </p>
            <button type="button" className="primary-action" onClick={reset}>
              <RotateCcw size={16} />
              Shuffle and try again
            </button>
          </>
        ) : (
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              setChecked(true)
              onScored(correctCount, chain.length)
            }}
          >
            Check the chain
          </button>
        )}
      </div>

      {checked && correctCount < chain.length ? (
        <ol className="chain-solution">
          {chain.map((dynasty) => (
            <li key={dynasty.id}>{dynasty.chainLabel ?? dynasty.name}</li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

// ——— Modes 2 & 3: per-regime typed answers ————————————————————————————————

type CardResult = { ok: boolean; detail: string }

function TypedMode({
  deck,
  mode,
  onScored,
}: {
  deck: Dynasty[]
  mode: 'dynasty-dates' | 'dynasty-rulers'
  onScored: (correct: number) => void
}) {
  const [order, setOrder] = useState<number[]>(() => shuffle(deck.map((_, index) => index)))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(deck.length === 0)
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [result, setResult] = useState<CardResult | null>(null)

  const dynasty = deck[order[position]]

  const advance = useCallback(() => {
    setResult(null)
    setFirst('')
    setSecond('')
    setPosition((prev) => {
      if (prev + 1 >= order.length) {
        setCompleted(true)
        return prev
      }
      return prev + 1
    })
  }, [order.length])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!result) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [result, advance])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (result || !dynasty) return

    let ok: boolean
    let detail: string
    if (mode === 'dynasty-dates') {
      const startOk = Number(first.trim()) === dynasty.start
      const endOk = dynasty.end === null ? /aujourd|today|now|présent|present/i.test(second.trim()) : Number(second.trim()) === dynasty.end
      ok = startOk && endOk
      detail = `${spanLabel(dynasty)}`
    } else {
      const firstOk = matchesRuler(first, dynasty.rulers!.first)
      const lastOk = matchesRuler(second, dynasty.rulers!.last)
      ok = firstOk && lastOk
      detail = `${dynasty.rulers!.first} → ${dynasty.rulers!.last}`
    }

    setResult({ ok, detail })
    onScored(ok ? 1 : 0)
  }

  function startNewRound() {
    setOrder(shuffle(deck.map((_, index) => index)))
    setPosition(0)
    setCompleted(false)
    setResult(null)
    setFirst('')
    setSecond('')
  }

  if (!deck.length || !dynasty) return null

  if (completed) {
    return (
      <div className="dynasty-complete">
        <span className="eyebrow">Deck complete</span>
        <h2>Round finished</h2>
        <button type="button" className="primary-action" onClick={startNewRound}>
          <RotateCcw size={16} />
          Start new shuffled round
        </button>
      </div>
    )
  }

  const isDates = mode === 'dynasty-dates'

  return (
    <div className="dynasty-card">
      <span className="eyebrow">{isDates ? 'Give the start and end year' : 'Name the first and last leader'}</span>
      <h2 className="dynasty-name">{dynasty.name}</h2>

      <form className="dynasty-form" onSubmit={submit}>
        <label>
          <span>{isDates ? 'Start' : 'First'}</span>
          <input
            key={`a:${position}`}
            value={first}
            onChange={(event) => setFirst(event.target.value)}
            placeholder={isDates ? 'e.g. 987' : 'e.g. Hugues Capet'}
            inputMode={isDates ? 'numeric' : 'text'}
            autoComplete="off"
            readOnly={Boolean(result)}
            autoFocus
          />
        </label>
        <label>
          <span>{isDates ? 'End' : 'Last'}</span>
          <input
            key={`b:${position}`}
            value={second}
            onChange={(event) => setSecond(event.target.value)}
            placeholder={isDates ? "e.g. 1328 (or aujourd'hui)" : 'e.g. Charles IV le Bel'}
            inputMode={isDates ? 'numeric' : 'text'}
            autoComplete="off"
            readOnly={Boolean(result)}
          />
        </label>
        {result ? (
          <button type="button" className="primary-action" onClick={advance}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button type="submit" disabled={!first.trim() || !second.trim()}>
            Check
          </button>
        )}
      </form>

      {result ? (
        <div className="city-verdict">
          <p className={result.ok ? 'verdict-line ok' : 'verdict-line bad'}>
            <span>{result.ok ? <Check size={15} /> : <X size={15} />}</span>
            <span>{result.ok ? 'Correct!' : `It was: ${result.detail}`}</span>
          </p>
          <p className="city-fact-reveal">{dynasty.note}</p>
        </div>
      ) : null}
    </div>
  )
}

// ——— Shell ————————————————————————————————————————————————————————————————

export function DynastyQuiz({ topic, mode }: { topic: Topic; mode: QuizMode }) {
  const dynasties = useMemo(() => topic.dynasties ?? [], [topic.dynasties])
  const chain = useMemo(() => chainOf(dynasties), [dynasties])
  const rulers = useMemo(() => rulerDeck(dynasties), [dynasties])
  const scoreKey = `${topic.id}:${mode}`

  // App keys this component by mode, so it remounts and re-reads the right score book entry.
  const [score, setScore] = useState<DynastyScore>(() => loadScoreBook()[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scoreKey, score)
  }, [scoreKey, score])

  const record = useCallback((correct: number, total = 1) => {
    setScore((prev) => {
      const perfect = correct === total
      const streak = perfect ? prev.streak + 1 : 0
      return {
        attempts: prev.attempts + total,
        points: prev.points + correct,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      }
    })
  }, [])

  if (!dynasties.length) return null

  const deck = mode === 'dynasty-chain' ? chain : mode === 'dynasty-rulers' ? rulers : dynasties

  return (
    <div className="dynasty-quiz">
      <section className="score-strip" aria-label="Current score">
        <Stat label="Deck" value={deck.length} />
        <Stat label="Accuracy" value={`${pct(score.points, score.attempts)}%`} />
        <Stat label="Answered" value={score.attempts} />
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="dynasty-board">
        {mode === 'dynasty-chain' ? (
          <ChainMode chain={chain} onScored={(correct, total) => record(correct, total)} />
        ) : (
          <TypedMode key={mode} deck={deck} mode={mode as 'dynasty-dates' | 'dynasty-rulers'} onScored={(correct) => record(correct, 1)} />
        )}
      </div>
    </div>
  )
}
