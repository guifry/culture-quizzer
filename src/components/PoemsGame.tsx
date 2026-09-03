import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, List, RotateCcw, X } from 'lucide-react'
import type { Topic } from '../data/types'
import { poemsForTopic } from '../data/poems'
import type { Poem } from '../data/poems/types'
import { diffPoem, type PoemDiff } from '../data/poems/diff'
import { DiffStats, PoemDiffView } from './PoemDiff'
import './PoemsGame.css'

type PoemScore = {
  attempts: number
  best: number | null
  last: number | null
}

type PoemsOptions = {
  liveFeedback: boolean
  firstLetters: boolean
}

const SCORE_STORAGE_KEY = 'culture-quizzer-poems-scores'
const OPTIONS_STORAGE_KEY = 'culture-quizzer-poems-options'

function loadScoreBook(): Record<string, Record<string, PoemScore>> {
  try {
    return JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function loadOptions(): PoemsOptions {
  try {
    const raw = JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) ?? '{}') as Partial<PoemsOptions>
    return { liveFeedback: Boolean(raw.liveFeedback), firstLetters: Boolean(raw.firstLetters) }
  } catch {
    return { liveFeedback: false, firstLetters: false }
  }
}

function poemYears(poem: Poem) {
  const parts = [poem.yearWritten, poem.yearPublished].filter((year): year is number => typeof year === 'number')
  const unique = [...new Set(parts)]
  if (!unique.length) return null
  return unique.join(' · ')
}

