import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { Painting, QuizMode, Topic } from '../data/types'
import { matchesPaintingAnswer, matchesPaintingExpertAnswer } from '../data/paintings/types'
import { shuffle, resolveImageUrl } from '../utils'
import './CityQuiz.css'
import './PaintingQuiz.css'

type PaintingScore = {
  attempts: number
  points: number
  streak: number
  bestStreak: number
}

type PaintingResult = {
  id: string
  painting: Painting
  mode: string
  nameOk: boolean
  submitted: string
  points: number
}

function emptyScore(): PaintingScore {
  return { attempts: 0, points: 0, streak: 0, bestStreak: 0 }
}

function loadScoreBook(prefix: string): Record<string, PaintingScore> {
  try {
    return JSON.parse(localStorage.getItem(`culture-quizzer-${prefix}-scores`) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(prefix: string, key: string, score: PaintingScore) {
  const book = loadScoreBook(prefix)
  book[key] = score
  localStorage.setItem(`culture-quizzer-${prefix}-scores`, JSON.stringify(book))
}

function pct(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0
}

function modeLabel(mode: QuizMode) {
  return mode === 'paintings-identify' ? 'Identify' : mode === 'paintings-clue' ? 'Clue' : 'Expert'
}

function star(painting: Painting) {
  return painting.essential ? ' ★' : ''
}

const TIERS = [
  { label: 'Top 10 ★', count: 10 },
  { label: 'Top 20', count: 20 },
  { label: 'Top 31', count: 31 },
]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function PaintingQuiz({
  topic,
  mode,
  mobile = false,
  pageView,
  onPageView,
  onMode,
  onReset,
}: {
  topic: Topic
  mode: QuizMode
  mobile?: boolean
  pageView?: string
  onPageView?: (view: 'practice' | 'course') => void
  onMode?: (mode: QuizMode) => void
  onReset?: () => void
}) {
  const allPaintings = topic.paintings ?? []
  const isExpert = mode === 'paintings-expert'
  const scorePrefix = 'paintings'

  const [tier, setTier] = useState<number>(31)
  const paintings = allPaintings.slice(0, tier)
  const scoreKey = `${topic.id}:${mode}:tier${tier}`

  const [order, setOrder] = useState<number[]>(() => shuffle(paintings.map((_, i) => i)))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(paintings.length === 0)
  const [review, setReview] = useState<PaintingResult | null>(null)
  const [history, setHistory] = useState<PaintingResult[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState<PaintingScore>(() => {
    const book = loadScoreBook(scorePrefix)
    return book[scoreKey] ?? emptyScore()
  })

  useEffect(() => {
    saveScore(scorePrefix, scoreKey, score)
  }, [scoreKey, score])

  const painting = paintings[order[position]]
  const [clueIndex, setClueIndex] = useState(() => paintings.map((p) => Math.floor(Math.random() * Math.max(1, p.clues.length))))

  function handleTierChange(newTier: number) {
    const filtered = allPaintings.slice(0, newTier)
    setTier(newTier)
    setOrder(shuffle(filtered.map((_, i) => i)))
    setClueIndex(filtered.map((p) => Math.floor(Math.random() * Math.max(1, p.clues.length))))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setInput('')
  }

  const commit = useCallback((result: PaintingResult) => {
    setReview(result)
    setHistory((prev) => [result, ...prev].slice(0, 20))
    setScore((prev) => {
      const streak = result.points === 1 ? prev.streak + 1 : 0
      return {
        attempts: prev.attempts + 1,
        points: prev.points + result.points,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      }
    })
  }, [])

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (review || !painting) return

    const nameOk = isExpert
      ? matchesPaintingExpertAnswer(input, painting)
      : matchesPaintingAnswer(input, painting)

    commit({ id: `${painting.id}:${position}`, painting, mode, nameOk, submitted: input, points: nameOk ? 1 : 0 })
  }, [review, painting, input, isExpert, position, mode, commit])

  const advance = useCallback(() => {
    setReview(null)
    setInput('')
    setPosition((prev) => {
      if (prev + 1 >= order.length) {
        setCompleted(true)
        return prev
      }
      return prev + 1
    })
  }, [order.length])

  function startNewRound() {
    setOrder(shuffle(paintings.map((_, i) => i)))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setInput('')
  }

  if (!allPaintings.length || !painting) return null

  const scorePct = pct(score.points, score.attempts)

  const promptBody = mode === 'paintings-clue' ? (
    <>
      <span className="eyebrow">Name the painting from this clue</span>
      <p className="city-clue-text">{painting.clues[clueIndex[order[position]]] ?? painting.clues[0]}</p>
    </>
  ) : (
    <>
      <span className="eyebrow">{isExpert ? 'Expert mode' : 'Identify this painting'}</span>
      {review ? null : (
        <figure className="painting-image-container">
          <img
            key={`img:${position}`}
            className="painting-quiz-image"
            src={resolveImageUrl(`/images/paintings/${painting.id}.jpg`)}
            alt={painting.name}
          />
        </figure>
      )}
    </>
  )

  const inputHint = isExpert
    ? 'Title + artist + century + movement + nationality'
    : 'Title + artist'

  const formBody = (
    <form className="city-answer-form" onSubmit={handleSubmit}>
      <input
        key={`input:${position}`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputHint}
        autoComplete="off"
        readOnly={Boolean(review)}
        autoFocus
      />
      {review ? (
        <button type="button" className="primary-action" onClick={advance}>
          Next <ChevronRight size={16} />
        </button>
      ) : (
        <button type="submit" disabled={!input.trim()}>
          Check
        </button>
      )}
    </form>
  )

  const verdictBody = review ? (
    <div className="city-verdict painting-verdict">
      <p className={review.nameOk ? 'verdict-line ok' : 'verdict-line bad'}>
        <span>{review.nameOk ? <Check size={15} /> : <X size={15} />}</span>
        <span>
          {review.nameOk
            ? 'Correct!'
            : isExpert
              ? `It was: ${painting.name} · ${painting.artist} · ${painting.century} · ${painting.movement} · ${painting.nationality}`
              : `It was: ${painting.name} by ${painting.artist}`}
        </span>
      </p>
      <p className="city-fact-reveal">{painting.course.nutshell}</p>
    </div>
  ) : null

  const historyBody = history.length ? (
    <div className="city-history" aria-label="Answer history">
      {history.map((result) => (
        <article key={result.id} className={`city-history-card ${result.points === 1 ? 'pass' : 'fail'}`}>
          <strong>{result.painting.name}{star(result.painting)}</strong>
          <p>{result.nameOk ? '✓' : '✗'} — {result.painting.artist}</p>
        </article>
      ))}
    </div>
  ) : null

  const deckCompletePanel = (
    <section className="deck-complete">
      <span className="eyebrow">Deck complete</span>
      <h2>Round finished</h2>
      <div className="deck-complete-stats">
        <Stat label="Score" value={`${scorePct}%`} />
        <Stat label="Best streak" value={score.bestStreak} />
      </div>
      <button className="primary-action" type="button" onClick={startNewRound}>
        <RotateCcw size={16} />
        Start new shuffled round
      </button>
      <p className="coverage">{topic.coverage}</p>
    </section>
  )

  const tierSelect = (
    <div className="painting-tier-select">
      {TIERS.map((t) => (
        <button
          key={t.count}
          type="button"
          className={`tier-btn ${tier === t.count ? 'active' : ''}`}
          onClick={() => handleTierChange(t.count)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  if (mobile) {
    const modeSelect = (
      <label className="mmg-select">
        <span>Mode</span>
        <select value={mode} onChange={(e) => onMode?.(e.target.value as QuizMode)}>
          {topic.modes.map((m) => (
            <option key={m} value={m}>{modeLabel(m as QuizMode)}</option>
          ))}
        </select>
      </label>
    )
    const viewSelect = onPageView ? (
      <label className="mmg-select">
        <span>View</span>
        <select value={pageView === 'course' ? 'course' : 'practice'} onChange={(e) => onPageView(e.target.value as 'practice' | 'course')}>
          <option value="practice">Play</option>
          <option value="course">Course</option>
        </select>
      </label>
    ) : null
    const resetBtn = onReset ? (
      <button className="mmg-reset" type="button" onClick={onReset} aria-label="Reset scores">
        <RotateCcw size={16} />
      </button>
    ) : null

    if (completed) {
      return (
        <section className="mobile-map-game city-mmg-complete">
          <div className="mmg-toolbar">
            {viewSelect}
            {modeSelect}
            {resetBtn}
          </div>
          <div className="deck-complete">
            <span className="eyebrow">Deck complete</span>
            <h2>Round finished</h2>
            <button className="primary-action" type="button" onClick={startNewRound}>
              <RotateCcw size={16} />
              Start new shuffled round
            </button>
            <div className="deck-complete-stats">
              <Stat label="Score" value={`${scorePct}%`} />
              <Stat label="Best streak" value={score.bestStreak} />
            </div>
            <p className="coverage">{topic.coverage}</p>
          </div>
        </section>
      )
    }

    return (
      <section className="mobile-map-game city-mmg">
        <div className="mmg-toolbar">
          {tierSelect}
          {viewSelect}
          {modeSelect}
          {resetBtn}
        </div>
        <div className="mmg-prompt city-mmg-prompt">
          <div className="mmg-status">
            <span>{Math.min(position + 1, paintings.length)}/{paintings.length}</span>
            <span>{scorePct}% score</span>
            <span>🔥 {score.streak}</span>
          </div>
          {promptBody}
          {formBody}
          {verdictBody}
          {historyBody}
        </div>
      </section>
    )
  }

  if (completed) {
    return (
      <div className="city-quiz city-complete">
        <section className="score-strip" aria-label="Current score">
          <Stat label="Deck" value={paintings.length} />
          <Stat label="Progress" value={`${paintings.length}/${paintings.length}`} />
          <Stat label="Score" value={`${scorePct}%`} />
          <Stat label="Streak" value={score.streak} />
          <Stat label="Best" value={score.bestStreak} />
        </section>
        {deckCompletePanel}
      </div>
    )
  }

  return (
    <div className="city-quiz painting-stage">
      <section className="score-strip score-overlay" aria-label="Current score">
        <Stat label="Deck" value={paintings.length} />
        <Stat label="Progress" value={`${Math.min(position + 1, paintings.length)}/${paintings.length}`} />
        <Stat label="Score" value={`${scorePct}%`} />
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="quiz-overlay painting-overlay">
        <div className="city-panel painting-panel">
          {tierSelect}
          {promptBody}
          {formBody}
          {verdictBody}
          {historyBody}
        </div>
      </div>
    </div>
  )
}
