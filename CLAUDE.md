# Culture Quizzer — agent guide

React + TypeScript + Vite quiz app. SVG maps (d3-geo + world-atlas / us-atlas / local GeoJSON), reusable curriculum data.

> Building a new curated "Top-N" recognition game (locate / photos / clue + course)? Follow `docs/game-authoring-playbook.md` — curation heuristic, course/clue/photo methodology, matching + map-interaction standards, and the self-contained-variant architecture. Reference implementation: the France Landmarks game (`src/data/landmarks/`, `src/components/Landmark*.tsx`).
> Quiz images are NEVER AI-final: gather → human curates in `npm run curate` → apply. Protocol: `docs/photo-curation.md`.

## Layout
- `src/data/curriculum.ts` — master `topics: Topic[]`. Register new topics here.
- `src/data/types.ts` — `Topic`, `QuizItem`, `QuizMode`, `ColonyRelation`, etc.
- `src/data/geo/` — map datasets (boundary GeoJSON, colonies).
- `src/data/history/` — history-date decks + a `buildHistoryTopic` helper.
- `src/App.tsx` — the shared quiz engine (per-item shuffle rounds) + `CultureMap`.
- `src/components/` — self-contained game variants that don't fit the per-item engine (`HistoryDateQuiz`, `ColoniesQuiz`), each rendered via a `Topic.kind` branch in `App.tsx`.
- `src/components/worldMap.ts` — shared world-map primitives (projection, feature list with French Guiana split, `normalizeName`, pan/zoom `clampMapView`).
- `src/data/matching.ts` — THE shared answer matcher (diacritics, leading-article stripping, fuzzy). Never duplicate it.
- `src/settings.ts` + `SettingsDialog` — global settings (language en/fr); per-game localisation via `src/data/landmarks/localise.ts` pattern.
- `tools/photo-curation/` + `scripts/{gather-landmark-candidates,apply-photo-curation,serve-curation}.mjs` — image curation pipeline (`docs/photo-curation.md`).

## Conventions (do not re-ask the user these)
- **Always randomise order.** Every deck/round shuffles its items/prompts each session (`shuffle`). The goal is learning — a fixed script lets the user memorise the sequence instead of the content. This applies to any new game.
- Country names in datasets MUST match the world-atlas 110m `properties.name` exactly (e.g. `United States of America`, `Dem. Rep. Congo`, `Côte d'Ivoire`, `Eq. Guinea`, `Timor-Leste`). Dump the list from `world-atlas/countries-110m.json` before authoring map data.
- Scores persist to `localStorage`, keyed per topic (+ mode where relevant). New self-contained games follow the `HistoryDateQuiz`/`ColoniesQuiz` pattern: own score book, own `score-strip`, own shuffled round + "Start new shuffled round" on completion.
- A game that doesn't fit the per-item engine gets a `Topic.kind`, is skipped by the map/score-strip/control-bar guards in `App.tsx`, and renders its own component.
- British English. No code comments unless documenting a genuine edge case.

## Colonies game (`src/data/geo/colonies.ts`, `ColoniesQuiz.tsx`)
- Per empire, click every present-day country it once ruled, press Space to check. Optional expert toggle adds a year-lost input per correct pick.
- Editorial rules are frozen in the dataset header: a country may appear under several colonisers; category (colony/protectorate/mandate/settler) is blurred into a display `note` pill, never quizzed; `lostYear` = year that power lost control, `independenceYear` only when it differs; settler states included.
- Stage 2 (not yet built): the `current` territories subset. If a territory is missing from the 110m atlas, upgrade the map data (higher-res atlas / added feature) rather than dropping it — never omit knowledge because it's hard to draw.

## Verify
```bash
npm run lint
npm run build
```
