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
- History date decks (World, France, UK, Poland) played both ways with a "Learn more" summary.
- Classical music movements, art movements, sculpture, philosophy, poets, and major books.
- Top 30 World Cities and Top 20 Lost Cities: locate on the map, name from photos, or from a cultural clue, each with a Course section.

The curriculum lives in `src/data/curriculum.ts`. The app is designed so deeper datasets can be added without changing the quiz engine.

## Adding or changing games

See **[docs/GAME_ARCHITECTURE.md](docs/GAME_ARCHITECTURE.md)** for the game types, reusable
templates, gamification patterns (rounds, scoring, matching), the map/geodata and image pipelines,
the Course view, and a step-by-step recipe for adding a new game. Read it before contributing a
new game.

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
