import { useMemo, useState } from 'react'
import type { GlossaryTerm, Topic } from '../data/types'
import { resolveImageUrl } from '../utils'
import './CityCourse.css'
import './PaintingQuiz.css'

type CourseTab = 'text' | 'gallery'

function ConceptChips({ keys, byKey }: { keys: string[]; byKey: Map<string, GlossaryTerm> }) {
  const terms = keys.map((key) => byKey.get(key)).filter((term): term is GlossaryTerm => Boolean(term))
  if (!terms.length) return null
  return (
    <div className="concept-chips">
      {terms.map((term) => (
        <a key={term.key} className="concept-chip" href={`#glossary-${term.key}`}>
          {term.term}
        </a>
      ))}
    </div>
  )
}

export function PaintingCourse({ topic }: { topic: Topic }) {
  const paintings = topic.paintings ?? []
  const glossary = useMemo(() => topic.glossary ?? [], [topic.glossary])
  const byKey = useMemo(() => new Map(glossary.map((term) => [term.key, term])), [glossary])
  const [tab, setTab] = useState<CourseTab>('text')

  return (
    <section className="city-course painting-course">
      <nav className="course-toc" aria-label="Contents">
        <span className="course-toc-title">Contents</span>
        <ol>
          {paintings.map((painting) => (
            <li key={painting.id}>
              <a href={`#course-${painting.id}`}>
                {painting.name}
                {painting.essential ? ' ★' : ''}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="course-main">
        <header className="course-head">
          <h2>The Top 31 Famous Paintings</h2>
          <p>
            The world's most recognised paintings — ranked by fame, with the ★ Must-Know set marked.
            Read the course, browse the gallery, and learn the stories behind each masterpiece.
          </p>
        </header>

        <table className="course-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Painting</th>
              <th>Artist</th>
              <th>★</th>
            </tr>
          </thead>
          <tbody>
            {paintings.map((painting, index) => (
              <tr key={painting.id}>
                <td>{index + 1}</td>
                <td><a href={`#course-${painting.id}`}>{painting.name}</a></td>
                <td>{painting.artist}</td>
                <td>{painting.essential ? '★' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="course-subtabs" role="tablist" aria-label="Course view">
          <button type="button" className={tab === 'text' ? 'active' : ''} onClick={() => setTab('text')}>Read</button>
          <button type="button" className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>Gallery</button>
        </div>

        {tab === 'gallery' ? (
          <div className="painting-gallery-grid">
            {paintings.map((painting) => (
              <a key={painting.id} href={`#course-${painting.id}`} className="painting-gallery-card" onClick={(e) => { e.preventDefault(); setTab('text'); setTimeout(() => document.getElementById(`course-${painting.id}`)?.scrollIntoView({ behavior: 'smooth' }), 60) }}>
                <img
                  src={resolveImageUrl(`/images/paintings/${painting.id}.jpg`)}
                  alt={painting.name}
                  loading="lazy"
                />
                <span className="painting-gallery-label">{painting.name}</span>
                <span className="painting-gallery-artist">{painting.artist}</span>
              </a>
            ))}
          </div>
        ) : (
          <>
            <div className="course-entries">
              {paintings.map((painting, index) => (
                <section key={painting.id} id={`course-${painting.id}`} className="course-entry">
                  <h3>
                    <span className="course-entry-rank">{index + 1}</span>
                    {painting.name}
                    {painting.essential ? <span className="must-know" title="Must-Know"> ★</span> : null}
                  </h3>
                  <p className="course-entry-meta">{painting.artist} · {painting.century} · {painting.movement} · {painting.nationality}</p>

                  <div className="landmark-body">
                    <p className="landmark-nutshell">{painting.course.nutshell}</p>
                    <dl className="course-angles">
                      <div>
                        <dt>When</dt>
                        <dd>{painting.course.when}</dd>
                      </div>
                      <div>
                        <dt>Who</dt>
                        <dd>{painting.course.who}</dd>
                      </div>
                      <div>
                        <dt>Analysis</dt>
                        <dd>{painting.course.analysis}</dd>
                      </div>
                      {painting.course.anecdote ? (
                        <div>
                          <dt>Anecdote</dt>
                          <dd>{painting.course.anecdote}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <ConceptChips keys={painting.course.concepts} byKey={byKey} />
                  </div>
                </section>
              ))}
            </div>

            {glossary.length ? (
              <section className="glossary" aria-label="Glossary">
                <h2 className="glossary-head">Glossary</h2>
                <p className="glossary-intro">The art movements, techniques and concepts behind the paintings — defined once, used throughout.</p>
                <dl className="glossary-list">
                  {glossary.map((term) => (
                    <div key={term.key} id={`glossary-${term.key}`} className="glossary-term">
                      <dt>
                        {term.term}
                        {term.span ? <span className="glossary-span"> · {term.span}</span> : null}
                      </dt>
                      <dd>{term.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
