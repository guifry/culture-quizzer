# Game architecture, templates & patterns

This document is the reference for anyone (human or AI agent) adding or changing games in
Culture Quizzer. It explains the game types, the two implementation styles, the reusable
templates, the gamification patterns, and the data/asset pipelines. Read this before adding a new
game.

Stack: React 19 + TypeScript + Vite, SVG maps via `d3-geo`, static hosting on GitHub Pages
(auto-deploy on push to `master` via `.github/workflows/deploy-pages.yml`).

---

## 1. Core model

Everything is a **`Topic`** (`src/data/types.ts`). Topics are listed in the sidebar, grouped by
`TopicGroup` (Geography, History, Art, …). The full list is assembled in
`src/data/curriculum.ts` (`export const topics`), which spreads in per-area datasets
(`...knowledgeQuestions`, `...historyDateTopics`, `...cityTopics`).

```ts
type Topic = {
  id, title, group, description, coverage,
  modes: QuizMode[],            // first mode is the default; drives the "Quiz type" toggle
  mapScope?, mapKind?, boundaryLayer?, items: QuizItem[],   // used by the generic engine
  kind?: 'history-dates' | 'city-quiz',                     // discriminator for self-contained games
  dates?: HistoryDate[], cities?: CityEntry[],              // payload for self-contained games
}
```

`QuizMode` is the union of every interaction type across all games (map-click, type, choice,
date-recall, city-photos, …). **All modes must have a label** in `defaultModeLabels`
(`src/App.tsx`) or TypeScript fails (`Record<QuizMode,string>`).

Types live in `src/data/types.ts` and are re-exported from `src/data/curriculum.ts` so existing
imports (`from './data/curriculum'`) keep working.

---

## 2. Two implementation styles

**A. Generic engine (in `src/App.tsx`).** Map decks, typed/choice knowledge decks, image decks and
the sequence deck are rendered by shared code in `App.tsx`: `CultureMap` (SVG map + clicking),
`QuizPanel` (prompt + input/choices), plus the round/score/review plumbing on the `App` component.
Answers flow through `record()` / `submit()` / `pickMapItem()`. Good for single-interaction quizzes
that fit `QuizItem`.

**B. Self-contained template (in `src/components/`).** When a game needs bespoke interaction,
scoring, or layout that does not fit the generic flow, it is a **standalone component** fed a
dataset, branched in `App.tsx` by `Topic.kind`. This is the preferred pattern for new, richer games.
Two exist:

- **History Dates** — `src/components/HistoryDateQuiz.tsx`, `kind: 'history-dates'`.
- **City games** — `src/components/CityQuiz.tsx`, `kind: 'city-quiz'`.

The App branch (inside the `activePageView === 'practice'` block):

```tsx
{isCityTopic(activeTopic) ? <CityQuiz key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} />
 : isHistoryDateTopic(activeTopic) ? <HistoryDateQuiz .../>
 : activeTopic.id === 'solar-system' ? <SolarSystemQuiz .../>
 : /* generic map / quiz panel */ }
```

The generic score-strip is hidden for self-contained topics; each template renders its own.

---

## 3. Game families

| Family | Where | Modes | Notes |
|---|---|---|---|
| Country/point maps | `App.tsx` `CultureMap`+`QuizPanel` | `map-click`, `map-type`, `map-number` | `mapKind` `country-polygons`/`points`, optional `boundaryLayer` |
| Knowledge decks | `App.tsx` `QuizPanel` | `type`, `choice` | optional Course/Questions views via `courseArticles` |
| Image recognition | `App.tsx` | `image`, `choice` | `QuizItem.imageUrl` under `public/images/...` |
| Sequence | `SolarSystemQuiz` | `sequence` | bespoke ordering UI |
| History Dates | `HistoryDateQuiz` | `date-recall`, `event-recall` | two independent scores; "Learn more" modal |
| City games | `CityQuiz` (+`CityMap`,`PhotoMosaic`,`ImageLightbox`,`CityCourse`,`CityGallery`) | `city-locate`, `city-photos`, `city-clue` | 0/0.5/1 scoring; Course view with Pictures |

Datasets are **one file per deck** under `src/data/<area>/`:
- History: `src/data/history/*.ts` (+ `matching.ts`, `types.ts` `buildHistoryTopic`, `aliases.ts`).
- Cities: `src/data/cities/*.ts` (`world-cities.ts`, `lost-cities.ts`, `types.ts`
  `buildCityTopic`+`matchesCityName`, `credits.ts`, `index.ts`).

---

## 4. Gamification patterns (reuse these)

- **Rounds:** shuffle an index order (`shuffle` from `src/utils.ts`), track `position`, mark
  `completed` at the end, show a deck-complete panel with a "Start new shuffled round" button.
