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

export function PaintingQuiz({ topic, mode }: { topic: Topic; mode: QuizMode }) {
  const allPaintings = topic.paintings ?? []
  const isExpert = mode === 'paintings-expert'
  const scorePrefix = 'paintings'

  const TIER_STORAGE_KEY = `culture-quizzer-${topic.id}-tier`
  const [tier, setTier] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('tier')
    if (fromUrl && ['10', '20', '31'].includes(fromUrl)) return parseInt(fromUrl, 10)
    try {
      const stored = localStorage.getItem(TIER_STORAGE_KEY)
      if (stored && ['10', '20', '31'].includes(stored)) return parseInt(stored, 10)
    } catch { /* ignore */ }
    return 10
  })
  const paintings = allPaintings.slice(0, tier)
  const scoreKey = `${topic.id}:${mode}:tier${tier}`

  const [order, setOrder] = useState<number[]>(() => shuffle(paintings.map((_, i) => i)))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(paintings.length === 0)
  const [review, setReview] = useState<PaintingResult | null>(null)
  const [history, setHistory] = useState<PaintingResult[]>([])
  const [input, setInput] = useState('')
  const [clueIndex, setClueIndex] = useState(() => paintings.map((p) => Math.floor(Math.random() * Math.max(1, p.clues.length))))
  const [score, setScore] = useState<PaintingScore>(() => loadScoreBook(scorePrefix)[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scorePrefix, scoreKey, score)
  }, [scoreKey, score])

  useEffect(() => {
    localStorage.setItem(TIER_STORAGE_KEY, String(tier))
    const url = new URL(window.location.href)
    url.searchParams.set('tier', String(tier))
    window.history.replaceState(null, '', url.toString())
  }, [tier, TIER_STORAGE_KEY])

  const painting = paintings[order[position]]

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
    const nameOk = isExpert ? matchesPaintingExpertAnswer(input, painting) : matchesPaintingAnswer(input, painting)
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!review) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [review, advance])

  function startNewRound() {
    setOrder(shuffle(paintings.map((_, i) => i)))
    setClueIndex(paintings.map((p) => Math.floor(Math.random() * Math.max(1, p.clues.length))))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setInput('')
  }

  if (!allPaintings.length || !painting) return null

  const scorePct = pct(score.points, score.attempts)

  const scoreStrip = (
    <section className="score-strip" aria-label="Current score">
      <Stat label="Deck" value={paintings.length} />
      <Stat label="Progress" value={`${Math.min(position + 1, paintings.length)}/${paintings.length}`} />
      <Stat label="Score" value={`${scorePct}%`} />
      <Stat label="Streak" value={score.streak} />
      <Stat label="Best" value={score.bestStreak} />
    </section>
  )

  const tierSelect = (
    <div className="painting-tier-select" role="tablist" aria-label="Deck size">
      {TIERS.map((t) => (
        <button key={t.count} type="button" className={`tier-btn ${tier === t.count ? 'active' : ''}`} onClick={() => handleTierChange(t.count)}>
          {t.label}
        </button>
      ))}
    </div>
  )

  const promptBody = mode === 'paintings-clue' ? (
    <>
      <span className="eyebrow">Name the painting from this clue</span>
      <p className="city-clue-text">{painting.clues[clueIndex[order[position]]] ?? painting.clues[0]}</p>
    </>
  ) : (
    <>
      <span className="eyebrow">{isExpert ? 'Expert — name title, painter, century, movement & nationality' : 'Identify this painting'}</span>
      <figure className="painting-image-container">
        <img
          key={`img:${position}`}
          className="painting-quiz-image"
          src={resolveImageUrl(`/images/paintings/${painting.id}.jpg`)}
          alt={review ? painting.name : 'Painting to identify'}
        />
      </figure>
    </>
  )

  const inputHint = isExpert ? 'Title · artist · century · movement · nationality' : 'Title + artist'

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

  if (completed) {
    return (
      <div className="painting-quiz">
        {scoreStrip}
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
      </div>
    )
  }

  return (
    <div className="painting-quiz">
      {scoreStrip}
      <div className="painting-board">
        {tierSelect}
        {promptBody}
        {formBody}
        {verdictBody}
        {historyBody}
      </div>
    </div>
  )
}
