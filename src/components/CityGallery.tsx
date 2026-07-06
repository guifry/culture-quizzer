import { useEffect, useState } from 'react'
import type { CityEntry } from '../data/types'
import { landmarkLabel, loadCredits, type PhotoCredit } from '../data/cities/credits'
import { resolveImageUrl } from '../utils'
import { ImageLightbox } from './ImageLightbox'

export function CityGallery({ city }: { city: CityEntry }) {
  const count = city.images ?? 0
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
    return <p className="gallery-empty">No photographs are available for this city yet.</p>
  }

  const all = Array.from({ length: count }, (_, index) => index + 1)

  return (
    <>
      <div className="city-gallery" aria-label={`Photos of ${city.name}`}>
        {all.map((n) => (
          <figure key={n} className="gallery-figure">
            <button type="button" className="gallery-tile" onClick={() => setOpenIndex(n)} aria-label="Enlarge photo">
              <img src={resolveImageUrl(`/images/cities/${city.id}/${n}-mini.webp`)} alt={landmarkLabel(credits.find((c) => c.n === n)?.term, city.name)} loading="lazy" />
            </button>
            <figcaption>{landmarkLabel(credits.find((c) => c.n === n)?.term, city.name)}</figcaption>
          </figure>
        ))}
      </div>
      {openIndex !== null ? (
        <ImageLightbox
          src={`/images/cities/${city.id}/${openIndex}.webp`}
          alt={`${city.name} photo`}
          credit={credits.find((credit) => credit.n === openIndex)}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  )
}