- **Scoring variants:**
  - Generic decks: `Score { attempts, correct, streak, bestStreak }` in `App.tsx`, persisted to
    `localStorage['culture-quizzer-scores']`.
  - History Dates: **two independent accuracies** (date, location) — `culture-quizzer-history-scores`.
  - City games: **fail/mid/pass = 0 / 0.5 / 1** points (0 both wrong, 0.5 one wrong, 1 both), plus
    separate Name/Location accuracies — `culture-quizzer-city-scores`.
  - Streak increments only on a full-correct answer; `bestStreak` is the max.
- **Review state:** after answering, show per-part verdicts (✓/✗ + the correct value) and a Next
  action; advance on Enter/Space via a windowed keydown listener (guard against open modals).
- **History list:** keep the last ~20 results with colour by outcome (ok / mid / fail).
- **Reveal / learn-more:** History Dates opens a scrollable summary modal (`EventSummaryDialog`);
  City photos/clue reveal captions + a city blurb after answering.
- Persistence keys are namespaced per game; the global **Reset scores** button in `App.tsx`
  removes all `culture-quizzer-*` score keys — add new keys there.

---

## 5. Matching & fuzzing

- **Shared answer matcher: `src/data/matching.ts`** — `normalizeAnswer` (NFD → strip diacritics
  → lowercase → alnum-space → **strip leading articles** le/la/les/l'/the), `levenshtein`,
  length-scaled `editThreshold` (0/1/2 edits), `fuzzyEquals`, `matchesAnyName`. Landmarks,
  cities and paintings all use it — **never copy-paste a new matcher**. Items should carry
  both English and French name forms; both are accepted regardless of UI language.
- History dates keep their own token/era logic in `src/data/history/matching.ts` (`matchesDate`
  requires the `bc` token for BC answers, accepts range endpoints/interiors; `matchesLocation`
  does windowed token matching).
- **Map location correctness:** `src/map/containment.ts` — `isRegionCorrect` (polygon
  containment), `distanceKm` (haversine), and zone helpers `pointInRing` / `distanceToRingKm` /
  `ringAreaKm2`. Landmark locate uses `evaluateLandmarkLocation`
  (`src/data/landmarks/types.ts`): 40 km radius for points; for `zone` polygons inside = 0 km
  correct, outside tolerance `clamp(40 − √area, 0, 40)` km; **the km distance is always
  reported to the player**.

---

## 6. Maps & geodata

- Shared helpers in `src/map/`: `projection.ts` (`WIDTH/HEIGHT`, `MapView`, `clampMapView`,
  `buildProjection(scope)`), `features.ts` (parsed world-atlas countries + us-atlas states, both in
  **lon/lat**, with name lookups), `containment.ts`.
- The generic map is `CultureMap` in `App.tsx`; the city map is `src/components/CityMap.tsx`
  (world countries + **US-state overlay**, zoom/pan, click → invert → containment).
- **Click handling:** pick on the SVG `onClick` (works with mouse/touch/automation); use pointer
  events only for drag-pan, and suppress the click after a drag. (`CultureMap` picks per-polygon at
  zoom 1 and via pointer-up when zoomed; `CityMap` uses the onClick approach throughout.)
- Atlases: `world-atlas/countries-110m.json` (note: tiny states like Singapore are absent at 110m —
  pick cities whose country has a polygon, or nudge coastal coords inland so region-containment
  passes). US states: `us-atlas/states-10m.json`.
- **Progressive detail layers (France):** `public/geo/roads-fr-{1,2,3}.json` (IGN ROUTE 500
  motorways / trunk / regional, ~1.7 MB gz total) and `public/geo/rivers-fr.json` (Natural
  Earth, 2 ranks). Fetched lazily by `src/map/geoLayers.ts` and revealed by zoom tier in
  `LandmarkMap` (tier 2 at ≥2×, tier 3 at ≥4×). **All name attributes are stripped at build
  time** so layers cannot spoil answers. Rebuild with `scripts/build-france-map-layers.sh`.
- `clampMapView(view, panSlack)` — `panSlack` (fraction of viewport) permits dragging beyond
  the strict fit; `LandmarkMap` passes 0.5 so the map pans at base zoom (e.g. to free Corsica
  from under an overlay).

---

## 7. Images pipeline (city photos)

- Photos live in the repo under `public/images/cities/<id>/`, two sizes per photo:
  `<n>-mini.webp` (≤500px, shown in mosaics/galleries) and `<n>.webp` (≤1200px, shown in the
  lightbox). Served under `import.meta.env.BASE_URL` via `resolveImageUrl` (`src/utils.ts`).
- Sourced from **Wikimedia Commons** by `scripts/prep-city-images.mjs` (dev-only, needs `sharp` and
  network). Landmarks/artefacts per city are listed in `scripts/city-landmarks.mjs` — one
  recognisable photo per named landmark keeps images identifiable. Run:
  `node scripts/prep-city-images.mjs [cityId ...]` (no args = all).
- **Attribution is required.** `public/images/cities/credits.json` records `{artist, license,
  source (Commons page), originalUrl (high-res), term (landmark name)}` per image. The lightbox
  shows the credit; `landmarkLabel` (in `credits.ts`) turns `term` into a caption.
- `CityEntry.images` is the count of photos available; the mosaic picks 3 at random, the gallery
  shows all. Lost cities that lack good imagery can omit `images` (that mode shows a "not available"
  note).
- **Landmark decks use the human-in-the-loop curation protocol** — see
  [docs/photo-curation.md](photo-curation.md): gather ≥ 12 candidates (`scripts/
  gather-landmark-candidates.mjs`), curate in the `npm run curate` app (keep / ⭐ always-include
  / artwork notes), apply (`scripts/apply-photo-curation.mjs`). `credits.json` then carries
  `flagged`, `kind` and artwork caption fields; `LandmarkPhotos` guarantees one flagged photo
  among the three shown and captions paintings *title — painter (year)*.

---

## 8. Course view (Play vs Course)

City topics expose a **Play / Course** toggle (App's `view-control`, gated on `isCityTopic` or a
`courseArticles[id]` entry; `activePageView` state). The course is `src/components/CityCourse.tsx`:

- A sticky **Contents ToC** sidebar (anchors to each city section).
- A **ranking table** (`# | City | Country | Population`) sorted by `CityEntry.population`
  (world = metro population; lost = estimated peak).
- **Read / Pictures sub-tabs**: Read shows the per-city `course` paragraph (full facts + extra);
  Pictures shows `CityGallery` (all photos for that city, click → lightbox).

Knowledge topics use the older `courseArticles` map + `CoursePanel` / `QuestionReferencePanel`
(Practice / Course / Questions tabs). Course text for cities lives in `CityEntry.course`.

---

## 8b. Settings & localisation

- Global settings live in `src/settings.ts` (`useSettings` via `useSyncExternalStore`,
  persisted to `localStorage` key `culture-quizzer-settings`). UI: gear button at the bottom
  of the sidebar → `SettingsDialog` (dark blurred backdrop). Only setting so far: **language
  (en/fr)**.
- Localisation is **per-game and data-driven**, not a global i18n framework:
  `src/data/landmarks/localise.ts` swaps the France deck's names/blurbs/clues/courses from
  `france-landmarks.fr.ts` and retitles the topic; `quiz-strings.ts` carries the quiz UI
  strings. English mode still attaches `nameFr` so typed answers are accepted in both
  languages either way. To localise another game, mirror this pattern (translation file keyed
  by id + a `localise<X>Topic` applied where `activeTopic` is resolved in `App.tsx`).

---

## 9. Conventions

- **British English** everywhere (content and UI).
- **No code comments** unless documenting a genuine edge case (repo house style).
- **One data file per deck**; **one CSS file per component** (kept out of `App.css`).
- Reuse `resolveImageUrl`, `shuffle`, `stripTrailingPunctuation` from `src/utils.ts`.
- Keep `Topic.items` non-empty for self-contained topics (map each entry to a minimal `QuizItem`) so
  App invariants (`pool`, `current`) never see an empty deck.
- `.claude` is ignored by ESLint (`eslint.config.js`) so session worktrees don't break `npm run lint`.

---

## 10. Recipe: add a new self-contained game

1. **Type + payload:** add an entry type (e.g. `FooEntry`) and `Topic.kind: 'foo'` + `foos?:
   FooEntry[]` to `src/data/types.ts`; re-export the type from `curriculum.ts`.
2. **Data:** create `src/data/foo/<deck>.ts` files and `src/data/foo/types.ts` with
   `buildFooTopic(...)` returning a `Topic` (`kind:'foo'`, `group`, `modes`, `items` mapped from the
   payload). Export `fooTopics` from `src/data/foo/index.ts` and spread into `topics` in
   `curriculum.ts`.
3. **Modes:** add any new `QuizMode`s to `src/data/types.ts` and their labels to `defaultModeLabels`
   (App).
4. **Component:** build `src/components/FooQuiz.tsx` (+ CSS) owning its round/score/review/history
   state and persistence key. Reuse map/matching/utils helpers.
5. **Wire App:** add `isFooTopic`, hide the generic score-strip for it, and branch to `<FooQuiz>` in
   the practice render (before the generic branches).
6. **(Optional) Course:** follow `CityCourse` for a Play/Course toggle.
7. **Verify:** `npm run lint`, `npm run build`, `npm run dev`; spot-check pure logic with a quick
   `npx tsx` script. Commit on a branch → PR → merge to `master` (auto-deploys).

---

## 11. Verification & deploy

- `npm run lint` · `npm run build` (runs `tsc -b`) · `npm run dev`.
- Pure functions (matching, containment) are easy to unit-check with a throwaway `npx tsx` script.
- Push to `master` triggers the GitHub Pages build+deploy. The site base path is
  `/culture-quizzer/`; always build URLs through `resolveImageUrl` / `import.meta.env.BASE_URL`.
