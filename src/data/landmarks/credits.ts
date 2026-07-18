import { resolveImageUrl } from '../../utils'

export type PhotoCredit = {
  n: number
  term?: string
  title?: string
  artist: string
  license: string
  source: string
  originalUrl: string
  originalSize?: string
  flagged?: boolean
  kind?: 'photo' | 'painting' | 'historic-photo'
  artworkTitle?: string
  artworkArtist?: string
  artworkYear?: string
}

let cache: Record<string, PhotoCredit[]> | null = null
let inflight: Promise<Record<string, PhotoCredit[]>> | null = null

export function loadLandmarkCredits(): Promise<Record<string, PhotoCredit[]>> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch(resolveImageUrl('/images/landmarks/credits.json'))
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, PhotoCredit[]>) => {
        cache = data
        return data
      })
      .catch(() => ({}))
  }
  return inflight
}
