import { useEffect } from 'react'
import { resolveImageUrl } from '../utils'
import type { PhotoCredit } from '../data/cities/credits'

export function ImageLightbox({ src, alt, credit, onClose }: { src: string; alt: string; credit?: PhotoCredit; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <img src={resolveImageUrl(src)} alt={alt} />
      {credit ? (
        <div className="lightbox-credit" onClick={(event) => event.stopPropagation()}>
          <span>
            {credit.artist ? `${credit.artist} · ` : ''}
            {credit.license ? `${credit.license} · ` : ''}
          </span>
          {credit.source ? (
            <a href={credit.source} target="_blank" rel="noreferrer noopener">
              Wikimedia Commons
            </a>
          ) : null}
          {credit.originalUrl ? (
            <a href={credit.originalUrl} target="_blank" rel="noreferrer noopener">
              original
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
