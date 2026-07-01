import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { BookOpen, Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { HistoryDate, QuizMode, Topic } from '../data/types'
import { eventCountByDate, eventsForDate, matchesDate, matchesEvent, matchesLocation, normalizeText } from '../data/history/matching'
import { shuffle, stripTrailingPunctuation } from '../utils'
import { EventSummaryDialog } from './EventSummaryDialog'
import './HistoryDateQuiz.css'

type HistoryScore = {
  dateAttempts: number
  dateCorrect: number
  locationAttempts: number
  locationCorrect: number
  eventAttempts: number
  eventCorrect: number
  streak: number
  bestStreak: number
}

type DateResult = {
  kind: 'date'
  id: string
  entry: HistoryDate
  submittedDate: string
  submittedLocation: string
  dateOk: boolean
  locationOk: boolean
}

type EventResult = {
  kind: 'event'
  id: string
  entry: HistoryDate
  submitted: string
  ok: boolean
}

type HistoryResult = DateResult | EventResult

const SCORE_STORAGE_KEY = 'culture-quizzer-history-scores'

const emptyScore = (): HistoryScore => ({
  dateAttempts: 0,
  dateCorrect: 0,
  locationAttempts: 0,
  locationCorrect: 0,
  eventAttempts: 0,
  eventCorrect: 0,
  streak: 0,
  bestStreak: 0,
})

function loadScoreBook(): Record<string, HistoryScore> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(key: string, score: HistoryScore) {
  const book = loadScoreBook()
  book[key] = score
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(book))
}

