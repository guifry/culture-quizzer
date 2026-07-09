import { useEffect, useMemo, useState } from 'react'
import type { Landmark } from '../data/types'
import { loadLandmarkCredits, type PhotoCredit } from '../data/landmarks/credits'
import { resolveImageUrl, shuffle } from '../utils'
import { ImageLightbox } from './ImageLightbox'

// Photo prompt for the landmark quiz: three random shots of the mystery landmark. The
// available count is derived from the credits book (written by the fetch script), so no
// per-landmark image count is stored in the data.
export function LandmarkPhotos({ landmark, revealed = false }: { landmark: Landmark; revealed?: boolean }) {
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
  const picks = useMemo(() => shuffle(Array.from({ length: count }, (_, index) => index + 1)).slice(0, Math.min(3, count)), [count])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (credits === null) return <p className="mosaic-missing">Loading photos…</p>
  if (!count) return <p className="mosaic-missing">Photos for this landmark are not available yet.</p>

  return (
    <>
      <div className={revealed ? 'photo-mosaic revealed' : 'photo-mosaic'} aria-label="Landmark photos">
        {picks.map((n) => (
          <figure key={n} className="mosaic-figure">
            <button type="button" className="mosaic-tile" onClick={() => setOpenIndex(n)} aria-label="Enlarge photo">
              <img src={resolveImageUrl(`/images/landmarks/${landmark.id}/${n}-mini.webp`)} alt={revealed ? landmark.name : 'Photo of the mystery landmark'} loading="lazy" />
            </button>
            {revealed ? <figcaption>{landmark.name}</figcaption> : null}
          </figure>
        ))}
      </div>
      {revealed ? (
        <p className="city-blurb">
          <strong>{landmark.name}.</strong> {landmark.mapBlurb}
        </p>
      ) : null}
      {openIndex !== null ? (
        <ImageLightbox
          src={`/images/landmarks/${landmark.id}/${openIndex}.webp`}
          alt="Landmark photo"
          credit={credits.find((credit) => credit.n === openIndex)}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  )
}
