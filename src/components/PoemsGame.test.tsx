import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PoemsGame } from './PoemsGame'
import { poemsForTopic } from '../data/poems'
import type { Topic } from '../data/types'

const topic: Topic = {
  id: 'english-poetry',
  title: 'English Poetry',
  group: 'Literature',
  description: 'Learn the poems.',
  modes: ['type'],
  kind: 'poems',
  items: [],
  coverage: '12 classic English poems.',
}

function renderGame(mobile = false) {
  return render(<PoemsGame topic={topic} mobile={mobile} />)
}

describe('PoemsGame', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  it('renders the poem list in curriculum order with the first poem active in learn mode', () => {
    renderGame()
    const poems = poemsForTopic('english-poetry')
    const buttons = screen.getAllByRole('button', { name: new RegExp(poems[0].title) })
    expect(buttons.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Stopping by Woods on a Snowy Evening').length).toBeGreaterThan(0)
    expect(screen.getByText(/Whose woods these are/)).toBeTruthy()
  })

  it('switches poem on click and shows the new content', () => {
    renderGame()
    fireEvent.click(screen.getByText('The Tyger'))
    expect(screen.getByText(/Tyger Tyger, burning bright/)).toBeTruthy()
  })

  it('switches to exercise mode with a textarea and submits a perfect recall', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const first = poems[0]
    const textarea = screen.getByLabelText(`Type ${first.title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: first.content } })
    fireEvent.click(screen.getAllByRole('button', { name: /submit/i })[0])
    expect(screen.getByText('Perfect recall')).toBeTruthy()
    expect(container().querySelector('.poem-accuracy strong')?.textContent).toBe('100%')
  })

  it('renders character-level diff marks for an imperfect recall', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const first = poems[0]
    const textarea = screen.getByLabelText(`Type ${first.title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: first.content.replace('I think I know.', 'I think I knew.') } })
    fireEvent.click(screen.getAllByRole('button', { name: /submit/i })[0])
    expect(screen.getByText('Not quite there yet')).toBeTruthy()
    expect(container().querySelector('.poem-diff-del')).toBeTruthy()
    expect(container().querySelector('.poem-diff-ins')).toBeTruthy()
  })

  it('keeps the draft when retrying after a submission', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const textarea = screen.getByLabelText(`Type ${poems[0].title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'partial draft' } })
    fireEvent.click(screen.getAllByRole('button', { name: /submit/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    const next = screen.getByLabelText(`Type ${poems[0].title} from memory`) as HTMLTextAreaElement
    expect(next.value).toBe('partial draft')
  })

  it('persists scores to localStorage', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const textarea = screen.getByLabelText(`Type ${poems[0].title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: poems[0].content } })
    fireEvent.click(screen.getAllByRole('button', { name: /submit/i })[0])
    const book = JSON.parse(localStorage.getItem('culture-quizzer-poems-scores') ?? '{}')
    expect(book[topic.id][poems[0].slug]).toEqual({ attempts: 1, best: 100, last: 100 })
  })

  it('shows a first-letter skeleton when hints are enabled', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    expect(container().querySelector('.poem-editor-hints')).toBeNull()
    fireEvent.click(screen.getByLabelText('First-letter hints'))
    const hints = container().querySelector('.poem-editor-hints')
    expect(hints).toBeTruthy()
    const poems = poemsForTopic('english-poetry')
    expect(hints?.textContent?.startsWith(`W${'·'.repeat(poems[0].content.split('\n')[0].length - 1)}`)).toBe(true)
  })

  it('submits with Cmd+Enter', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const textarea = screen.getByLabelText(`Type ${poems[0].title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: poems[0].content } })
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    expect(screen.getByText('Perfect recall')).toBeTruthy()
  })

  it('inserts the reference indent on Tab', () => {
    renderGame()
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const first = poems[0]
    const textarea = screen.getByLabelText(`Type ${first.title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'My little horse must think it queer' } })
    textarea.setSelectionRange(0, 0)
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(textarea.value).toBe('My little horse must think it queer')
    const fourth = first.content.split('\n')[3]
    fireEvent.change(textarea, { target: { value: fourth } })
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(textarea.value).toBe(`${' '.repeat(fourth.length - fourth.trimStart().length)}${fourth}`)
  })

  it('indents the next line even when a stanza blank line was skipped', () => {
    renderGame()
    fireEvent.click(screen.getByText('A Psalm of Life'))
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const psalm = poems.find((poem) => poem.slug === 'a-psalm-of-life') as (typeof poems)[number]
    const textarea = screen.getByLabelText(`Type ${psalm.title} from memory`) as HTMLTextAreaElement
    const typed = "Tell me not, in mournful numbers,\nLife is real! Life is earnest!\n"
    fireEvent.change(textarea, { target: { value: typed } })
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(textarea.value).toBe(`${typed}    `)
  })

  it('does not double-indent an already indented line', () => {
    renderGame()
    fireEvent.click(screen.getByText('A Psalm of Life'))
    fireEvent.click(screen.getByRole('button', { name: /exercise/i }))
    const poems = poemsForTopic('english-poetry')
    const psalm = poems.find((poem) => poem.slug === 'a-psalm-of-life') as (typeof poems)[number]
    const textarea = screen.getByLabelText(`Type ${psalm.title} from memory`) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: "Tell me not, in mournful numbers,\n    " } })
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(textarea.value).toBe("Tell me not, in mournful numbers,\n    ")
  })

  it('renders the mobile tray and opens the poem sheet', () => {
    renderGame(true)
    expect(screen.getByRole('toolbar', { name: /actions/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /list/i }))
    const sheet = screen.getByLabelText('Poems and scores')
    expect(sheet).toBeTruthy()
    fireEvent.click(screen.getByText('The Tyger'))
    expect(screen.getByText(/Tyger Tyger, burning bright/)).toBeTruthy()
  })
})

function container(): HTMLElement {
  return document.querySelector('.poems-game') as HTMLElement
}