function percent(correct: number, attempts: number) {
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

export function HistoryDateQuiz({ topic, mode }: { topic: Topic; mode: QuizMode }) {
  const dates = useMemo(() => topic.dates ?? [], [topic.dates])
  const isDateMode = mode !== 'event-recall'
  const scoreKey = `${topic.id}:${mode}`
  const counts = useMemo(() => eventCountByDate(dates), [dates])

  const [order, setOrder] = useState<number[]>(() => shuffle(dates.map((_, index) => index)))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(dates.length === 0)
  const [review, setReview] = useState<HistoryResult | null>(null)
  const [history, setHistory] = useState<HistoryResult[]>([])
  const [modalEntry, setModalEntry] = useState<HistoryDate | null>(null)
  const [score, setScore] = useState<HistoryScore>(() => loadScoreBook()[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scoreKey, score)
  }, [scoreKey, score])

  const current = dates[order[position]]

  const advance = useCallback(() => {
    setReview(null)
    setPosition((previous) => {
      if (previous + 1 >= order.length) {
        setCompleted(true)
        return previous
      }
      return previous + 1
    })
  }, [order.length])

  useEffect(() => {
    if (!review || modalEntry) return undefined
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      advance()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [review, modalEntry, advance])

  function pushHistory(result: HistoryResult) {
    setReview(result)
    setHistory((previous) => [result, ...previous].slice(0, 20))
  }

  function submitDate(submittedDate: string, submittedLocation: string) {
    if (review || !current) return
    const dateOk = matchesDate(submittedDate, current.date)
    const locationOk = matchesLocation(submittedLocation, current)
    setScore((previous) => {
      const streak = dateOk && locationOk ? previous.streak + 1 : 0
      return {
        ...previous,
        dateAttempts: previous.dateAttempts + 1,
        dateCorrect: previous.dateCorrect + (dateOk ? 1 : 0),
        locationAttempts: previous.locationAttempts + 1,
        locationCorrect: previous.locationCorrect + (locationOk ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      }
    })
    pushHistory({ kind: 'date', id: `${current.id}:${position}:${Date.now()}`, entry: current, submittedDate, submittedLocation, dateOk, locationOk })
  }

  function submitEvent(submitted: string) {
    if (review || !current) return
    const ok = eventsForDate(dates, current.date).some((entry) => matchesEvent(submitted, entry))
    setScore((previous) => {
      const streak = ok ? previous.streak + 1 : 0
      return {
        ...previous,
        eventAttempts: previous.eventAttempts + 1,
        eventCorrect: previous.eventCorrect + (ok ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      }
    })
    pushHistory({ kind: 'event', id: `${current.id}:${position}:${Date.now()}`, entry: current, submitted, ok })
  }

  function startNewRound() {
    setOrder(shuffle(dates.map((_, index) => index)))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setHistory([])
  }

  if (!dates.length) return null

  const dateAccuracy = percent(score.dateCorrect, score.dateAttempts)
  const locationAccuracy = percent(score.locationCorrect, score.locationAttempts)
  const eventAccuracy = percent(score.eventCorrect, score.eventAttempts)

  return (
    <div className="history-quiz">
      <section className="score-strip" aria-label="Current score">
        <Stat label="Deck" value={dates.length} />
        <Stat label="Progress" value={completed ? `${dates.length}/${dates.length}` : `${Math.min(position + 1, dates.length)}/${dates.length}`} />
        {isDateMode ? (
          <>
            <Stat label="Date acc" value={`${dateAccuracy}%`} />
            <Stat label="Location acc" value={`${locationAccuracy}%`} />
          </>
        ) : (
          <Stat label="Event acc" value={`${eventAccuracy}%`} />
        )}
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      {completed ? (
        <section className="deck-complete">
          <span className="eyebrow">Deck complete</span>
          <h2>Round finished</h2>
          <div className="deck-complete-stats">
            {isDateMode ? (
              <>
                <Stat label="Date accuracy" value={`${dateAccuracy}%`} />
                <Stat label="Location accuracy" value={`${locationAccuracy}%`} />
              </>
            ) : (
              <Stat label="Event accuracy" value={`${eventAccuracy}%`} />
            )}
            <Stat label="Best streak" value={score.bestStreak} />
          </div>
          <button className="primary-action" type="button" onClick={startNewRound}>
            <RotateCcw size={16} />
            Start new shuffled round
          </button>
          <p className="coverage">{topic.coverage}</p>
        </section>
      ) : isDateMode ? (
        <DateRecallCard
          key={`date:${position}`}
          entry={current}
          review={review && review.kind === 'date' ? review : null}
          onSubmit={submitDate}
          onNext={advance}
          onSkip={advance}
          onLearnMore={() => setModalEntry(current)}
        />
      ) : (
        <EventRecallCard
          key={`event:${position}`}
          entry={current}
          eventCount={counts[normalizeText(current.date)] ?? 1}
          review={review && review.kind === 'event' ? review : null}
          onSubmit={submitEvent}
          onNext={advance}
          onSkip={advance}
          onLearnMore={() => setModalEntry(current)}
        />
      )}

      {history.length ? (
        <div className="history-list" aria-label="Answer history">
          {history.map((result) => (
            <HistoryCard key={result.id} result={result} onLearnMore={() => setModalEntry(result.entry)} />
          ))}
        </div>
      ) : null}

      {modalEntry ? <EventSummaryDialog entry={modalEntry} onClose={() => setModalEntry(null)} /> : null}
    </div>
  )
}

function FieldVerdict({ ok, submitted, answer }: { ok: boolean; submitted: string; answer: string }) {
  return (
    <p className={ok ? 'field-verdict ok' : 'field-verdict bad'}>
      <span>{ok ? <Check size={15} /> : <X size={15} />}</span>
      <span>
        You wrote <b>{submitted.trim() ? stripTrailingPunctuation(submitted) : '—'}</b>. {ok ? 'Correct.' : `Answer: ${stripTrailingPunctuation(answer)}.`}
      </span>
    </p>
  )
}

function LearnMoreRow({ onLearnMore, onNext }: { onLearnMore: () => void; onNext: () => void }) {
  return (
    <div className="quiz-actions">
      <button className="learn-more" type="button" onClick={onLearnMore}>
        <BookOpen size={16} />
        Learn more
      </button>
      <button className="primary-action" type="button" onClick={onNext}>
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function DateRecallCard({
  entry,
  review,
  onSubmit,
  onNext,
  onSkip,
  onLearnMore,
}: {
  entry: HistoryDate
  review: DateResult | null
  onSubmit: (date: string, location: string) => void
  onNext: () => void
  onSkip: () => void
  onLearnMore: () => void
}) {
  const [dateInput, setDateInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review) {
      onNext()
      return
    }
    if (dateInput.trim() && locationInput.trim()) onSubmit(dateInput, locationInput)
  }

  return (
    <section className="quiz-card date-card">
      <div className="prompt-row">
        <div>
          <span className="eyebrow">Event → date &amp; location</span>
          <h2>{entry.event}</h2>
        </div>
        {review ? null : (
          <button className="icon-button" type="button" onClick={onSkip} aria-label="Skip">
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <form className="date-fields" onSubmit={handleSubmit}>
        <label className="field">
          <span>Date</span>
          <input value={dateInput} onChange={(event) => setDateInput(event.target.value)} placeholder="e.g. 1789" autoComplete="off" readOnly={Boolean(review)} autoFocus />
        </label>
        <label className="field">
          <span>Location</span>
          <input value={locationInput} onChange={(event) => setLocationInput(event.target.value)} placeholder="e.g. Paris" autoComplete="off" readOnly={Boolean(review)} />
        </label>
        {review ? null : (
          <button type="submit" disabled={!dateInput.trim() || !locationInput.trim()}>
            Check
          </button>
        )}
      </form>

      {review ? (
        <div className="verdict-block">
          <FieldVerdict ok={review.dateOk} submitted={review.submittedDate} answer={entry.date} />
          <FieldVerdict ok={review.locationOk} submitted={review.submittedLocation} answer={entry.location} />
          <LearnMoreRow onLearnMore={onLearnMore} onNext={onNext} />
          <p className="review-hint">Press Enter or Space for the next question.</p>
        </div>
      ) : null}
    </section>
  )
}

function EventRecallCard({
  entry,
  eventCount,
  review,
  onSubmit,
  onNext,
  onSkip,
  onLearnMore,
}: {
  entry: HistoryDate
  eventCount: number
  review: EventResult | null
  onSubmit: (value: string) => void
  onNext: () => void
  onSkip: () => void
  onLearnMore: () => void
}) {
  const [input, setInput] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review) {
      onNext()
      return
    }
    if (input.trim()) onSubmit(input)
  }

  return (
    <section className="quiz-card event-card">
      <div className="prompt-row">
        <div>
          <span className="eyebrow">Date → event</span>
          <h2 className="event-date">{entry.date}</h2>
          {eventCount > 1 ? <p className="event-count-hint">This date matches {eventCount} events — name any one.</p> : null}
        </div>
        {review ? null : (
          <button className="icon-button" type="button" onClick={onSkip} aria-label="Skip">
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <form className="answer-form" onSubmit={handleSubmit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Which event?" autoComplete="off" readOnly={Boolean(review)} autoFocus />
        {review ? null : (
          <button type="submit" disabled={!input.trim()}>
            Check
          </button>
        )}
      </form>

      {review ? (
        <div className="verdict-block">
          <FieldVerdict ok={review.ok} submitted={review.submitted} answer={entry.event} />
          <LearnMoreRow onLearnMore={onLearnMore} onNext={onNext} />
          <p className="review-hint">Press Enter or Space for the next question.</p>
        </div>
      ) : null}
    </section>
  )
}

function HistoryCard({ result, onLearnMore }: { result: HistoryResult; onLearnMore: () => void }) {
  const ok = result.kind === 'date' ? result.dateOk && result.locationOk : result.ok
  return (
    <article className={ok ? 'history-card history-ok' : 'history-card history-bad'}>
      <span className="history-icon">{ok ? <Check size={16} /> : <X size={16} />}</span>
      <div className="history-body">
        {result.kind === 'date' ? (
          <>
            <strong>{result.entry.event}</strong>
            <p>
              Date <b>{stripTrailingPunctuation(result.submittedDate) || '—'}</b> {result.dateOk ? '✓' : `✗ (${result.entry.date})`} · Location <b>{stripTrailingPunctuation(result.submittedLocation) || '—'}</b> {result.locationOk ? '✓' : `✗ (${result.entry.location})`}
            </p>
          </>
        ) : (
          <>
            <strong>{result.entry.date}</strong>
            <p>
              You wrote <b>{stripTrailingPunctuation(result.submitted) || '—'}</b>. {result.ok ? 'Correct.' : `Answer: ${result.entry.event}.`}
            </p>
          </>
        )}
      </div>
      <button className="history-learn" type="button" onClick={onLearnMore} aria-label="Learn more">
        <BookOpen size={15} />
      </button>
    </article>
  )
}
