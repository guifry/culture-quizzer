import { useMemo, useState } from 'react'
import type { GlossaryTerm, Landmark, Topic } from '../data/types'
import { LandmarkGallery } from './LandmarkGallery'
import { LandmarkAtlas } from './LandmarkAtlas'
import './CityCourse.css'
import './LandmarkCourse.css'

type CourseTab = 'text' | 'pictures' | 'map'

function metaLine(landmark: Landmark): string {
  return landmark.region ? `${landmark.region} · ${landmark.nation}` : landmark.nation
}

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

export function LandmarkCourse({ topic }: { topic: Topic }) {
  const landmarks = topic.landmarks ?? []
  const glossary = topic.glossary ?? []
  const byKey = useMemo(() => new Map((topic.glossary ?? []).map((term) => [term.key, term])), [topic.glossary])
  const [tab, setTab] = useState<CourseTab>('text')

  function learnMore(id: string) {
    setTab('text')
    setTimeout(() => {
      document.getElementById(`course-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <section className="city-course landmark-course">
      <nav className="course-toc" aria-label="Contents">
        <span className="course-toc-title">Contents</span>
        <ol>
          {landmarks.map((landmark) => (
            <li key={landmark.id}>
              <a href={`#course-${landmark.id}`}>
                {landmark.name}
                {landmark.essential ? ' ★' : ''}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="course-main">
        <header className="course-head">
          <h2>The Top 32 UK Landmarks</h2>
          <p>
            The cultural landmarks of the United Kingdom worth knowing to understand its history and heritage — ranked
            editorially, with the ★ Must-Know set marked. Read the course, browse the photos, or explore them on the map.
          </p>
        </header>

        <table className="course-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Landmark</th>
              <th>Nation</th>
              <th>★</th>
            </tr>
          </thead>
          <tbody>
            {landmarks.map((landmark, index) => (
              <tr key={landmark.id}>
                <td>{index + 1}</td>
                <td>
                  <a href={`#course-${landmark.id}`}>{landmark.name}</a>
                </td>
                <td>{landmark.nation}</td>
                <td>{landmark.essential ? '★' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="course-subtabs" role="tablist" aria-label="Course view">
          <button type="button" className={tab === 'text' ? 'active' : ''} onClick={() => setTab('text')}>Read</button>
          <button type="button" className={tab === 'pictures' ? 'active' : ''} onClick={() => setTab('pictures')}>Pictures</button>
          <button type="button" className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>Map</button>
        </div>

        {tab === 'map' ? (
          <LandmarkAtlas landmarks={landmarks} onLearnMore={learnMore} />
        ) : (
          <>
            <div className="course-entries">
              {landmarks.map((landmark, index) => (
                <section key={landmark.id} id={`course-${landmark.id}`} className="course-entry">
                  <h3>
                    <span className="course-entry-rank">{index + 1}</span>
                    {landmark.name}
                    {landmark.essential ? <span className="must-know" title="Must-Know landmark"> ★</span> : null}
                  </h3>
                  <p className="course-entry-meta">{metaLine(landmark)}</p>
                  {tab === 'pictures' ? (
                    <LandmarkGallery landmark={landmark} />
                  ) : (
                    <div className="landmark-body">
                      <p className="landmark-nutshell">{landmark.course.nutshell}</p>
                      <dl className="course-angles">
                        <div>
                          <dt>When</dt>
                          <dd>{landmark.course.when}</dd>
                        </div>
                        <div>
                          <dt>Who</dt>
                          <dd>{landmark.course.who}</dd>
                        </div>
                        {landmark.course.people?.length ? (
                          <div>
                            <dt>People</dt>
                            <dd>
                              <ul>
                                {landmark.course.people.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        ) : null}
                        {landmark.course.events?.length ? (
                          <div>
                            <dt>Events</dt>
                            <dd>
                              <ul>
                                {landmark.course.events.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      <ConceptChips keys={landmark.course.concepts} byKey={byKey} />
                    </div>
                  )}
                </section>
              ))}
            </div>

            {tab === 'text' && glossary.length ? (
              <section className="glossary" aria-label="Glossary">
                <h2 className="glossary-head">Glossary</h2>
                <p className="glossary-intro">The recurring periods, styles and concepts behind the landmarks — defined once, used throughout.</p>
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
