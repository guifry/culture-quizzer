# Culture Quizzer UX Audit and Fix Plan

Date: 2026-05-23
Branch: `codex/ux-audit-fixes`

## Learner Persona

The app is for a learner who wants broad cultural knowledge through quick repetition. They do not want to maintain data, debug deployments, or understand app internals. The app should be fast, correct, easy to use, responsive, and good at preserving useful state. The game surface should dominate the interface. Low-value chrome should not crowd out the quiz.

## Audit Notes

### Highest Priority

- Painting images are broken in production on GitHub Pages. The app requests root-relative image URLs such as `/images/paintings/mona-lisa.jpg`, which resolve outside `/culture-quizzer/`.
- Mobile layout is effectively unusable. At phone width, the whole sidebar appears before the quiz, forcing a learner to scroll through all topics before reaching the game.
- French overseas regions/departments can be asked while the map only shows metropolitan France, making some click-location prompts impossible or misleading.
- Several decks remain much smaller than the stated learning ambition: politics, music, philosophy/books, paintings, history, and art movement decks need enough coverage to be useful.

### Map UX

- Map games work but the default map surface is small relative to the page.
- The score strip, title/header, mode buttons, and quiz panel take substantial space before the learner reaches the map.
- Tiny countries and dense administrative areas remain hard to click at the default zoom level.
- Point-based maps are fast but sometimes less educational than polygon-based maps. For states/counties/departments, real area boundaries are preferable when available.
- Historic counties are conceptually mixed with modern boundary outlines; that needs clearer wording if the data remains as-is.

### Navigation and State

- Switching topics does not consistently reset scroll position, so lower topics can open with the title/header partially out of view.
- The sidebar scrolls independently and can disconnect the learner from the active game.
- Reset scores is global and immediate. It should not be so easy to wipe all progress accidentally.
- A single shuffled deck should apply at the game/topic level, and every completed pass or page refresh should create a fresh order. This is already implemented and should be preserved.

### Quiz Flow

- Typed answers have a good loop: Enter submits, Enter/Space advances, and focus returns to the input.
- Multiple-choice answers remain visually clickable after review. They should be disabled or visually locked while waiting for next.
- Some answer text has awkward punctuation or truncation, for example `Bosnia and Herz..`.
- The history list is useful but can grow visually dense; a compact last-result area plus history may eventually be better.
- Feedback facts are useful, especially for mountains, but the formatting should stay separate from success/failure cards.

### Course and Learning Content

- Course panels are useful but shallow. They should teach enough before testing: short outline, core terms, key examples, timeline/order where relevant.
- For politics, history, philosophy, music, and art, the app needs stronger study material alongside the quiz.
- Some time-sensitive knowledge needs visible "last reviewed" wording and a clear update path.

### Solar System

- The planet-order game is promising and different from Q&A.
- On desktop the planet row can horizontally overflow, hiding later planets. Since the core task is order memorization, all eight planet slots should fit in view.
- The asteroid belt prompt is good because it does not reveal the answer visually.

## Vertical Slices

### Slice 1: Production Asset Paths and Painting Recognition

Goal: Make painting recognition work on the deployed GitHub Pages app and locally.

In scope:
- Fix image URLs so Vite respects the GitHub Pages base path.
- Ensure both the large image prompt and any quiz-panel images load.
- Improve image prompt layout if the loaded painting is too small or cropped badly.

Acceptance criteria:
- On `https://guifry.github.io/culture-quizzer/`, painting images resolve under `/culture-quizzer/images/...`.
- The painting page shows a visible painting, not broken-image alt text.
- `npm run lint` and `npm run build` pass.

### Slice 2: Mobile Navigation and Responsive Practice Layout

Goal: Make the app usable on phone-sized screens.

In scope:
- Add a mobile-first topic selector or collapsible navigation so the quiz appears quickly.
- Ensure the score strip, map/image/course area, and quiz panel stack cleanly.
- Ensure map controls and answer inputs remain reachable without horizontal page overflow.

Acceptance criteria:
- At 390x844 viewport, the learner can see the active topic title and game area without scrolling through the entire sidebar first.
- There is no horizontal page overflow.
- All topic navigation remains available.
- Desktop layout remains intact.

### Slice 3: Map Layout, Impossible Prompts, and Scroll State

Goal: Make map games easier and remove misleading/impossible map prompts.

In scope:
- Reset page scroll to top when switching topics.
- Increase the default map surface where possible, especially desktop map games.
- For French departments/regions, prevent overseas items from appearing in map-click or map-type modes unless their geography is represented.
- Keep typed/multiple-choice overseas questions if they are answerable without map location.
- Clarify historic county wording if modern boundaries are used as reference.

Acceptance criteria:
- Topic switches show the new title/header from the top.
- France map-click prompts only ask visible metropolitan entities, or the map represents overseas entities.
- Map pages allocate more space to the map without burying quiz controls.
- `npm run lint` and `npm run build` pass.

### Slice 4: Quiz Review States and Safer Reset

Goal: Reduce clunkiness and prevent accidental destructive state changes.

In scope:
- Disable or visually lock multiple-choice options after a submission while awaiting next.
- Improve answer formatting to avoid double punctuation and awkward labels.
- Add confirmation for global score reset.
- Preserve the existing Enter/Space next behavior.

Acceptance criteria:
- After selecting a multiple-choice answer, the options are not interactively misleading.
- Wrong/correct feedback reads cleanly.
- Reset scores requires confirmation before clearing progress.
- Typed and map quiz keyboard flows still work.

### Slice 5: Course Depth and Deck Coverage

Goal: Improve usefulness of non-map learning topics.

In scope:
- Expand course panels and decks for politics, art movements/sculpture, history, music, philosophy/poetry/books.
- Add enough questions for meaningful repetition without pretending to be exhaustive.
- Keep content high-level, accurate, and concise.

Acceptance criteria:
- Each theory topic has a visibly useful course panel with structured anchors.
- Each small theory deck is expanded substantially from the current prototype size.
- Questions remain clear, not tricked by ambiguous answer wording.
- `npm run lint` and `npm run build` pass.

### Slice 6: Solar System Layout Polish

Goal: Make the solar-system order quiz fit its task better.

In scope:
- Ensure all eight planets and input fields are visible or comfortably navigable.
- Make the horizontal order task responsive without hiding key fields on desktop.
- Preserve the asteroid belt question.

Acceptance criteria:
- At desktop width, all eight planets are visible without horizontal scrolling.
- At mobile width, the interaction remains usable.
- Clear still clears messages and coloring.

## Cross-Slice Invariants

- Do not break the single shared deck order per topic.
- Do not persist deck order; refresh should create a fresh order.
- Do not remove existing score persistence.
- Do not add backend services unless absolutely necessary.
- Do not commit, push, or deploy from delegated agents.
- Codex remains final reviewer and committer for each slice.
