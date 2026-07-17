import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { Landmark, QuizMode, Topic } from '../data/types'
import { isLandmarkLocationCorrect, matchesLandmarkName } from '../data/landmarks/types'
import { shuffle } from '../utils'
import { LandmarkMap } from './LandmarkMap'
import { LandmarkPhotos } from './LandmarkPhotos'
import './CityQuiz.css'

type LonLat = [number, number]

type LandmarkScore = {
  attempts: number
  points: number
  nameAttempts: number
  nameCorrect: number
  locationCorrect: number
  streak: number
  bestStreak: number
}

type LandmarkResult = {
  id: string
  landmark: Landmark
  mode: QuizMode
  guess: LonLat | null
  locationOk: boolean
  compound: boolean
  nameOk: boolean
  submittedName: string
  points: number
}

const SCORE_STORAGE_KEY = 'culture-quizzer-landmark-scores'

const emptyScore = (): LandmarkScore => ({ attempts: 0, points: 0, nameAttempts: 0, nameCorrect: 0, locationCorrect: 0, streak: 0, bestStreak: 0 })

function pickClues(landmarks: Landmark[]): number[] {
  return landmarks.map((landmark) => Math.floor(Math.random() * Math.max(1, landmark.clues.length)))
}

function loadScoreBook(): Record<string, LandmarkScore> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(key: string, score: LandmarkScore) {
  const book = loadScoreBook()
  book[key] = score
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(book))
}

function pct(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0
}

function regionLabel(landmark: Landmark) {
  return landmark.region ? `${landmark.region}, ${landmark.nation}` : landmark.nation
}

function star(landmark: Landmark) {
  return landmark.essential ? ' ★' : ''
}

