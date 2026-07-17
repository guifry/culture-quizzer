// Dev-only: source recognisable France-landmark photos from Wikimedia Commons, screen each
// candidate through a gpt-4o vision gate that rejects any shot whose readable text names
// the landmark (or an off-target/unusable image), then resize/convert to WebP (full +
// miniature) under public/images/landmarks/<id>/ with credits.
//
// Requires OPENAI_API_KEY (read from /Users/guilhemforey/projects/biohacking/.env or the
// environment). Model via OPENAI_MODEL (default gpt-4o). If no clean, non-spoiling shot is
// found for a term, that slot is left empty rather than shipping a spoiler.
//
// Usage:  node scripts/prep-france-landmark-images.mjs [landmarkId ...]   (no args = all)
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { LANDMARKS } from './france-landmark-photos.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'landmarks')
const CREDITS = path.join(OUT_DIR, 'credits.json')
const UA = 'culture-quizzer/1.0 (educational quiz; https://github.com/guifry/culture-quizzer)'
const TARGET_PER_LANDMARK = 8
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o'

const REJECT = /locator|location|\bmap\b|\bplan\b|flag|coat of arms|\bseal\b|logo|blank|diagram|orthographic|globe|montage|collage|icon|emblem|engraving|\.svg$|\bportrait\b|postage|stamp|banknote|coin/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const envPath = path.join(ROOT, '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  // Fallback: biohacking project's .env (user's key store)
  const biohacking = '/Users/guilhemforey/projects/biohacking/.env'
  if (existsSync(biohacking)) {
    for (const line of readFileSync(biohacking, 'utf8').split('\n')) {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  return null
}

const API_KEY = loadApiKey()

const SYSTEM = `You are curating photographs for a "guess the landmark" quiz. For each image you are given the TARGET landmark and every name/word that would give its identity away. A photo is only usable if a player could be shown it WITHOUT the answer being spoiled by visible text.

Judge three things:
1. DEPICTS TARGET — Is the main subject clearly the target landmark itself (not an unrelated object, interior, gift shop, map, or a different place)?
2. REVEALS IDENTITY — Scan the ENTIRE image for readable text on ANY surface: signs, plaques, information boards, banners, carved/engraved names on the building, book/postcard/leaflet covers, screens, watermarks, and burnt-in captions. It reveals identity ONLY if readable text states or unmistakably implies one of the target's given names/giveaway words (in any language, including partial matches). DO flag a sign naming the place; do NOT flag recognisable architecture with no naming text (recognisability is not a spoiler), unrelated shop/brand signs, other place names that do not identify the target, or text too small/blurred to read. If you cannot transcribe a giveaway name, it does not reveal identity.
3. USABLE PHOTO — A clear, real photograph (not a map, diagram, montage/collage, screenshot, sketch, or heavily blurred/tiny image).

Return STRICT JSON only:
{"readable_texts":["<every legible text fragment you can transcribe>"],"depicts_target":true|false,"reveals_identity":true|false,"identity_text":"<exact offending fragment, or null>","usable_photo":true|false,"keep":true|false,"reason":"<one concise sentence>"}
keep is true iff depicts_target AND usable_photo AND NOT reveals_identity.`

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

// gpt-4o spoiler + relevance gate. Returns { keep, reason }. On persistent API error the
// image is skipped (keep:false) so a possible spoiler is never shipped by accident.
async function visionGate(buf, name, giveaways) {
  if (!API_KEY) throw new Error('OPENAI_API_KEY missing')
  const jpeg = await sharp(buf).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`
  const userText = `TARGET: ${name}\nGIVEAWAY WORDS (any of these visible as readable text = reveals identity): ${giveaways.join(', ')}`
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
      const verdict = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
      return { keep: Boolean(verdict.keep), reason: verdict.reason ?? '', identity: verdict.identity_text ?? null }
    } catch (err) {
      if (attempt === 1) return { keep: false, reason: `gate error: ${err.message}` }
      await sleep(1000)
    }
  }
}

async function clearDir(dir) {
  if (!existsSync(dir)) return
  for (const file of await readdir(dir)) {
    if (file.endsWith('.webp')) await rm(path.join(dir, file))
  }
}

async function processLandmark(id) {
  const config = LANDMARKS[id]
  if (!config) {
    console.log(`! no landmark configured for ${id}`)
    return null
  }
  const dir = path.join(OUT_DIR, id)
  await mkdir(dir, { recursive: true })
  await clearDir(dir)
  console.log(`\n== ${id} (${config.name}) ==`)
  const used = new Set()
  const credits = []
  let n = 0
  for (const term of config.terms) {
    if (n >= TARGET_PER_LANDMARK) break
    let titles
    try {
      titles = await searchFiles(term)
    } catch (err) {
      console.log(`  x ${term}: search ${err.message}`)
      continue
    }
    await sleep(200)
    let placed = false
    for (const title of titles) {
      if (placed || used.has(title)) continue
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
        used.add(title)
        n += 1
        await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, `${n}.webp`))
        await sharp(buf).resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(dir, `${n}-mini.webp`))
        const meta = info.extmetadata ?? {}
        credits.push({
          n,
          term,
          title,
          artist: stripHtml(meta.Artist?.value) || 'Unknown',
          license: stripHtml(meta.LicenseShortName?.value) || '',
          source: info.descriptionurl ?? '',
          originalUrl: info.url ?? '',
          originalSize: info.width && info.height ? `${info.width}x${info.height}` : '',
        })
        console.log(`  ${n}. ${term} -> ${title} (${info.width}x${info.height})`)
        placed = true
      } catch (err) {
        console.log(`  x ${term}: ${err.message}`)
      }
    }
    if (!placed) console.log(`  - ${term}: no clean image`)
  }
  console.log(`  -> ${n} images`)
  return { id, count: n, credits }
}

async function main() {
  if (!API_KEY) {
    console.error('OPENAI_API_KEY not found (set it in ./.env, the environment, or the biohacking .env).')
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LANDMARKS)
  const allCredits = existsSync(CREDITS) ? JSON.parse(await readFile(CREDITS, 'utf8')) : {}
  const counts = {}
  for (const id of ids) {
    const result = await processLandmark(id)
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
