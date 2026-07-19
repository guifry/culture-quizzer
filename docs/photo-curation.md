# Photo curation protocol — AI gathers, the human decides

This document explains the picture-curation tooling in `tools/photo-curation/` and
`scripts/gather-landmark-candidates.mjs` / `scripts/apply-photo-curation.mjs`: what problem it
solves, how the workflow runs end to end, and the rules any agent must follow when a game
needs quiz images. **Read this before shipping images for any current or future
guess-from-pictures game.**

## Why this exists (the problem it solves)

The first landmark decks shipped images picked entirely by an AI pipeline (Wikimedia search +
a vision gate that only rejected text spoilers). That produced real defects the gate could
not see:

- a news photo of **Notre-Dame burning** served as a quiz image;
- **Rouen Cathedral's set was half artworks** (three Monet canvases and a lithograph), so a
  round could show only paintings;
- oblique crops (a cathedral shot from a back alley) with no recognisable full view;
- generally: "usable photo" is a judgement of taste and pedagogy, not a detectable property.

Decision (standing, from the project owner): **the AI must never be the final curator of quiz
images.** The AI's job is to *gather and pre-annotate* candidates; a human selects, in a
purpose-built app, and only the human-approved set ships. Every future picture-based game
follows the same protocol.

## The three-step workflow

```
1. GATHER (AI)        node scripts/gather-landmark-candidates.mjs <deck> [ids…] [--no-fetch]
                      → tools/photo-curation/candidates/<deck>/<id>/*.webp   (gitignored)
                      → tools/photo-curation/candidates/<deck>/manifest.json (gitignored)

2. CURATE (human)     npm run curate            → opens http://localhost:5188
                      click = keep · ⭐ = "always include" · download JSON when done

3. APPLY (script)     node scripts/apply-photo-curation.mjs photo-curation-<deck>.json
                      → public/images/landmarks/<id>/1..N.webp (+ -mini.webp)   (committed)
                      → public/images/landmarks/credits.json                    (committed)
                      → src/data/landmarks/photo-curation.json                  (committed)
```

Candidate images and the manifest are **regenerable artefacts and are gitignored**; only the
curated output (game images, credits, and the curation record) is committed.

### 1 · Gather

For each landmark the script collects **at least 12 candidates**:

- the images currently shipped in `public/images/landmarks/<id>/` (origin `current`), so the
  existing set is always re-curatable;
- fresh Wikimedia Commons results (origin `fetched`), screened by a gpt-4o gate.

The gate rejects **only** off-target subjects, unusable images (maps, diagrams, montages) and
text spoilers (readable text naming the landmark). Unlike the original pipeline it does
**not** reject artworks — it classifies every candidate:

- `kind`: `photo` | `painting` | `historic-photo`
- `entireBuilding`: whether the whole structure is visible (used for the full-view rule)

