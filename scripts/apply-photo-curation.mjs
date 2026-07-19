// Applies a curation export (downloaded from the tools/photo-curation app) to the shipped
// game assets. See docs/photo-curation.md.
//
// For every landmark in the export:
//   - selected candidate images are copied from tools/photo-curation/candidates/<deck>/<id>/;
//   - "external" picks (added via the app's web search) are DOWNLOADED from their public
//     URL — the app only stores URL references, never downloads;
//   - everything is renumbered into public/images/landmarks/<id>/ as 1.webp..N.webp
//     (+ -mini.webp), replacing the previous set;
//   - public/images/landmarks/credits.json is rewritten with credit metadata (manifest for
//     local picks, export fields for external ones), plus flagged / kind / artwork fields;
//   - the export itself is committed to src/data/landmarks/photo-curation.json for
//     provenance (what the human chose, when).
//
// Usage: node scripts/apply-photo-curation.mjs <path-to-export.json>
import { mkdir, writeFile, readFile, copyFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const UA = 'culture-quizzer/1.0 (educational quiz; https://github.com/guifry/culture-quizzer)'

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
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
}

const ROOT = path.resolve(import.meta.dirname, '..')
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'landmarks')
const CREDITS_PATH = path.join(IMAGES_DIR, 'credits.json')
const RECORD_PATH = path.join(ROOT, 'src', 'data', 'landmarks', 'photo-curation.json')

async function main() {
  const exportPath = process.argv[2]
  if (!exportPath || !existsSync(exportPath)) {
    console.error('Usage: node scripts/apply-photo-curation.mjs <photo-curation-<deck>.json>')
    process.exit(1)
  }
  const curation = JSON.parse(await readFile(exportPath, 'utf8'))
  const manifestPath = path.join(ROOT, 'tools', 'photo-curation', 'candidates', curation.deck, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath} — run the gather script first.`)
    process.exit(1)
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const credits = existsSync(CREDITS_PATH) ? JSON.parse(await readFile(CREDITS_PATH, 'utf8')) : {}

  for (const pick of curation.landmarks) {
    const landmark = manifest.landmarks.find((entry) => entry.id === pick.id)
    const externals = pick.external ?? []
    if (!landmark && !externals.length) {
      console.log(`! ${pick.id}: not in manifest, skipped`)
      continue
    }
    const sourceDir = path.join(ROOT, 'tools', 'photo-curation', 'candidates', curation.deck, pick.id)
    const targetDir = path.join(IMAGES_DIR, pick.id)
    await mkdir(targetDir, { recursive: true })
    for (const file of (await readdir(targetDir)).filter((f) => f.endsWith('.webp'))) {
      await rm(path.join(targetDir, file))
    }
    const newCredits = []
    let n = 0
    for (const selection of pick.selected ?? []) {
      const candidate = landmark?.candidates.find((entry) => entry.file === selection.file)
      if (!candidate) {
        console.log(`! ${pick.id}/${selection.file}: not in manifest, skipped`)
        continue
      }
      n += 1
      const source = path.join(sourceDir, selection.file)
      await copyFile(source, path.join(targetDir, `${n}.webp`))
      await sharp(source).resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(targetDir, `${n}-mini.webp`))
      newCredits.push({
        n,
        term: candidate.term || undefined,
        title: candidate.title || undefined,
        artist: candidate.artist || 'Unknown',
        license: candidate.license || '',
        source: candidate.source || '',
        originalUrl: candidate.originalUrl || '',
        flagged: selection.flagged || undefined,
        kind: candidate.kind !== 'photo' ? candidate.kind : undefined,
        artworkTitle: candidate.artwork?.title,
        artworkArtist: candidate.artwork?.artist,
        artworkYear: candidate.artwork?.year,
      })
    }
    for (const item of externals) {
      try {
        const buf = await fetchImage(item.url)
        n += 1
        await sharp(buf).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(targetDir, `${n}.webp`))
        await sharp(buf).resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(targetDir, `${n}-mini.webp`))
        newCredits.push({
          n,
          term: 'web search',
          title: item.title || undefined,
          artist: item.creator || 'Unknown',
          license: item.license || '',
          source: item.source || '',
          originalUrl: item.url,
          flagged: item.flagged || undefined,
        })
      } catch (err) {
        console.log(`! ${pick.id}: external download failed (${err.message}) — ${item.url}`)
      }
    }
    credits[pick.id] = newCredits
    console.log(`${pick.id}: ${n} images (${newCredits.filter((credit) => credit.flagged).length} flagged, ${externals.length} external)`)
  }

  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2))
  await writeFile(RECORD_PATH, JSON.stringify(curation, null, 2))
  console.log(`\nCredits updated: ${CREDITS_PATH}`)
  console.log(`Curation record: ${RECORD_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
