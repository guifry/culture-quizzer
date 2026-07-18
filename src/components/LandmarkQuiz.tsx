import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { Landmark, QuizMode, Topic } from '../data/types'
import { evaluateLandmarkLocation, matchesLandmarkName } from '../data/landmarks/types'
import { landmarkQuizStrings, frenchRegionName, type LandmarkQuizStrings } from '../data/landmarks/quiz-strings'
import { useSettings } from '../settings'
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
  distanceKm: number | null
  insideZone: boolean
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

function regionLabel(landmark: Landmark, french = false) {
  const nation = french ? frenchRegionName(landmark.nation) : landmark.nation
  return landmark.region ? `${landmark.region}, ${nation}` : nation
}

function star(landmark: Landmark) {
  return landmark.essential ? ' ★' : ''
}

function locationVerdictText(result: LandmarkResult, landmark: Landmark, t: LandmarkQuizStrings, french: boolean): string {
  const region = regionLabel(landmark, french)
  if (result.guess === null) return t.notPlaced(region)
  const km = result.distanceKm
  if (result.locationOk) {
    if (result.insideZone) return t.correctInside
    return km !== null && km > 0 ? t.correctNear(km) : t.correctSpotOn
  }
  return t.wrongAt(region, km)
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
  const { language } = useSettings()
  const isFranceScope = topic.mapScope === 'france'
  const french = isFranceScope && language === 'fr'
  const t = landmarkQuizStrings(french ? 'fr' : 'en')

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
    const verdict = evaluateLandmarkLocation(landmark, lonLat)
    commit({
      id: `${landmark.id}:${position}`,
      landmark,
      mode,
      guess: lonLat,
      locationOk: verdict.ok,
      distanceKm: verdict.distanceKm,
      insideZone: verdict.insideZone,
      compound: false,
      nameOk: false,
      submittedName: '',
      points: verdict.ok ? 1 : 0,
    })
  }

  function submitCompound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review || !landmark) return
    const verdict = guess ? evaluateLandmarkLocation(landmark, guess) : null
    const locationOk = verdict?.ok ?? false
    const nameOk = matchesLandmarkName(nameInput, landmark)
    const points = (locationOk ? 0.5 : 0) + (nameOk ? 0.5 : 0)
    commit({
      id: `${landmark.id}:${position}`,
      landmark,
      mode,
      guess,
      locationOk,
      distanceKm: verdict ? verdict.distanceKm : null,
      insideZone: verdict?.insideZone ?? false,
      compound: true,
      nameOk,
      submittedName: nameInput,
      points,
    })
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
      <span className="eyebrow">{t.locateEyebrow}</span>
      <h2>{landmark.name}{star(landmark)}</h2>
      <p className="prompt-help">{french ? t.locateHelp : `Click where this landmark is in ${isFranceScope ? 'France' : 'the United Kingdom'}.`}</p>
    </>
  ) : mode === 'landmark-photos' ? (
    <>
      <span className="eyebrow">{review ? t.photosReveal : t.photosAsk}</span>
      <LandmarkPhotos key={`${landmark.id}:${position}`} landmark={landmark} revealed={Boolean(review)} strings={t} />
    </>
  ) : (
    <>
      <span className="eyebrow">{t.clueEyebrow}</span>
      <p className="city-clue-text">{clue}</p>
    </>
  )

  const formBody = compound ? (
    <form className="city-answer-form" onSubmit={submitCompound}>
      <input
        key={`name:${position}`}
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        placeholder={t.inputPlaceholder}
        autoComplete="off"
        readOnly={Boolean(review)}
        autoFocus
      />
      {review ? (
        <button type="button" className="primary-action" onClick={advance}>
          {t.next} <ChevronRight size={16} />
        </button>
      ) : (
        <button type="submit" disabled={!guess && !nameInput.trim()}>
          {t.check}
        </button>
      )}
    </form>
  ) : review ? (
    <button type="button" className="primary-action next-locate" onClick={advance}>
      {t.next} <ChevronRight size={16} />
    </button>
  ) : null

  const verdictBody = review ? (
    <div className="city-verdict">
      {compound ? (
        <p className={review.nameOk ? 'verdict-line ok' : 'verdict-line bad'}>
          <span>{review.nameOk ? <Check size={15} /> : <X size={15} />}</span>
          <span>{t.nameLabel} {review.nameOk ? t.nameCorrect : t.nameWas(landmark.name)}{review.submittedName.trim() ? t.youWrote(review.submittedName.trim()) : ''}.</span>
        </p>
      ) : null}
      <p className={review.locationOk ? 'verdict-line ok' : 'verdict-line bad'}>
        <span>{review.locationOk ? <Check size={15} /> : <X size={15} />}</span>
        <span>{t.locationLabel} {locationVerdictText(review, landmark, t, french)}</span>
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
              {result.compound ? `${t.historyName} ${result.nameOk ? '✓' : '✗'} · ` : ''}{t.historyLocation} {result.locationOk ? '✓' : `✗ (${regionLabel(result.landmark, french)}${result.distanceKm !== null ? `, ${t.kmOff(result.distanceKm)}` : ''})`}
            </p>
          </article>
        )
      })}
    </div>
  ) : null

  const deckCompletePanel = (
    <section className="deck-complete">
      <span className="eyebrow">{t.deckComplete}</span>
      <h2>{t.roundFinished}</h2>
      <div className="deck-complete-stats">
        <Stat label={t.score} value={`${scorePct}%`} />
        {compound ? <Stat label={t.nameAccuracy} value={`${namePct}%`} /> : null}
        <Stat label={t.locationAccuracy} value={`${locationPct}%`} />
        <Stat label={t.bestStreak} value={score.bestStreak} />
      </div>
      <button className="primary-action" type="button" onClick={startNewRound}>
        <RotateCcw size={16} />
        {t.newRound}
      </button>
      <p className="coverage">{topic.coverage}</p>
    </section>
  )

  if (mobile) {
    const modeSelect = (
      <label className="mmg-select">
        <span>{t.quizType}</span>
        <select value={mode} onChange={(event) => onMode?.(event.target.value as QuizMode)}>
          {topic.modes.map((availableMode) => (
            <option key={availableMode} value={availableMode}>
              {t.modeLabel(availableMode)}
            </option>
          ))}
        </select>
      </label>
    )
    const viewSelect = onPageView ? (
      <label className="mmg-select">
        <span>{t.view}</span>
        <select value={pageView === 'course' ? 'course' : 'practice'} onChange={(event) => onPageView(event.target.value as 'practice' | 'course')}>
          <option value="practice">{t.play}</option>
          <option value="course">{t.course}</option>
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
            <span className="eyebrow">{t.deckComplete}</span>
            <h2>{t.roundFinished}</h2>
            <button className="primary-action" type="button" onClick={startNewRound}>
              <RotateCcw size={16} />
              {t.newRound}
            </button>
            <div className="deck-complete-stats">
              <Stat label={t.score} value={`${scorePct}%`} />
              {compound ? <Stat label={t.nameAccuracy} value={`${namePct}%`} /> : null}
              <Stat label={t.locationAccuracy} value={`${locationPct}%`} />
              <Stat label={t.bestStreak} value={score.bestStreak} />
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
          <Stat label={t.deck} value={landmarks.length} />
          <Stat label={t.progress} value={`${landmarks.length}/${landmarks.length}`} />
          <Stat label={t.score} value={`${scorePct}%`} />
          {compound ? <Stat label={t.name} value={`${namePct}%`} /> : null}
          <Stat label={t.location} value={`${locationPct}%`} />
          <Stat label={t.streak} value={score.streak} />
          <Stat label={t.best} value={score.bestStreak} />
        </section>
        {deckCompletePanel}
      </div>
    )
  }

  return (
    <div className="city-quiz map-stage city-stage-map">
      <LandmarkMap landmark={landmark} guess={displayGuess} review={Boolean(review)} locationOk={displayLocationOk} interactive={!review} onPick={handlePick} mapScope={topic.mapScope} />

      <section className="score-strip score-overlay" aria-label="Current score">
        <Stat label={t.deck} value={landmarks.length} />
        <Stat label={t.progress} value={`${Math.min(position + 1, landmarks.length)}/${landmarks.length}`} />
        <Stat label={t.score} value={`${scorePct}%`} />
        {compound ? <Stat label={t.name} value={`${namePct}%`} /> : null}
        <Stat label={t.location} value={`${locationPct}%`} />
        <Stat label={t.streak} value={score.streak} />
        <Stat label={t.best} value={score.bestStreak} />
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
