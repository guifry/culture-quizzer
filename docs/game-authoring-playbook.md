# Playbook — building a curated "Top-N" recognition game

A reusable methodology for creating games like **Top 30 World Cities**, **Top 20 Lost Cities**
and **Top 32 UK Landmarks**: a curated deck of N items, played three ways (**locate / photos /
clue**), backed by a **course** the player can study first. Follow this to spin up new decks
(e.g. Top 30 World Composers, Top 30 Famous Battles, Top 25 World Religions Sites) with
consistent quality. Worked reference implementation: the UK Landmarks game
(`src/data/landmarks/`, `src/components/Landmark*.tsx`, `scripts/*landmark*`,
[docs/uk-landmarks.md](uk-landmarks.md)).

---

## 1. Curation — "what constitutes the Top N"

Three heuristics people use, and what each optimises for:

| Heuristic | Picks by | Weakness |
|-----------|----------|----------|
| **Authority** | what critics / institutions rank | can be obscure or academic |
| **Social currency** | what everyone already knows | rewards shallow pop-trivia |
| **Heritage / significance** | what carries real historical/cultural depth | can miss the universally-famous |

**The rule we use** (tune per domain, but keep the shape):

> **Rank by significance-depth** — an item earns its place because it *carries a story worth
> learning* (a period, a movement, a person, an event). Then **force-include a "universal
> floor"**: the handful of items so famous that not knowing them signals ignorance, even if
> their depth is shallow. Exclude pure pop-trivia with neither depth nor near-universal fame.

This makes depth the *ranking* axis and fame a *floor filter* — the anti-trivia stance (see §2).

**Selection constraints** (adapt to the domain):
- **Playable by the modes.** If there's a *locate* mode, every item must be a real point on the
  chosen map; if there's a *photos* mode, it must be photographable and recognisable. Prefer a
  specific, depictable thing over an abstraction (a *building*, not "a city"; a *portrait/place*,
  not "a concept").
- **Genre/category spread** so the course teaches breadth, not one flavour (e.g. landmarks span
  prehistoric / Roman / ecclesiastical / castle / industrial / natural).
- **Sub-domain balance.** If the domain has natural sub-parts, represent them fairly (UK →
  England/Scotland/Wales/NI; a "world" deck → continents). Cap any dominant hub (London was
  capped at ~8) so it doesn't eat the list.
- **Don't omit something famous because it's hard to draw/place** — upgrade the data (higher-res
  map, add a feature) rather than dropping knowledge.

**Sizing.** Exact N is flexible — grow it rather than make painful cuts. Overlapping tiers
(e.g. an "Essentials 10") should be a **flag on the items, not a second game**: mark the floor
with `essential: true` and render a ★ cue. A separate smaller game only earns its place if the
short deck is a distinct *experience* (cf. Top 20 vs Top 30 cities).

**Deliverable of this phase:** a ranked list (thematically grouped) with the ★ subset marked,
signed off by the user *before* authoring. Capture it in a `docs/<game>.md` draft.

---

## 2. Course methodology — knowledge with meaning, not rote

The point of the course is understanding, not memorising facts in isolation. Two mechanisms
enforce this:

**a) Author every entry against fixed angles** (include only those that apply):

| Angle | Forces you to state |
|-------|---------------------|
| **Nutshell** | one narrative that ties it together (2–3 sentences) |
| **When** | period + date, and *name the era* (define it) |
| **Who** | the people / culture / belief |
| **People** | key named figures + their role |
| **Events** | the pivotal event **and why it happened** |
| **Concepts** | the transferable terms to *define* (glossary keys) |

**b) A shared glossary.** Recurring periods/styles/concepts (Georgian, Neolithic, Gothic, a war,
a movement) are defined **once** in a glossary and referenced by key from many entries. This is
the engine that turns trivia into transferable knowledge — "X is Georgian" only *means*
something if "Georgian" is defined and reused. Every `concepts` key must resolve to a glossary
term (validate it; see §7).

**Length:** ~120–180 words + labelled points per item. Straightforward, essential, quick to
learn.

**The course is a superset of the clues.** Author it independently and completely; the clue mode
only draws on a subset. This keeps room for a future deeper mode (e.g. an LLM-graded free-text
quiz that reads the whole course as context).

---

## 3. Clue methodology

- **4–5 clues per item** (vary by how much the item supports).
- **Each clue is self-sufficient** — in the game a *random* one is shown alone, so it must
  identify the item by itself.
- **Each clue takes a different angle** (geographic, personality, event/why, concept/era,
  cultural) so replay feels fresh and reinforces breadth.
- **Never name the item** or give it away lazily; tie each clue to a *reason or concept*, not a
  bare fact.
- **Derived from the course** (which carries more than the clues ever test).

---

## 4. Photo methodology (Wikimedia + AI spoiler gate)

- **Same-item, multi-angle pattern.** Each item gets ~8 Commons search terms that all depict
  *that item* from varied angles/features (this is the *Lost Cities* pattern, not the *World
  Cities* pattern where each photo is a different landmark).
- **Giveaway list per item**: its name, aliases, and *giveaway sub-features* (e.g. Hadrian's Wall
  → `Housesteads, Vindolanda`; Loch Ness → `Nessie, Urquhart`).
