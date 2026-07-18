// Serves the photo-curation app (tools/photo-curation) on http://localhost:5188 and opens
// the browser. Zero dependencies. See docs/photo-curation.md.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'tools', 'photo-curation')
const PORT = 5188
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript' }

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    let file = decodeURIComponent(url.pathname)
    if (file === '/') file = '/index.html'
    const full = path.join(ROOT, file)
    if (!full.startsWith(ROOT)) throw new Error('forbidden')
    const body = await readFile(full)
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(full)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}).listen(PORT, () => {
  console.log(`Photo curation app: http://localhost:${PORT}`)
  exec(`open http://localhost:${PORT}`)
})
