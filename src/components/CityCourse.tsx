import { useMemo, useState } from 'react'
import type { CityEntry, Topic } from '../data/types'
import { CityGallery } from './CityGallery'
import './CityCourse.css'

type CourseTab = 'text' | 'pictures'

function formatPopulation(n: number | undefined, estimate: boolean): string {
  if (!n) return '—'
  const value = n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : n.toLocaleString('en-GB')
  return estimate ? `~${value}` : value
}

function regionLabel(city: CityEntry): string {
  return city.usState ? `${city.usState}, ${city.country}` : city.country
}

export function CityCourse({ topic }: { topic: Topic }) {
  const isLost = topic.id === 'lost-cities-game'
  const [tab, setTab] = useState<CourseTab>('text')
  const hasPhotos = (topic.cities ?? []).some((city) => city.images)

  const ranked = useMemo(
    () => [...(topic.cities ?? [])].sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
    [topic.cities],
  )

  return (
    <section className="city-course">
      <nav className="course-toc" aria-label="Contents">
        <span className="course-toc-title">Contents</span>
        <ol>
          {ranked.map((city) => (
            <li key={city.id}>
              <a href={`#course-${city.id}`}>{city.name}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="course-main">
        <header className="course-head">
          <h2>{isLost ? 'The Top 20 Lost Cities' : 'The Top 30 World Cities'}</h2>
          <p>
            {isLost
              ? 'The great ruined and vanished cities of history, ranked by their estimated peak population (figures are rough historical estimates).'
              : 'The great cities of the modern world, ranked by metropolitan-area population.'}
          </p>
        </header>

        <table className="course-table">
          <thead>
            <tr>
              <th>#</th>
              <th>City</th>
              <th>Country</th>
              <th>{isLost ? 'Est. peak pop.' : 'Population'}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((city, index) => (
              <tr key={city.id}>
                <td>{index + 1}</td>
                <td>
                  <a href={`#course-${city.id}`}>{city.name}</a>
                </td>
                <td>{regionLabel(city)}</td>
                <td>{formatPopulation(city.population, isLost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasPhotos ? (
          <div className="course-subtabs" role="tablist" aria-label="Course view">
            <button type="button" className={tab === 'text' ? 'active' : ''} onClick={() => setTab('text')}>
              Read
            </button>
            <button type="button" className={tab === 'pictures' ? 'active' : ''} onClick={() => setTab('pictures')}>
              Pictures
            </button>
          </div>
        ) : null}

        <div className="course-entries">
          {ranked.map((city, index) => (
            <section key={city.id} id={`course-${city.id}`} className="course-entry">
              <h3>
                <span className="course-entry-rank">{index + 1}</span>
                {city.name}
              </h3>
              <p className="course-entry-meta">
                {regionLabel(city)} · {formatPopulation(city.population, isLost)}
                {isLost ? ' (est. peak)' : ''}
              </p>
              {tab === 'pictures' && hasPhotos ? <CityGallery city={city} /> : <p className="course-entry-text">{city.course ?? city.blurb ?? city.fact}</p>}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
