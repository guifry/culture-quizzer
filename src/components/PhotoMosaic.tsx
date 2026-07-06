import { useEffect, useState } from 'react'
import type { CityEntry } from '../data/types'
import { loadCredits, type PhotoCredit } from '../data/cities/credits'
import { resolveImageUrl, shuffle } from '../utils'
import { ImageLightbox } from './ImageLightbox'

function pickThree(count: number): number[] {
  const indexes = Array.from({ length: count }, (_, index) => index + 1)
  return shuffle(indexes).slice(0, Math.min(3, count))
}

export function PhotoMosaic({ city }: { city: CityEntry }) {
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
      <div className="photo-mosaic" aria-label="City photos">
        {picks.map((n) => {
          const mini = `/images/cities/${city.id}/${n}-mini.webp`
          return (
            <button key={n} type="button" className="mosaic-tile" onClick={() => setOpenIndex(n)} aria-label="Enlarge photo">
              <img src={resolveImageUrl(mini)} alt="Photo of the mystery city" loading="lazy" />
            </button>
          )
        })}
      </div>
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
