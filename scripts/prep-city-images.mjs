// Dev-only: source recognisable city landmark photos from Wikimedia Commons, resize/convert to
// WebP (full ≤1600px + miniature ≤500px), and write under public/images/cities/<id>/ with credits.
// One photo per named landmark keeps every image clearly recognisable.
// Usage:  node scripts/prep-city-images.mjs [cityId ...]   (no args = all configured cities)
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { LANDMARKS } from './city-landmarks.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'cities')
const CREDITS = path.join(OUT_DIR, 'credits.json')
const UA = 'culture-quizzer/1.0 (educational quiz; https://github.com/guifry/culture-quizzer)'

const REJECT = /locator|location|\bmap\b|\bplan\b|flag|coat of arms|\bseal\b|logo|blank|diagram|orthographic|globe|montage|collage|icon|emblem|1657|1660|engraving|painting|\.svg$|art institute|getty museum|j\.? ?paul getty|national gallery|museum of art|\bmonet\b|gentileschi|oil on canvas|\bportrait\b/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

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
  return (data.query?.search ?? []).map((s) => s.title).filter((t) => !REJECT.test(t))
}

async function imageInfo(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1600&titles=${encodeURIComponent(fileTitle)}`
  const data = await getJson(url)
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0] ?? null
}

async function bestForTerm(term, used) {
  const titles = await searchFiles(term)
  await sleep(200)
  for (const title of titles) {
    if (used.has(title)) continue
    const info = await imageInfo(title)
    await sleep(200)
    if (!info || info.mime !== 'image/jpeg') continue
    if (!info.width || info.width < 1000 || info.height < 640) continue
    const ratio = info.width / info.height
    if (ratio < 0.5 || ratio > 3.0) continue
    return { title, info }
  }
  return null
}

async function clearDir(dir) {
  if (!existsSync(dir)) return
  for (const file of await readdir(dir)) {
    if (file.endsWith('.webp')) await rm(path.join(dir, file))
  }
}

async function processCity(id) {
  const terms = LANDMARKS[id]
  if (!terms) {
    console.log(`! no landmarks configured for ${id}`)
    return null
  }
  const dir = path.join(OUT_DIR, id)
  await mkdir(dir, { recursive: true })
  await clearDir(dir)
  console.log(`\n== ${id} ==`)
  const used = new Set()
  const credits = []
  let n = 0
  for (const term of terms) {
    try {
      const hit = await bestForTerm(term, used)
      if (!hit) {
        console.log(`  - ${term}: no image`)
        continue
      }
      used.add(hit.title)
      const buf = await fetchImage(hit.info.thumburl ?? hit.info.url)
      n += 1
      await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, `${n}.webp`))
      await sharp(buf).resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(dir, `${n}-mini.webp`))
      const meta = hit.info.extmetadata ?? {}
      credits.push({
        n,
        term,
        title: hit.title,
        artist: stripHtml(meta.Artist?.value) || 'Unknown',
        license: stripHtml(meta.LicenseShortName?.value) || '',
        source: hit.info.descriptionurl ?? '',
        originalUrl: hit.info.url ?? '',
        originalSize: hit.info.width && hit.info.height ? `${hit.info.width}x${hit.info.height}` : '',
      })
      console.log(`  ${n}. ${term} -> ${hit.title} (${hit.info.width}x${hit.info.height})`)
    } catch (err) {
      console.log(`  x ${term}: ${err.message}`)
    }
  }
  console.log(`  -> ${n} images`)
  return { id, count: n, credits }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LANDMARKS)
  const allCredits = existsSync(CREDITS) ? JSON.parse(await readFile(CREDITS, 'utf8')) : {}
  const counts = {}
  for (const id of ids) {
    const result = await processCity(id)
    if (result) {
      counts[id] = result.count
      allCredits[id] = result.credits
    }
  }
  await writeFile(CREDITS, JSON.stringify(allCredits, null, 2))
  console.log('\nCounts:', JSON.stringify(counts))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
