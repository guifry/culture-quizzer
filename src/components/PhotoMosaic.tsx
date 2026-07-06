import { useEffect, useState } from 'react'
import type { CityEntry } from '../data/types'
import { loadCredits, type PhotoCredit } from '../data/cities/credits'
import { resolveImageUrl, shuffle } from '../utils'
import { ImageLightbox } from './ImageLightbox'

function pickThree(count: number): number[] {
  const indexes = Array.from({ length: count }, (_, index) => index + 1)
  return shuffle(indexes).slice(0, Math.min(3, count))
}

function landmarkLabel(term: string | undefined, cityName: string): string {
  if (!term) return 'Landmark'
  const suffix = ` ${cityName.toLowerCase()}`
  const trimmed = term.toLowerCase().endsWith(suffix) ? term.slice(0, term.length - suffix.length) : term
  return trimmed.trim()
}

export function PhotoMosaic({ city, revealed = false }: { city: CityEntry; revealed?: boolean }) {
  const count = city.images ?? 0
  const [picks] = useState(() => pickThree(count))
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [credits, setCredits] = useState<PhotoCredit[]>([])

  useEffect(() => {
    let active = true
    loadCredits().then((book) => {
      if (active) setCredits(book[city.id] ?? [])
    })
    return () => {
      active = false
    }
  }, [city.id])

  if (!count) {
    return <p className="mosaic-missing">Photos for this city are not available yet.</p>
  }

  return (
    <>
      <div className={revealed ? 'photo-mosaic revealed' : 'photo-mosaic'} aria-label="City photos">
        {picks.map((n) => {
          const mini = `/images/cities/${city.id}/${n}-mini.webp`
          return (
            <figure key={n} className="mosaic-figure">
              <button type="button" className="mosaic-tile" onClick={() => setOpenIndex(n)} aria-label="Enlarge photo">
                <img src={resolveImageUrl(mini)} alt={revealed ? landmarkLabel(credits.find((c) => c.n === n)?.term, city.name) : 'Photo of the mystery city'} loading="lazy" />
              </button>
              {revealed ? <figcaption>{landmarkLabel(credits.find((c) => c.n === n)?.term, city.name)}</figcaption> : null}
            </figure>
          )
        })}
      </div>
      {revealed && city.blurb ? (
        <p className="city-blurb">
          <strong>{city.name}.</strong> {city.blurb}
        </p>
      ) : null}
      {openIndex !== null ? (
        <ImageLightbox
          src={`/images/cities/${city.id}/${openIndex}.webp`}
          alt="City photo"
          credit={credits.find((credit) => credit.n === openIndex)}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  )
}
