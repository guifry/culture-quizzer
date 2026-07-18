// Gathers photo CANDIDATES for the human curation app (tools/photo-curation).
// See docs/photo-curation.md for the full protocol.
//
// For each landmark it collects ~CANDIDATE_TARGET images into
// tools/photo-curation/candidates/<deck>/<landmarkId>/ :
//   - the images currently shipped in public/images/landmarks/<id>/ (origin "current")
//   - fresh Wikimedia Commons results screened by a gpt-4o gate (origin "fetched")
// and writes tools/photo-curation/candidates/<deck>/manifest.json describing every
// candidate (credit, medium classification, whole-building flag, artwork notes).
//
// The gate REJECTS only text-spoilers, off-target and unusable images. Paintings are NOT
// rejected: they are classified (painting / historic-photo) so the curator can decide,
// with an importance note for known canonical artworks.
//
// Usage:
//   node scripts/gather-landmark-candidates.mjs <deck> [landmarkId ...] [--no-fetch]
//   deck: france | uk        --no-fetch: only repackage current images (no network/API)
import { mkdir, writeFile, readFile, copyFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { LANDMARKS as FR_LANDMARKS } from './france-landmark-photos.mjs'
import { LANDMARKS as UK_LANDMARKS } from './uk-landmark-photos.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'landmarks')
const CREDITS_PATH = path.join(IMAGES_DIR, 'credits.json')
const OUT_ROOT = path.join(ROOT, 'tools', 'photo-curation', 'candidates')
const UA = 'culture-quizzer/1.0 (educational quiz; https://github.com/guifry/culture-quizzer)'
const CANDIDATE_TARGET = 10
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'

const REJECT = /locator|location|\bmap\b|\bplan\b|flag|coat of arms|\bseal\b|logo|blank|diagram|orthographic|globe|montage|collage|icon|emblem|\.svg$|postage|stamp|banknote|coin/i

// Landmarks that are buildings: the curated set MUST contain at least one flagged
// whole-building view (the app warns until it does).
const BUILDING_IDS = new Set([
  'eiffel-tower', 'louvre-museum', 'palace-of-versailles', 'notre-dame-de-paris', 'arc-de-triomphe',
  'mont-saint-michel', 'carcassonne', 'chateau-de-chambord', 'pont-du-gard', 'sacre-coeur',
  'musee-dorsay', 'pantheon', 'chartres-cathedral', 'reims-cathedral', 'strasbourg-cathedral',
  'chateau-de-chenonceau', 'palais-des-papes-avignon', 'millau-viaduct', 'amiens-cathedral',
  'arles-amphitheatre', 'hospices-de-beaune', 'albi-cathedral', 'rouen-cathedral', 'basilique-fourviere',
  'centre-pompidou', 'arenes-de-nimes', 'les-invalides', 'palais-garnier', 'palais-de-la-cite',
  'abbaye-de-fontenay',
  'tower-bridge', 'stonehenge', 'edinburgh-castle', 'windsor-castle', 'buckingham-palace',
  'westminster-abbey', 'palace-of-westminster', 'st-pauls-cathedral', 'tower-of-london',
  'canterbury-cathedral', 'durham-cathedral', 'york-minster', 'kings-college-chapel',
  'radcliffe-camera', 'blenheim-palace', 'royal-albert-hall', 'shakespeares-birthplace',
  'caernarfon-castle', 'stirling-castle', 'ironbridge', 'royal-pavilion-brighton', 'forth-bridge',
])

// Canonical artworks worth keeping (with the caption + course treatment) versus incidental
// artworks the curator will likely drop. Matched against the Commons file title.
const KNOWN_ARTWORKS = [
  {
    match: /monet.*rouen|rouen.*monet|rouen cathedral.*(morning|sunset|effect)|cathedrale.*monet/i,
    kind: 'painting',
    artwork: { title: 'La Cathédrale de Rouen (série)', artist: 'Claude Monet', year: '1892–1894' },
    verdict: 'keep',
    importance: `Monet painted Rouen Cathedral's west front more than thirty times from rented rooms facing the façade, at every hour and season — the most famous demonstration of Impressionism's core idea, that light itself is the subject. The series is dispersed across the Musée d'Orsay and the world's great museums, and it is a cornerstone of general culture: the landmark and the paintings are now inseparable.`,
  },
  {
    match: /monet.*etretat|etretat.*monet|sonnenaufgang bei etretat/i,
    kind: 'painting',
    artwork: { title: 'Étretat (série des falaises)', artist: 'Claude Monet', year: '1883–1886' },
    verdict: 'keep',
    importance: `Monet returned to Étretat repeatedly in the 1880s to paint the Porte d'Aval, the Aiguille and the Manneporte in changing weather — canvases now in the Musée d'Orsay, the Met and beyond. Together with Courbet's and Boudin's views, they made these cliffs a monument of Impressionism; recognising Monet's Étretat is genuine general culture.`,
  },
  {
    match: /monet.*(houses of parliament|parliament)/i,
    kind: 'painting',
    artwork: { title: 'The Houses of Parliament (series)', artist: 'Claude Monet', year: '1900–1904' },
    verdict: 'keep',
    importance: `From a terrace of St Thomas' Hospital, Monet painted the Palace of Westminster dissolving in Thames fog — nearly a hundred canvases of one motif in shifting light. A French master painting a British landmark: culturally interesting in both directions, and among the most famous London images in art.`,
  },
  {
    match: /turner.*windsor|windsor.*turner/i,
    kind: 'painting',
    artwork: { title: 'Windsor Castle from the River', artist: 'J. M. W. Turner', year: 'c. 1805' },
    verdict: 'keep',
    importance: `Turner, Britain's greatest landscape painter, sketched and painted Windsor from the Thames repeatedly. A canonical pairing of a national painter with a royal landmark — worth knowing, and instantly recognisable as a painting rather than an odd photograph.`,
  },
  {
    match: /pennell.*rouen/i,
    kind: 'painting',
    artwork: { title: 'The West Front, Rouen Cathedral', artist: 'Joseph Pennell', year: '1907' },
    verdict: 'drop',
    importance: `A competent lithograph by the American illustrator Joseph Pennell — but not a canonical work of art history. It adds no general-culture value over Monet's series; recommend dropping it from the quiz set.`,
  },
  {
    match: /genisson|catedral de amiens by/i,
    kind: 'painting',
    artwork: { title: `Intérieur de la cathédrale d'Amiens`, artist: 'Jules Victor Génisson', year: '1842' },
    verdict: 'drop',
    importance: `A 19th-century interior view by Génisson, a minor Belgian-French painter of church interiors. Historically pleasant but not a famous work — a photograph teaches the landmark better; recommend dropping.`,
  },
  {
    match: /british school.*shakespeare|shakespeare.*british school/i,
    kind: 'painting',
    artwork: { title: `Shakespeare's Birthplace, Henley Street`, artist: 'British School (anonymous)', year: '19th century' },
    verdict: 'drop',
    importance: `An anonymous naive painting of the birthplace. No art-historical fame; it reads as a random illustration rather than a canonical image — recommend dropping.`,
  },
  {
    match: /durandelle.*eiffel|eiffel.*state of the construction/i,
    kind: 'historic-photo',
    artwork: { title: 'La Tour Eiffel — état de la construction', artist: 'Louis-Émile Durandelle', year: '1888' },
    verdict: 'keep',
    importance: `Durandelle's construction photographs are the classic visual record of the tower rising over Paris — widely reproduced in histories of engineering and photography. As a historic photograph (not a painting) it can stay, clearly captioned.`,
  },
  {
    match: /soulier.*panorama de paris/i,
    kind: 'historic-photo',
    artwork: { title: 'Panorama de Paris, pris de la tour Saint-Jacques', artist: 'Charles Soulier', year: 'c. 1865' },
    verdict: 'drop',
    importance: `An early panorama photograph in which the Panthéon is a distant dome among rooftops. Historically charming but a poor quiz image — the landmark is barely legible; recommend dropping.`,
  },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const stripHtml = (value) => (value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  for (const envPath of [path.join(ROOT, '.env'), '/Users/guilhemforey/projects/biohacking/.env']) {
    if (!existsSync(envPath)) continue
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  return null
}

const API_KEY = loadApiKey()

const SYSTEM = `You are gathering candidate images for a "guess the landmark" quiz; a human curator makes the final call. For each image you get the TARGET landmark and giveaway words.

Judge:
1. DEPICTS TARGET — is the main subject clearly the target landmark (or its site)?
2. REVEALS IDENTITY — scan for readable text naming the target (signs, plaques, watermarks, captions). Only readable text naming the place counts; recognisable architecture is NOT a spoiler.
3. USABLE — a clear image (photograph OR artwork), not a map, diagram, montage, screenshot or unreadable thumbnail.
4. MEDIUM — classify: "photograph" | "painting" (any painted/drawn/printed artwork) | "historic_photograph" (a real photograph clearly from before ~1950).
5. ENTIRE BUILDING — for buildings: is the whole structure visible in frame (a full façade or general view), not a crop or detail?

Return STRICT JSON:
{"depicts_target":bool,"reveals_identity":bool,"identity_text":string|null,"usable":bool,"medium":"photograph"|"painting"|"historic_photograph","entire_building_visible":bool,"keep":bool,"reason":"one sentence"}
keep is true iff depicts_target AND usable AND NOT reveals_identity.`

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

async function fetchImage(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`${res.status}`)
      const type = res.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) throw new Error(`content-type ${type}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      if (attempt === 1) throw err
      await sleep(600)
    }
  }
}

async function searchFiles(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=12&srsearch=${encodeURIComponent(`${term} filetype:bitmap`)}`
  const data = await getJson(url)
  return (data.query?.search ?? []).map((entry) => entry.title).filter((title) => !REJECT.test(title))
}

async function imageInfo(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1600&titles=${encodeURIComponent(fileTitle)}`
  const data = await getJson(url)
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0] ?? null
}

async function visionGate(buf, name, giveaways) {
  if (!API_KEY) throw new Error('OPENAI_API_KEY missing')
  const jpeg = await sharp(buf).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`
  const userText = `TARGET: ${name}\nGIVEAWAY WORDS: ${giveaways.join(', ')}`
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: [{ type: 'text', text: userText }, { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }] },
          ],
        }),
      })
      if (!res.ok) throw new Error(`openai ${res.status}`)
      const data = await res.json()
      return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    } catch (err) {
      if (attempt === 1) return { keep: false, reason: `gate error: ${err.message}` }
      await sleep(1000)
    }
  }
}

