// Applies a curation export (downloaded from the tools/photo-curation app) to the shipped
// game assets. See docs/photo-curation.md.
//
// For every landmark in the export:
//   - selected candidate images are copied from tools/photo-curation/candidates/<deck>/<id>/
//     into public/images/landmarks/<id>/ as 1.webp..N.webp (+ -mini.webp), replacing the
//     previous set;
//   - public/images/landmarks/credits.json is rewritten with credit metadata from the
//     candidates manifest, plus flagged / kind / artwork caption fields;
//   - the export itself is committed to src/data/landmarks/photo-curation.json for
//     provenance (what the human chose, when).
//
// Usage: node scripts/apply-photo-curation.mjs <path-to-export.json>
import { mkdir, writeFile, readFile, copyFile, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

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
    if (!landmark) {
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
    for (const selection of pick.selected) {
      const candidate = landmark.candidates.find((entry) => entry.file === selection.file)
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
    credits[pick.id] = newCredits
    console.log(`${pick.id}: ${n} images (${newCredits.filter((credit) => credit.flagged).length} flagged)`)
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
