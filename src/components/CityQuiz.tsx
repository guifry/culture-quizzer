import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import type { CityEntry, QuizMode, Topic } from '../data/types'
import { matchesCityName } from '../data/cities/types'
import { isRegionCorrect } from '../map/containment'
import { shuffle } from '../utils'
import { CityMap } from './CityMap'
import { PhotoMosaic } from './PhotoMosaic'
import './CityQuiz.css'

type LonLat = [number, number]

type CityScore = {
  attempts: number
  points: number
  nameAttempts: number
  nameCorrect: number
  locationCorrect: number
  streak: number
  bestStreak: number
}

type CityResult = {
  id: string
  city: CityEntry
  mode: QuizMode
  guess: LonLat | null
  locationOk: boolean
  compound: boolean
  nameOk: boolean
  submittedName: string
  points: number
}

const SCORE_STORAGE_KEY = 'culture-quizzer-city-scores'

const emptyScore = (): CityScore => ({ attempts: 0, points: 0, nameAttempts: 0, nameCorrect: 0, locationCorrect: 0, streak: 0, bestStreak: 0 })

function loadScoreBook(): Record<string, CityScore> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveScore(key: string, score: CityScore) {
  const book = loadScoreBook()
  book[key] = score
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(book))
}

function pct(correct: number, attempts: number) {
  return attempts ? Math.round((correct / attempts) * 100) : 0
}

function regionLabel(city: CityEntry) {
  return city.usState ? `${city.usState}, ${city.country}` : city.country
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function CityQuiz({ topic, mode }: { topic: Topic; mode: QuizMode }) {
  const cities = topic.cities ?? []
  const compound = mode !== 'city-locate'
  const scoreKey = `${topic.id}:${mode}`

  const [order, setOrder] = useState<number[]>(() => shuffle(cities.map((_, index) => index)))
  const [position, setPosition] = useState(0)
  const [completed, setCompleted] = useState(cities.length === 0)
  const [review, setReview] = useState<CityResult | null>(null)
  const [history, setHistory] = useState<CityResult[]>([])
  const [guess, setGuess] = useState<LonLat | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [score, setScore] = useState<CityScore>(() => loadScoreBook()[scoreKey] ?? emptyScore())

  useEffect(() => {
    saveScore(scoreKey, score)
  }, [scoreKey, score])

  const city = cities[order[position]]

  const commit = useCallback((result: CityResult) => {
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
    if (review || !city) return
    if (compound) {
      setGuess(lonLat)
      return
    }
    const locationOk = isRegionCorrect(city, lonLat)
    commit({ id: `${city.id}:${position}`, city, mode, guess: lonLat, locationOk, compound: false, nameOk: false, submittedName: '', points: locationOk ? 1 : 0 })
  }

  function submitCompound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review || !city) return
    const locationOk = guess ? isRegionCorrect(city, guess) : false
    const nameOk = matchesCityName(nameInput, city)
    const points = (locationOk ? 0.5 : 0) + (nameOk ? 0.5 : 0)
    commit({ id: `${city.id}:${position}`, city, mode, guess, locationOk, compound: true, nameOk, submittedName: nameInput, points })
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
    setOrder(shuffle(cities.map((_, index) => index)))
    setPosition(0)
    setCompleted(false)
    setReview(null)
    setGuess(null)
    setNameInput('')
  }

  if (!cities.length || !city) return null

  const scorePct = pct(score.points, score.attempts)
  const namePct = pct(score.nameCorrect, score.nameAttempts)
  const locationPct = pct(score.locationCorrect, score.attempts)
  const displayGuess = review ? review.guess : guess
  const displayLocationOk = review ? review.locationOk : false

  if (completed) {
    return (
      <div className="city-quiz city-complete">
        <section className="score-strip" aria-label="Current score">
          <Stat label="Deck" value={cities.length} />
          <Stat label="Progress" value={`${cities.length}/${cities.length}`} />
          <Stat label="Score" value={`${scorePct}%`} />
          {compound ? <Stat label="Name" value={`${namePct}%`} /> : null}
          <Stat label="Location" value={`${locationPct}%`} />
          <Stat label="Streak" value={score.streak} />
          <Stat label="Best" value={score.bestStreak} />
        </section>
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
      </div>
    )
  }

  return (
    <div className="city-quiz map-stage city-stage-map">
      <CityMap city={city} guess={displayGuess} review={Boolean(review)} locationOk={displayLocationOk} interactive={!review} onPick={handlePick} />

      <section className="score-strip score-overlay" aria-label="Current score">
        <Stat label="Deck" value={cities.length} />
        <Stat label="Progress" value={`${Math.min(position + 1, cities.length)}/${cities.length}`} />
        <Stat label="Score" value={`${scorePct}%`} />
        {compound ? <Stat label="Name" value={`${namePct}%`} /> : null}
        <Stat label="Location" value={`${locationPct}%`} />
        <Stat label="Streak" value={score.streak} />
        <Stat label="Best" value={score.bestStreak} />
      </section>

      <div className="quiz-overlay city-overlay">
        <div className="city-panel">
          {mode === 'city-locate' ? (
            <>
              <span className="eyebrow">Locate on the map</span>
              <h2>{city.name}</h2>
              <p className="prompt-help">Click where this city is{city.usState ? ' — for a US city, click the correct state' : ''}.</p>
            </>
          ) : mode === 'city-photos' ? (
            <>
              <span className="eyebrow">{review ? 'What you were looking at' : 'Name the city from its photos'}</span>
              <PhotoMosaic key={`${city.id}:${position}`} city={city} revealed={Boolean(review)} />
            </>
          ) : (
            <>
              <span className="eyebrow">Name the city from this clue</span>
              <p className="city-clue-text">{city.fact}</p>
            </>
          )}

          {compound ? (
            <form className="city-answer-form" onSubmit={submitCompound}>
              <input
                key={`name:${position}`}
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Type the city name"
                autoComplete="off"
                readOnly={Boolean(review)}
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
          ) : null}

          {review ? (
            <div className="city-verdict">
              {compound ? (
                <p className={review.nameOk ? 'verdict-line ok' : 'verdict-line bad'}>
                  <span>{review.nameOk ? <Check size={15} /> : <X size={15} />}</span>
                  <span>Name: {review.nameOk ? 'correct' : `it was ${city.name}`}{review.submittedName.trim() ? ` (you wrote “${review.submittedName.trim()}”)` : ''}.</span>
                </p>
              ) : null}
              <p className={review.locationOk ? 'verdict-line ok' : 'verdict-line bad'}>
                <span>{review.locationOk ? <Check size={15} /> : <X size={15} />}</span>
                <span>Location: {review.locationOk ? 'correct' : `it is in ${regionLabel(city)}`}.</span>
              </p>
              {mode !== 'city-clue' ? <p className="city-fact-reveal">{city.fact}</p> : null}
            </div>
          ) : null}

          {history.length ? (
            <div className="city-history" aria-label="Answer history">
              {history.map((result) => {
                const tone = result.points === 1 ? 'pass' : result.points === 0 ? 'fail' : 'mid'
                return (
                  <article key={result.id} className={`city-history-card ${tone}`}>
                    <strong>{result.city.name}</strong>
                    <p>
                      {result.compound ? `Name ${result.nameOk ? '✓' : '✗'} · ` : ''}Location {result.locationOk ? '✓' : `✗ (${regionLabel(result.city)})`}
                    </p>
                  </article>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