function classifyByTitle(title) {
  for (const known of KNOWN_ARTWORKS) {
    if (known.match.test(title)) {
      return { kind: known.kind, artwork: { ...known.artwork, importance: known.importance, verdict: known.verdict } }
    }
  }
  return null
}

function mediumToKind(medium) {
  if (medium === 'painting') return 'painting'
  if (medium === 'historic_photograph') return 'historic-photo'
  return 'photo'
}

async function gatherLandmark(deck, id, config, fetchNew) {
  const dir = path.join(OUT_ROOT, deck, id)
  await mkdir(dir, { recursive: true })
  const creditsBook = existsSync(CREDITS_PATH) ? JSON.parse(await readFile(CREDITS_PATH, 'utf8')) : {}
  const currentCredits = creditsBook[id] ?? []
  const candidates = []
  const usedTitles = new Set()

  const currentDir = path.join(IMAGES_DIR, id)
  if (existsSync(currentDir)) {
    for (const file of (await readdir(currentDir)).filter((f) => /^\d+\.webp$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b))) {
      const n = parseInt(file)
      const credit = currentCredits.find((entry) => entry.n === n)
      const outFile = `cur-${n}.webp`
      await copyFile(path.join(currentDir, file), path.join(dir, outFile))
      const known = credit?.title ? classifyByTitle(credit.title) : null
      if (credit?.title) usedTitles.add(credit.title)
      candidates.push({
        file: outFile,
        origin: 'current',
        kind: known?.kind ?? 'photo',
        entireBuilding: null,
        artwork: known?.artwork ?? null,
        title: credit?.title ?? '',
        artist: credit?.artist ?? '',
        license: credit?.license ?? '',
        source: credit?.source ?? '',
        originalUrl: credit?.originalUrl ?? '',
        term: credit?.term ?? '',
      })
    }
  }

  if (fetchNew && candidates.length < CANDIDATE_TARGET) {
    let fetched = 0
    for (const term of config.terms) {
      if (candidates.length >= CANDIDATE_TARGET) break
      let titles
      try {
        titles = await searchFiles(term)
      } catch (err) {
        console.log(`  x ${term}: search ${err.message}`)
        continue
      }
      await sleep(200)
      for (const title of titles) {
        if (candidates.length >= CANDIDATE_TARGET) break
        if (usedTitles.has(title)) continue
        try {
          const info = await imageInfo(title)
          await sleep(150)
          if (!info || info.mime !== 'image/jpeg') continue
          if (!info.width || info.width < 1000 || info.height < 640) continue
          const ratio = info.width / info.height
          if (ratio < 0.5 || ratio > 3.0) continue
          const buf = await fetchImage(info.thumburl ?? info.url)
          const verdict = await visionGate(buf, config.name, config.giveaways)
          if (!verdict.keep) {
            console.log(`  · reject ${title} — ${verdict.reason}`)
            continue
          }
          usedTitles.add(title)
          fetched += 1
          const outFile = `new-${fetched}.webp`
          await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, outFile))
          const known = classifyByTitle(title)
          const meta = info.extmetadata ?? {}
          candidates.push({
            file: outFile,
            origin: 'fetched',
            kind: known?.kind ?? mediumToKind(verdict.medium),
            entireBuilding: Boolean(verdict.entire_building_visible),
            artwork: known?.artwork ?? null,
            title,
            artist: stripHtml(meta.Artist?.value) || 'Unknown',
            license: stripHtml(meta.LicenseShortName?.value) || '',
            source: info.descriptionurl ?? '',
            originalUrl: info.url ?? '',
            term,
          })
          console.log(`  + ${title} (${verdict.medium ?? 'photograph'})`)
          break
        } catch (err) {
          console.log(`  x ${term}: ${err.message}`)
        }
      }
    }
  }

  return {
    id,
    name: config.name,
    building: BUILDING_IDS.has(id),
    candidates,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const fetchNew = !args.includes('--no-fetch')
  const positional = args.filter((arg) => !arg.startsWith('--'))
  const deck = positional[0]
  if (!deck || !['france', 'uk'].includes(deck)) {
    console.error('Usage: node scripts/gather-landmark-candidates.mjs <france|uk> [landmarkId ...] [--no-fetch]')
    process.exit(1)
  }
  if (fetchNew && !API_KEY) {
    console.error('OPENAI_API_KEY not found; rerun with --no-fetch to repackage current images only.')
    process.exit(1)
  }
  const config = deck === 'france' ? FR_LANDMARKS : UK_LANDMARKS
  const ids = positional.slice(1).length ? positional.slice(1) : Object.keys(config)

  const manifestPath = path.join(OUT_ROOT, deck, 'manifest.json')
  const manifest = existsSync(manifestPath)
    ? JSON.parse(await readFile(manifestPath, 'utf8'))
    : { deck, landmarks: [] }

  for (const id of ids) {
    if (!config[id]) {
      console.log(`! unknown landmark ${id}`)
      continue
    }
    console.log(`\n== ${id} ==`)
    const entry = await gatherLandmark(deck, id, config[id], fetchNew)
    const existing = manifest.landmarks.findIndex((landmark) => landmark.id === id)
    if (existing >= 0) manifest.landmarks[existing] = entry
    else manifest.landmarks.push(entry)
    console.log(`  -> ${entry.candidates.length} candidates`)
  }

  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\nManifest: ${manifestPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
