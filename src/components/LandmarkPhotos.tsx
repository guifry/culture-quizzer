import { useEffect, useState } from 'react'
import type { Landmark } from '../data/types'
import { loadLandmarkCredits, type PhotoCredit } from '../data/landmarks/credits'
import { landmarkQuizStrings, type LandmarkQuizStrings } from '../data/landmarks/quiz-strings'
import { resolveImageUrl, shuffle } from '../utils'
import { ImageLightbox } from './ImageLightbox'

// Curated rule: when any photo is flagged "always include" (typically a full-building
// view), one random flagged photo is guaranteed a slot; the rest fill up at random.
function pickPhotos(credits: PhotoCredit[]): number[] {
  const flagged = credits.filter((credit) => credit.flagged).map((credit) => credit.n)
  const rest = credits.filter((credit) => !credit.flagged).map((credit) => credit.n)
  if (!flagged.length) return shuffle(credits.map((credit) => credit.n)).slice(0, Math.min(3, credits.length))
  const anchor = shuffle(flagged)[0]
  return [anchor, ...shuffle([...flagged.filter((n) => n !== anchor), ...rest]).slice(0, Math.min(2, credits.length - 1))]
}

// Photo prompt for the landmark quiz: three random shots of the mystery landmark. The
// available count is derived from the credits book (written by the fetch script), so no
// per-landmark image count is stored in the data.
export function LandmarkPhotos({ landmark, revealed = false, strings }: { landmark: Landmark; revealed?: boolean; strings?: LandmarkQuizStrings }) {
  const t = strings ?? landmarkQuizStrings('en')
  const [photoSet, setPhotoSet] = useState<{ credits: PhotoCredit[]; picks: number[] } | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    loadLandmarkCredits().then((book) => {
      if (!active) return
      const credits = book[landmark.id] ?? []
      setPhotoSet({ credits, picks: credits.length ? pickPhotos(credits) : [] })
    })
    return () => {
      active = false
    }
  }, [landmark.id])

  const credits = photoSet?.credits ?? null
  const picks = photoSet?.picks ?? []
  const count = credits?.length ?? 0

  if (credits === null) return <p className="mosaic-missing">{t.loadingPhotos}</p>
  if (!count) return <p className="mosaic-missing">{t.noPhotos}</p>

  return (
    <>
      <div className={revealed ? 'photo-mosaic revealed' : 'photo-mosaic'} aria-label="Landmark photos">
        {picks.map((n) => {
          const credit = credits.find((entry) => entry.n === n)
          const artworkCaption = credit?.kind === 'painting' && credit.artworkArtist
            ? `${credit.artworkTitle ?? landmark.name} — ${credit.artworkArtist}${credit.artworkYear ? ` (${credit.artworkYear})` : ''}`
            : null
          return (
            <figure key={n} className="mosaic-figure">
              <button type="button" className="mosaic-tile" onClick={() => setOpenIndex(n)} aria-label={t.enlargePhoto}>
                <img src={resolveImageUrl(`/images/landmarks/${landmark.id}/${n}-mini.webp`)} alt={revealed ? landmark.name : t.mysteryPhotoAlt} loading="lazy" />
              </button>
              {revealed ? <figcaption>{artworkCaption ?? landmark.name}</figcaption> : null}
            </figure>
          )
        })}
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