Known canonical artworks (Monet's Rouen series, Monet's Étretat, Monet's Houses of
Parliament, Turner's Windsor…) are recognised by title and annotated with an **importance
paragraph and a keep/drop recommendation** (`KNOWN_ARTWORKS` in the gather script) — shown in
the app as a hover popover so the curator can decide with context.

Search terms per landmark live in `scripts/<deck>-landmark-photos.mjs`. **For building
landmarks the first terms must ask for full façade / general views** so the candidate pool
always contains whole-building shots — and several different ones, so the guaranteed slot
(below) doesn't always show the same picture.

Requires `OPENAI_API_KEY` (env or `.env`). `--no-fetch` repackages current images only (no
network, no key needed).

### 2 · Curate (the app)

`npm run curate` serves `tools/photo-curation/index.html` (a dependency-free static page) at
`localhost:5188`:

- deck tabs (france / uk), landmark list with per-landmark selected counts and 🏛 building
  markers, `x/N curated` progress;
- mosaic of candidates per landmark — **click a picture to toggle keep**;
- **⭐ on a tile = "always include"**: the game will guarantee one flagged photo among the
  three shown (flagging auto-selects the tile);
- 🎨 / 🕰 badges on paintings and historic photos; hovering shows the artwork note (title,
  painter, year, why it matters, keep/drop recommendation);
- a warning banner on building landmarks until at least one selected photo is flagged —
  **every building landmark must ship ≥ 1 flagged whole-building view**;
- selection state persists in `localStorage` per deck on every click;
- **Download JSON / CSV** in the navbar produces the export for step 3.

**"Search more photos"** (when the gathered set isn't good enough): each landmark page has a
search bar querying **Wikimedia Commons and Openverse** live from the browser (no API keys).
Click a result to add it to the landmark; added pictures show a 🌐 tile in the mosaic, can be
⭐-flagged like any other, and are stored as **URL references only** — the app never downloads
anything. The apply script does the downloading from the export. Two things to know:

- **you are the spoiler gate for web picks** — the gpt-4o gate never sees them, so check for
  visible names/signage yourself;
- prefer results with a clear licence (both sources return CC/PD material; the licence and
  creator are captured into `credits.json` on apply).

### 3 · Apply

`apply-photo-curation.mjs` replaces each curated landmark's shipped images with the selection
(renumbered `1..N.webp` + regenerated `-mini.webp`): local candidates are copied from the
candidates folder; **external (web-search) picks are downloaded from their public URL at this
point** — resized to the standard 1200/500 px WebP pair, credited from the export's
creator/licence/source fields. It rewrites `credits.json` and commits the export to
`src/data/landmarks/photo-curation.json` as the provenance record. A failed external download
is logged and skipped, never fatal.

**Export formats.** The JSON is what the apply script consumes (`selected` = local files,
`external` = URL references). The CSV carries the same information for humans/other agents,
one row per picture: `landmark, type (local|external), file, url, flagged, title, creator,
license, source, provider` — for `external` rows the `url` column is the public image URL to
download.

`credits.json` fields added by this protocol (see `PhotoCredit` in
`src/data/landmarks/credits.ts`):

- `flagged` — "always include" mark; drives the in-game selection rule;
- `kind` — `painting` / `historic-photo` (absent = photo);
- `artworkTitle` / `artworkArtist` / `artworkYear` — caption data for artworks.

## In-game rules driven by curation

- **Selection rule** (`LandmarkPhotos.tsx`): if a landmark has flagged photos, one randomly
  chosen flagged photo is always among the three shown; the rest are random. With several
  flagged full views, the guaranteed slot rotates — the player learns the building, not one
  photograph.
- **Artwork captions**: when a `painting` is revealed, its caption shows the painting's title,
  painter and year (e.g. *La Cathédrale de Rouen — Claude Monet (1892–1894)*) instead of just
  the landmark name; the landmark's course should carry an "In art" line for canonical
  pairings.

## Editorial rules (frozen)

1. **No AI-final curation.** Ship only human-selected images.
2. **Paintings**: keep only canonical, general-culture artworks (Monet's Rouen/Étretat,
   Monet's Parliament, Turner's Windsor tier). A kept painting is always captioned with
   painter + title and echoed in the course. Incidental illustrations are dropped.
3. **Historic photographs** (e.g. Durandelle's 1888 Eiffel construction photos) may stay if
   genuinely famous, clearly captioned.
4. **Building landmarks** must ship at least one flagged whole-building view; prefer several
   distinct full views.
5. **No news-event images** (fires, attacks) as quiz photos.
6. **No text spoilers** — unchanged from the original gate.

## Extending to a new deck / game

1. Write a `scripts/<deck>-landmark-photos.mjs` terms file (full-view terms first for
   buildings, giveaway words for the spoiler gate).
2. Add the deck to `gather-landmark-candidates.mjs` (config import + `BUILDING_IDS` entries)
   and to the deck list in `tools/photo-curation/index.html` (`boot()`).
3. Run the three steps. That's all — the app, storage and apply pipeline are deck-agnostic.