export function PoemsGame({ topic, mobile = false }: { topic: Topic; mobile?: boolean }) {
  const poems = useMemo(() => poemsForTopic(topic.id), [topic.id])
  const [selectedSlug, setSelectedSlug] = useState(() => poems[0]?.slug ?? '')
  const [view, setView] = useState<'learn' | 'exercise'>('learn')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ submitted: string; diff: PoemDiff } | null>(null)
  const [scores, setScores] = useState(() => loadScoreBook()[topic.id] ?? {})
  const [options, setOptions] = useState<PoemsOptions>(loadOptions)
  const [sheetOpen, setSheetOpen] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const mirrorRef = useRef<HTMLPreElement | null>(null)
  const hintsRef = useRef<HTMLPreElement | null>(null)

  const poem = poems.find((entry) => entry.slug === selectedSlug) ?? poems[0]
  const draft = drafts[selectedSlug] ?? ''
  const hintSkeleton = useMemo(
    () =>
      (poem?.content ?? '')
        .split('\n')
        .map((line) => (line.length ? `${line[0]}${'·'.repeat(line.length - 1)}` : ''))
        .join('\n'),
    [poem],
  )

  useEffect(() => {
    const book = loadScoreBook()
    book[topic.id] = scores
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(book))
  }, [topic.id, scores])

  useEffect(() => {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options))
  }, [options])

  const selectPoem = useCallback((slug: string) => {
    setSelectedSlug(slug)
    setResult(null)
    setSheetOpen(false)
  }, [])

  const switchView = useCallback((next: 'learn' | 'exercise') => {
    setView(next)
    setResult(null)
  }, [])

  const submit = useCallback(() => {
    if (!poem) return
    const diff = diffPoem(poem.content, draft)
    const accuracy = diff.stats.accuracy
    setScores((previous) => {
      const prior = previous[poem.slug] ?? { attempts: 0, best: null, last: null }
      return {
        ...previous,
        [poem.slug]: {
          attempts: prior.attempts + 1,
          best: prior.best === null ? accuracy : Math.max(prior.best, accuracy),
          last: accuracy,
        },
      }
    })
    setResult({ submitted: draft, diff })
  }, [poem, draft])

  const retry = useCallback(() => {
    setResult(null)
    editorRef.current?.focus()
  }, [])

  useEffect(() => {
    if (view === 'exercise' && !result && !mobile) editorRef.current?.focus()
  }, [view, result, selectedSlug, mobile])

  if (!poems.length || !poem) return null

  const score = scores[poem.slug]
  const years = poemYears(poem)

  const toggleOption = (key: keyof PoemsOptions) => {
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  const editorFace = (
    <div className="poem-editor-face">
      <div className="poem-editor-shell">
        {options.firstLetters ? (
          <pre ref={hintsRef} className="poem-editor-hints" aria-hidden="true">
            {hintSkeleton}
          </pre>
        ) : null}        {options.liveFeedback ? (
          <pre ref={mirrorRef} className="poem-editor-mirror" aria-hidden="true">
            {[...poem.content].map((char, index) => {
              const typed = draft[index]
              const status = typed === undefined ? 'pending' : typed === char ? 'ok' : 'bad'
              return (
                <span key={index} className={`poem-mirror-char poem-mirror-${status}`}>
                  {char}
                </span>
              )
            })}
            {draft.length > poem.content.length ? <span className="poem-mirror-char poem-mirror-bad">{draft.slice(poem.content.length)}</span> : null}
          </pre>
        ) : null}
        <textarea
          ref={editorRef}
          className={options.liveFeedback ? 'poem-editor-input poem-editor-invisible' : 'poem-editor-input'}
          value={draft}
          onChange={(event) => setDrafts((previous) => ({ ...previous, [poem.slug]: event.target.value }))}
          onScroll={(event) => {
            const mirror = mirrorRef.current
            if (mirror) {
              mirror.scrollTop = event.currentTarget.scrollTop
              mirror.scrollLeft = event.currentTarget.scrollLeft
            }
            const hints = hintsRef.current
            if (hints) {
              hints.scrollTop = event.currentTarget.scrollTop
              hints.scrollLeft = event.currentTarget.scrollLeft
            }
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              if (!result) submit()
              return
            }
            if (event.key === 'Tab') {
              event.preventDefault()
              const textarea = event.currentTarget
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              const refLines = poem.content.split('\n')
              const typedLines = draft.slice(0, start).split('\n')
              const current = typedLines[typedLines.length - 1] ?? ''

              // Locate our position in the reference by content, not by line index: index
              // matching breaks the moment the user skips a stanza blank line, leaving Tab
              // silently inserting nothing on every later line.
              const bestMatch = (query: string, anchor: number) => {
                let best = -1
                let bestDistance = Number.POSITIVE_INFINITY
                refLines.forEach((line, index) => {
                  if (!line.trimStart().startsWith(query)) return
                  const distance = Math.abs(index - anchor)
                  if (distance < bestDistance) {
                    bestDistance = distance
                    best = index
                  }
                })
                return best
              }

              let refIndex = typedLines.length - 1
              if (current.trim()) {
                const matched = bestMatch(current.trimStart(), refIndex)
                if (matched !== -1) refIndex = matched
              } else {
                for (let i = typedLines.length - 2; i >= 0; i -= 1) {
                  const previous = typedLines[i]
                  if (!previous.trim()) continue
                  const matched = bestMatch(previous.trimStart(), i)
                  if (matched !== -1) {
                    refIndex = matched + 1
                    break
                  }
                }
              }
              while (refIndex < refLines.length && refLines[refIndex] === '') refIndex += 1
              const refLine = refLines[Math.min(refIndex, refLines.length - 1)] ?? ''
              const indent = refLine.match(/^\s*/)?.[0] ?? ''

              const lineStart = start - current.length
              const typedBeforeCaret = draft.slice(lineStart, start)
              const existing = /^\s*$/.test(typedBeforeCaret) ? typedBeforeCaret.length : 0
              const insert = indent.slice(existing)
              if (!insert) return

              setDrafts((previous) => ({ ...previous, [poem.slug]: previous[poem.slug].slice(0, start) + insert + previous[poem.slug].slice(end) }))
              requestAnimationFrame(() => textarea.setSelectionRange(start + insert.length, start + insert.length))
            }
          }}
          placeholder={options.firstLetters ? 'Type the poem from memory. First letters hint shown.' : 'Type the poem from memory…'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={`Type ${poem.title} from memory`}
        />
      </div>
      <div className="poem-editor-actions">
        <span className="poem-editor-progress">
          {draft.length} / {poem.content.length} chars · ⌘↵ to submit
        </span>
        <button className="primary-action" type="button" onClick={submit}>
          <Check size={16} />
          Submit
        </button>
      </div>
    </div>
  )

  const resultsFace = result ? (
    <div className="poem-results-face">
      <div className="poem-results-hero">
        <div>
          <span className="eyebrow">Assessment</span>
          <h2>{result.diff.stats.exact ? 'Perfect recall' : 'Not quite there yet'}</h2>
          {result.diff.stats.exact ? (
            <p>Every character matches the reference text.</p>
          ) : (
            <p>Left: your version. Right: the reference. Red marks what you wrote that isn't in the reference, green what you missed.</p>
          )}
        </div>
      </div>
      <DiffStats stats={result.diff.stats} />
      <PoemDiffView diff={result.diff} />
    </div>
  ) : null

  const learnFace = (
    <div className="poem-learn-face">
      <div className="poem-learn-head">
        {poem.description ? <p className="poem-description">{poem.description}</p> : null}
        {poem.textNote ? <p className="poem-text-note">{poem.textNote}</p> : null}
      </div>
      <pre className="poem-body">{poem.content}</pre>
    </div>
  )

  const poemList = (
    <nav className="poem-list" aria-label="Poems">
      {poems.map((entry, index) => (
        <button
          key={entry.slug}
          className={entry.slug === poem.slug ? 'poem-list-button active' : 'poem-list-button'}
          type="button"
          onClick={() => selectPoem(entry.slug)}
        >
          <span className="poem-list-index">{index + 1}</span>
          <span className="poem-list-text">
            <strong>{entry.title}</strong>
            <small>{entry.author}</small>
          </span>
          {scores[entry.slug]?.best !== null && scores[entry.slug]?.best !== undefined ? (
            <span className="poem-list-score">{scores[entry.slug].best}%</span>
          ) : null}
        </button>
      ))}
    </nav>
  )

  const optionsControls = (
    <div className="poem-options">
      <label>
        <input type="checkbox" checked={options.liveFeedback} onChange={() => toggleOption('liveFeedback')} />
        <span>Live character feedback</span>
      </label>
      <label>
        <input type="checkbox" checked={options.firstLetters} onChange={() => toggleOption('firstLetters')} />
        <span>First-letter hints</span>
      </label>
    </div>
  )

  if (mobile) {
    return (
      <section className="poems-game poems-game-mobile">
        <div className="poems-mobile-topbar">
          <div className="poems-mobile-title">
            <strong>{poem.title}</strong>
            <span>{poem.author}{years ? ` · ${years}` : ''}</span>
          </div>
          {score?.best !== null && score?.best !== undefined ? <span className="poems-mobile-best">{score.best}% best</span> : null}
        </div>

        <div className="poems-mobile-face">
          {view === 'learn' ? learnFace : result ? resultsFace : editorFace}
        </div>

        <div className="poems-tray" role="toolbar" aria-label="Actions">
          <button type="button" className={sheetOpen ? 'tray-button active' : 'tray-button'} onClick={() => setSheetOpen(true)}>
            <List size={18} />
            <span>List</span>
          </button>
          <div className="tray-toggle" role="tablist" aria-label="Mode">
            <button
              type="button"
              className={view === 'learn' ? 'tray-button active' : 'tray-button'}
              onClick={() => switchView('learn')}
            >
              <BookOpen size={18} />
              <span>Learn</span>
            </button>
            <button
              type="button"
              className={view === 'exercise' ? 'tray-button active' : 'tray-button'}
              onClick={() => switchView('exercise')}
            >
              <span>Exercise</span>
            </button>
          </div>
          {view === 'exercise' && !result ? (
            <button type="button" className="tray-button tray-submit" onClick={submit}>
              <Check size={18} />
              <span>Submit</span>
            </button>
          ) : null}
          {result ? (
            <button type="button" className="tray-button tray-submit" onClick={retry}>
              <RotateCcw size={18} />
              <span>Retry</span>
            </button>
          ) : null}
        </div>

        {sheetOpen ? (
          <>
            <div className="poem-sheet-scrim" onClick={() => setSheetOpen(false)} />
            <aside className="poem-sheet" aria-label="Poems and scores">
              <div className="poem-sheet-head">
                <strong>Poems</strong>
                <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close poem list">
                  <X size={18} />
                </button>
              </div>
              {score ? (
                <div className="poem-sheet-stats">
                  <span>Best <b>{score.best ?? '—'}</b></span>
                  <span>Last <b>{score.last ?? '—'}</b></span>
                  <span>Attempts <b>{score.attempts}</b></span>
                </div>
              ) : null}
              {poemList}
              {optionsControls}
            </aside>
          </>
        ) : null}
      </section>
    )
  }

  return (
    <div className="poems-game">
      <aside className="poems-sidebar">
        <div className="poems-mode-toggle" role="tablist" aria-label="Mode">
          <button
            type="button"
            className={view === 'learn' ? 'poems-mode-button active' : 'poems-mode-button'}
            onClick={() => switchView('learn')}
          >
            <BookOpen size={16} />
            Learn
          </button>
          <button
            type="button"
            className={view === 'exercise' ? 'poems-mode-button active' : 'poems-mode-button'}
            onClick={() => switchView('exercise')}
          >
            Exercise
          </button>
        </div>
        {poemList}
        <div className="poems-sidebar-foot">
          {optionsControls}
          {score ? (
            <p className="poems-current-score">
              Best {score.best ?? '—'} · Last {score.last ?? '—'} · {score.attempts} attempts
            </p>
          ) : null}
        </div>
      </aside>

      <section className="poems-main">
        <header className="poems-topbar">
          <div>
            <h2>{poem.title}</h2>
            <p>
              {poem.author}
              {years ? ` · ${years}` : ''}
            </p>
          </div>
          {view === 'exercise' && !result ? (
            <button className="primary-action" type="button" onClick={submit}>
              <Check size={16} />
              Submit
            </button>
          ) : result ? (
            <button className="ghost-action" type="button" onClick={retry}>
              <RotateCcw size={16} />
              Retry
            </button>
          ) : null}
        </header>

        <div className="poems-face">
          {view === 'learn' ? learnFace : result ? resultsFace : editorFace}
        </div>
      </section>
    </div>
  )
}
