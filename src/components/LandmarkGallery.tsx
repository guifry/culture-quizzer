import { useEffect, useState } from 'react'
import type { Landmark } from '../data/types'
import { loadLandmarkCredits, type PhotoCredit } from '../data/landmarks/credits'
import { resolveImageUrl } from '../utils'
import { ImageLightbox } from './ImageLightbox'

export function LandmarkGallery({ landmark }: { landmark: Landmark }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [credits, setCredits] = useState<PhotoCredit[] | null>(null)

  useEffect(() => {
    let active = true
    loadLandmarkCredits().then((book) => {
      if (active) setCredits(book[landmark.id] ?? [])
    })
    return () => {
      active = false
    }
  }, [landmark.id])

  const count = credits?.length ?? 0
  if (credits === null) return <p className="gallery-empty">Loading photographs…</p>
  if (!count) return <p className="gallery-empty">No photographs are available for this landmark yet.</p>

  const all = Array.from({ length: count }, (_, index) => index + 1)

  return (
    <>
      <div className="city-gallery" aria-label={`Photos of ${landmark.name}`}>
        {all.map((n) => (
          <figure key={n} className="gallery-figure">
            <button type="button" className="gallery-tile" onClick={() => setOpenIndex(n)} aria-label="Enlarge photo">
              <img src={resolveImageUrl(`/images/landmarks/${landmark.id}/${n}-mini.webp`)} alt={landmark.name} loading="lazy" />
            </button>
          </figure>
        ))}
      </div>
      {openIndex !== null ? (
        <ImageLightbox
          src={`/images/landmarks/${landmark.id}/${openIndex}.webp`}
          alt={`${landmark.name} photo`}
          credit={credits.find((credit) => credit.n === openIndex)}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  )
}