function modeLabel(mode: QuizMode) {
  return mode === 'landmark-locate' ? 'Locate' : mode === 'landmark-photos' ? 'Photos' : 'Clue'
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function LandmarkQuiz({
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
  const landmarks = topic.landmarks ?? []
  const compound = mode !== 'landmark-locate'
  const scoreKey = `${topic.id}:${mode}`

  const [order, setOrder] = useState<number[]>(() => shuffle(landmarks.map((_, index) => index)))
  const [cluePicks, setCluePicks] = useState<number[]>(() => pickClues(landmarks))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(landmarks.length === 0)
  const [review, setReview] = useState<LandmarkResult | null>(null)
  const [history, setHistory] = useState<LandmarkResult[]>([])
  const [guess, setGuess] = useState<LonLat | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [score, setScore] = useState<LandmarkScore>(() => loadScoreBook()[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scoreKey, score)
  }, [scoreKey, score])

  const landmark = landmarks[order[position]]
  const clue = landmark ? landmark.clues[cluePicks[order[position]]] ?? landmark.clues[0] ?? '' : ''

  const commit = useCallback((result: LandmarkResult) => {
    setReview(result)
    setHistory((previous) => [result, ...previous].slice(0, 20))
    setScore((previous) => {
      const streak = result.points === 1 ? previous.streak + 1 : 0
      return {
        attempts: previous.attempts + 1,
        points: previous.points + result.points,
        nameAttempts: previous.nameAttempts + (result.compound ? 1 : 0),
        nameCorrect: previous.nameCorrect + (result.compound && result.nameOk ? 1 : 0),
        locationCorrect: previous.locationCorrect + (result.locationOk ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      }
    })
  }, [])

  function handlePick(lonLat: LonLat) {
    if (review || !landmark) return
    if (compound) {
      setGuess(lonLat)
      return
    }
    const locationOk = isLandmarkLocationCorrect(landmark, lonLat)
    commit({ id: `${landmark.id}:${position}`, landmark, mode, guess: lonLat, locationOk, compound: false, nameOk: false, submittedName: '', points: locationOk ? 1 : 0 })
  }

  function submitCompound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review || !landmark) return
    const locationOk = guess ? isLandmarkLocationCorrect(landmark, guess) : false
    const nameOk = matchesLandmarkName(nameInput, landmark)
    const points = (locationOk ? 0.5 : 0) + (nameOk ? 0.5 : 0)
    commit({ id: `${landmark.id}:${position}`, landmark, mode, guess, locationOk, compound: true, nameOk, submittedName: nameInput, points })
  }

  const advance = useCallback(() => {
    setReview(null)
    setGuess(null)
    setNameInput('')
    setPosition((previous) => {
      if (previous + 1 >= order.length) {
        setCompleted(true)
        return previous
      }
      return previous + 1
    })
  }, [order.length])

  function startNewRound() {
    setOrder(shuffle(landmarks.map((_, index) => index)))
    setCluePicks(pickClues(landmarks))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setGuess(null)
    setNameInput('')
  }

  if (!landmarks.length || !landmark) return null

  const scorePct = pct(score.points, score.attempts)
  const namePct = pct(score.nameCorrect, score.nameAttempts)
  const locationPct = pct(score.locationCorrect, score.attempts)
  const displayGuess = review ? review.guess : guess
  const displayLocationOk = review ? review.locationOk : false

  const promptBody = mode === 'landmark-locate' ? (
    <>
      <span className="eyebrow">Locate on the map</span>
      <h2>{landmark.name}{star(landmark)}</h2>
      <p className="prompt-help">{`Click where this landmark is in ${topic.mapScope === 'france' ? 'France' : 'the United Kingdom'}.`}</p>
    </>
  ) : mode === 'landmark-photos' ? (
    <>
      <span className="eyebrow">{review ? 'What you were looking at' : 'Name the landmark from its photos'}</span>
      <LandmarkPhotos key={`${landmark.id}:${position}`} landmark={landmark} revealed={Boolean(review)} />
    </>
  ) : (
    <>
      <span className="eyebrow">Name the landmark from this clue</span>
      <p className="city-clue-text">{clue}</p>
    </>
  )

  const formBody = compound ? (
    <form className="city-answer-form" onSubmit={submitCompound}>
      <input
        key={`name:${position}`}
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        placeholder="Type the landmark name"
        autoComplete="off"
        readOnly={Boolean(review)}
        autoFocus
      />
      {review ? (
        <button type="button" className="primary-action" onClick={advance}>
          Next <ChevronRight size={16} />
        </button>
      ) : (
        <button type="submit" disabled={!guess && !nameInput.trim()}>
          Check
        </button>
      )}
    </form>
  ) : review ? (
    <button type="button" className="primary-action next-locate" onClick={advance}>
      Next <ChevronRight size={16} />
    </button>
  ) : null

  const verdictBody = review ? (
    <div className="city-verdict">
      {compound ? (
        <p className={review.nameOk ? 'verdict-line ok' : 'verdict-line bad'}>
          <span>{review.nameOk ? <Check size={15} /> : <X size={15} />}</span>
          <span>Name: {review.nameOk ? 'correct' : `it was ${landmark.name}`}{review.submittedName.trim() ? ` (you wrote "${review.submittedName.trim()}")` : ''}.</span>
        </p>
      ) : null}
      <p className={review.locationOk ? 'verdict-line ok' : 'verdict-line bad'}>
        <span>{review.locationOk ? <Check size={15} /> : <X size={15} />}</span>
        <span>Location: {review.locationOk ? 'correct' : `it is in ${regionLabel(landmark)}`}.</span>
      </p>
      <p className="city-fact-reveal">{landmark.course.nutshell}</p>
    </div>
  ) : null

  const historyBody = history.length ? (
    <div className="city-history" aria-label="Answer history">
      {history.map((result) => {
        const tone = result.points === 1 ? 'pass' : result.points === 0 ? 'fail' : 'mid'
        return (
          <article key={result.id} className={`city-history-card ${tone}`}>
            <strong>{result.landmark.name}{star(result.landmark)}</strong>
            <p>
              {result.compound ? `Name ${result.nameOk ? '✓' : '✗'} · ` : ''}Location {result.locationOk ? '✓' : `✗ (${regionLabel(result.landmark)})`}
            </p>
          </article>
        )
      })}
    </div>
  ) : null

  const deckCompletePanel = (
    <section className="deck-complete">
      <span className="eyebrow">Deck complete</span>
      <h2>Round finished</h2>
      <div className="deck-complete-stats">
        <Stat label="Score" value={`${scorePct}%`} />
        {compound ? <Stat label="Name accuracy" value={`${namePct}%`} /> : null}
        <Stat label="Location accuracy" value={`${locationPct}%`} />
        <Stat label="Best streak" value={score.bestStreak} />
      </div>
      <button className="primary-action" type="button" onClick={startNewRound}>
        <RotateCcw size={16} />
        Start new shuffled round
      </button>
      <p className="coverage">{topic.coverage}</p>
    </section>
  )

  if (mobile) {
    const modeSelect = (
      <label className="mmg-select">
        <span>Quiz type</span>
        <select value={mode} onChange={(event) => onMode?.(event.target.value as QuizMode)}>
          {topic.modes.map((availableMode) => (
            <option key={availableMode} value={availableMode}>
              {modeLabel(availableMode)}
            </option>
          ))}
        </select>
      </label>
    )
    const viewSelect = onPageView ? (
      <label className="mmg-select">
        <span>View</span>
        <select value={pageView === 'course' ? 'course' : 'practice'} onChange={(event) => onPageView(event.target.value as 'practice' | 'course')}>
          <option value="practice">Play</option>
          <option value="course">Course</option>
        </select>
      </label>
    ) : null
    const resetButton = onReset ? (
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
            {resetButton}
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
              {compound ? <Stat label="Name accuracy" value={`${namePct}%`} /> : null}
              <Stat label="Location accuracy" value={`${locationPct}%`} />
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
          {viewSelect}
          {modeSelect}
          {resetButton}
        </div>
        <div className="mmg-prompt city-mmg-prompt">
          <div className="mmg-status">
            <span>{Math.min(position + 1, landmarks.length)}/{landmarks.length}</span>
            <span>{scorePct}% score</span>
            <span>🔥 {score.streak}</span>
          </div>
          {promptBody}
          {formBody}
          {verdictBody}
          {historyBody}
        </div>
        <div className="mmg-map city-mmg-map">
          <LandmarkMap landmark={landmark} guess={displayGuess} review={Boolean(review)} locationOk={displayLocationOk} interactive={!review} onPick={handlePick} mapScope={topic.mapScope} />
        </div>
      </section>
    )
  }

  if (completed) {
    return (
      <div className="city-quiz city-complete">
        <section className="score-strip" aria-label="Current score">
          <Stat label="Deck" value={landmarks.length} />
          <Stat label="Progress" value={`${landmarks.length}/${landmarks.length}`} />
          <Stat label="Score" value={`${scorePct}%`} />
          {compound ? <Stat label="Name" value={`${namePct}%`} /> : null}
          <Stat label="Location" value={`${locationPct}%`} />
          <Stat label="Streak" value={score.streak} />
          <Stat label="Best" value={score.bestStreak} />
        </section>
        {deckCompletePanel}
      </div>
    )
  }

  return (
    <div className="city-quiz map-stage city-stage-map">
      <LandmarkMap landmark={landmark} guess={displayGuess} review={Boolean(review)} locationOk={displayLocationOk} interactive={!review} onPick={handlePick} mapScope={topic.mapScope} />

      <section className="score-strip score-overlay" aria-label="Current score">
        <Stat label="Deck" value={landmarks.length} />
        <Stat label="Progress" value={`${Math.min(position + 1, landmarks.length)}/${landmarks.length}`} />
        <Stat label="Score" value={`${scorePct}%`} />
        {compound ? <Stat label="Name" value={`${namePct}%`} /> : null}
        <Stat label="Location" value={`${locationPct}%`} />
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="quiz-overlay city-overlay">
        <div className="city-panel">
          {promptBody}
          {formBody}
          {verdictBody}
          {historyBody}
        </div>
      </div>
    </div>
  )
}
