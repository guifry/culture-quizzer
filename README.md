# Culture Quizzer

A broad cultural-knowledge quiz app built with React, TypeScript, Vite, SVG maps, and reusable curriculum data.

## What is included

- Countries of the world on a Natural Earth vector map.
- Capital and second-city recall for major countries.
- Historic counties of Scotland and Great Britain as map-target decks.
- Top UK, Scottish, English, and French city map decks.
- French regions and departments with biggest-city prompts.
- US states and capitals.
- Major rivers and mountain ranges.
- Painting recognition with image prompts.
- Political systems for France, the UK, the EU, and the US.
- History outlines, dynasties, empires, battles, and modern France/UK leaders.
- Classical music movements, art movements, sculpture, philosophy, poets, and major books.

The curriculum lives in `src/data/curriculum.ts`. The app is designed so deeper datasets can be added without changing the quiz engine.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173/`.

## Verify

```bash
npm run lint
npm run build
```

Scores are stored in browser `localStorage`.