- **gpt-4o vision gate** screens every candidate for (1) is it really the item, (2) does readable
  text name it / a giveaway, (3) is it a usable photo. Run at `temperature:0`, image
  `detail:"high"` (needed to read small signage → no missed detections), forcing the model to
  **quote the offending text** (grounding → no false flags). The crafted prompt lives in
  `scripts/prep-landmark-images.mjs` — copy it.
- **Skip rather than spoil.** If no clean, non-naming shot exists, leave the slot empty (some
  items ship with < target count, e.g. Titanic Belfast). The UI derives the count from
  `credits.json`, so no per-item image count lives in the data.
- **Cost:** a full run (~250–500 gated candidates) is roughly **$2–4** on gpt-4o. Key is read
  from `.env` (`OPENAI_API_KEY`), which must be git-ignored.
- **Attribution** (artist/license/source) is captured to `credits.json` and shown in the
  lightbox — keep it.

---

## 5. Architecture pattern — the "self-contained variant"

A game that doesn't fit the generic per-item engine gets its own `Topic.kind`, is skipped by the
engine's guards in `App.tsx`, and renders its own components. Mirror the landmarks build:

**Data** (`src/data/<domain>/`):
- `<domain>.ts` — the `Item[]` (name, aliases, lat/lon or map target, `essential`, `mapBlurb`,
  structured `course`, `clues[]`).
- `glossary.ts` — `GlossaryTerm[]` + a `byKey` map.
- `types.ts` — a `build<Domain>Topic(...)` helper, a fuzzy name matcher, and a correctness check
  (proximity for point-locate, polygon containment for region games).
- `credits.ts` — loads `/images/<domain>/credits.json`.
- `index.ts` — exports the topic(s).
- Extend `src/data/types.ts` with the item type, the new `QuizMode`s, and the new `Topic.kind`
  (+ optional `items?`/`glossary?` fields). Register in `curriculum.ts`.

**Components** (`src/components/`): `<Domain>Quiz`, `<Domain>Map` (locate), `<Domain>Course`
(Read/Pictures/Map tabs + glossary), `<Domain>Atlas` (bird's-eye map with clustering + popups),
`<Domain>Gallery`, `<Domain>Photos`. **Reuse the city CSS** (`import './CityQuiz.css'` /
`'./CityCourse.css'`) so styling stays consistent; add one small `<Domain>Course.css` for
whatever is new.

**Wire into `App.tsx`** by mirroring the city game exactly:
- add an `isXTopic(topic)` guard and fold it into the shared `isCoursePairTopic` helper;
- add the new modes to `defaultModeLabels`;
- add a dispatch branch (`isXTopic ? <XQuiz/> : …`) and a course branch
  (`activePageView === 'course' && isXTopic ? <XCourse/> : …`).
- Note: cities have a dedicated *mobile* self-contained layout; a new game either implements the
  same mobile props on its `Quiz` component or (simpler) falls back to the responsive workspace on
  mobile — do this deliberately.

**Scripts** (`scripts/`): `<domain>-photos.mjs` (terms + giveaways) and
`prep-<domain>-images.mjs` (fetch → gate → WebP → credits).

---

## 6. Standing conventions (from CLAUDE.md — never re-ask)

- **Always randomise** deck/prompt order every session (learning, not memorising a script). Pick
  clues randomly per encounter too.
- For **region/polygon** games, item names MUST match the source atlas `properties.name` exactly
  (dump the atlas list first).
- **Scores persist to `localStorage`, keyed per topic (+ mode).** Own score book, own score-strip,
  own "Start new shuffled round" on completion.
- **British English. No code comments** unless documenting a genuine edge case.
- **Verify** before done: `npm run lint`, `npm run build`, and a browser smoke test.

---

## 7. Definition of done (acceptance checklist)

- [ ] Final ranked list signed off by the user; ★ subset marked.
- [ ] Every item: name + aliases, map target, `mapBlurb`, structured `course`, 4–5 `clues`.
- [ ] Every `concepts` key resolves in the glossary; no orphan glossary terms (validate by script).
- [ ] All three modes work; clue mode shows a random self-sufficient clue; photos degrade
      gracefully when absent.
- [ ] Course renders Read / Pictures / Map; atlas markers, clustering, popups, "Learn more →" work.
- [ ] Photos fetched + AI-gated; `credits.json` present; attribution shown; short items logged,
      not silently dropped.
- [ ] `npm run lint` + `npm run build` clean; browser smoke test passes; no console errors.
- [ ] Committed and pushed to master (deploys Pages).

---

## 8. Kickoff prompt for another agent

> Build a new "Top N <domain>" game for Culture Quizzer following
> `docs/game-authoring-playbook.md`. It behaves exactly like the UK Landmarks game (locate /
> photos / clue + a course). First, **agree the list with me** using the §1 curation rule
> (rank by significance-depth, force-include the universal floor, cap dominant hubs, balance
> sub-domains) — propose it and wait for sign-off. Then author the course (§2 structured angles +
> shared glossary, ~120–180 words each) and 4–5 clues per item (§3). Then implement the
> self-contained variant (§5), mirroring `src/data/landmarks/` and `src/components/Landmark*.tsx`.
> Then fetch + AI-gate photos (§4). Verify against the §7 checklist and, on my go-ahead, commit
> and push. Keep the standing conventions (§6): always randomise, British English, no comments.
