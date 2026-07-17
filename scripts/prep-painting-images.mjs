// Dev-only: source canonical images of the famous paintings from Wikimedia Commons and
// write them as public/images/paintings/<id>.jpg (resized, ≤1600px). These are public-domain
// artworks, so the whole painting is the answer — no spoiler gate, just the correct image.
// Usage:  node scripts/prep-painting-images.mjs [id ...]   (no args = all missing)
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'paintings')
const UA = 'culture-quizzer/1.0 (educational quiz; https://github.com/guifry/culture-quizzer)'
const REJECT = /\bframe\b|\bgallery\b|\bmuseum\b|installation|exhibition|\bstamp\b|postage|postcard|replica|\bcopy\b|\bafter\b|\bdetail\b|reverse|\bx-ray\b|infrared|banknote|\bcoin\b|graffiti|mural reproduction|\.svg$/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

function parsePaintings() {
  // Evaluate the data array directly (strip the TS import + type annotation) so id/name/artist
  // stay correctly associated — a regex scan misaligns fields across the nested objects.
  let src = readFileSync(path.join(ROOT, 'src/data/paintings/paintings.ts'), 'utf8')
  src = src.replace(/^\s*import[^\n]*\n/gm, '').replace(/export\s+const\s+famousPaintings\s*:\s*Painting\[\]\s*=/, 'return ')
  const paintings = new Function(src)()
  return paintings.map((p) => ({ id: p.id, name: p.name, artist: p.artist }))
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

async function fetchImage(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`${res.status}`)
      const type = res.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) throw new Error(`content-type ${type}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      if (attempt === 2) throw err
      await sleep(700)
    }
  }
}

async function searchFiles(term) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=16&srsearch=${encodeURIComponent(`${term} filetype:bitmap`)}`
  const data = await getJson(url)
  return (data.query?.search ?? []).map((s) => s.title).filter((t) => !REJECT.test(t))
}

async function imageInfo(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1600&titles=${encodeURIComponent(fileTitle)}`
  const data = await getJson(url)
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0] ?? null
}

// A few paintings share their name with other topics — pin the exact article. Also covers
// modern copyrighted works, whose canonical image lives on en.wikipedia (fair-use), not Commons.
const TITLE_OVERRIDE = {
  guernica: 'Guernica (Picasso)',
  'the-kiss': 'The Kiss (Klimt)',
  olympia: 'Olympia (Manet)',
  'water-lilies': 'Water Lilies (Monet series)',
  'isle-of-dead': 'Isle of the Dead (painting)',
  'la-grande-jatte': 'A Sunday Afternoon on the Island of La Grande Jatte',
  'whistlers-mother': "Whistler's Mother",
  'son-of-man': 'The Son of Man',
  'campbells-soup-cans': "Campbell's Soup Cans",
  'chirstinas-world': "Christina's World",
}

// The English Wikipedia article's lead image is the canonical painting for both public-domain
// and fair-use (copyrighted) works — more reliable than a Commons keyword search.
async function wikipediaImage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=original&titles=${encodeURIComponent(title)}`
  const data = await getJson(url)
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.original?.source ?? null
}

async function bestForPainting(name, artist) {
  // Try a couple of query phrasings; the canonical scan is almost always a top hit.
  for (const term of [`${name} ${artist}`, `${name} painting ${artist}`, name]) {
    const titles = await searchFiles(term)
    await sleep(150)
    for (const title of titles) {
      const info = await imageInfo(title)
      await sleep(120)
      if (!info || info.mime !== 'image/jpeg') continue
      if (!info.width || info.width < 700 || info.height < 500) continue
      const ratio = info.width / info.height
      if (ratio < 0.3 || ratio > 3.2) continue
      return { title, info }
    }
  }
  return null
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const paintings = parsePaintings()
  const existing = new Set((await readdir(OUT_DIR)).filter((f) => f.endsWith('.jpg')).map((f) => f.replace('.jpg', '')))
  const args = process.argv.slice(2)
  const force = args.includes('--all')
  const argIds = args.filter((a) => a !== '--all')
  const targets = paintings.filter((p) => (argIds.length ? argIds.includes(p.id) : force ? true : !existing.has(p.id)))
  console.log(`parsed ${paintings.length} paintings · fetching ${targets.length}`)
  const done = []
  const failed = []
  for (const p of targets) {
    try {
      const title = TITLE_OVERRIDE[p.id] ?? p.name
      let url = await wikipediaImage(title)
      let label = `wiki:${title}`
      await sleep(120)
      if (!url) {
        const hit = await bestForPainting(p.name, p.artist)
        if (hit) {
          url = hit.info.thumburl ?? hit.info.url
          label = `commons:${hit.title}`
        }
      }
      if (!url) {
        console.log(`  x ${p.id}: no image`)
        failed.push(p.id)
        continue
      }
      const buf = await fetchImage(url)
      await sharp(buf).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86 }).toFile(path.join(OUT_DIR, `${p.id}.jpg`))
      console.log(`  ✓ ${p.id} <- ${label}`)
      done.push(p.id)
    } catch (err) {
      console.log(`  x ${p.id}: ${err.message}`)
      failed.push(p.id)
    }
  }
  console.log(`\nDone: ${done.length} fetched, ${failed.length} failed${failed.length ? ` (${failed.join(', ')})` : ''}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
