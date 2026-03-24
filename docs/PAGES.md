# Interactive Demo

An interactive browser-based SPA that lets you explore Questlog without
installing anything. The entire library runs client-side against an in-memory
SQLite database via sql.js (WebAssembly).

**Live:** <https://ghostpawjs.github.io/questlog>

## What It Covers

| Page      | Route       | Description                                              |
| --------- | ----------- | -------------------------------------------------------- |
| Dashboard | `/`         | Summary cards, marker overview, quick navigation         |
| Intake    | `/intake`   | Capture rumors, settle them into quests, dismiss/reopen  |
| Quests    | `/quests`   | Tabbed quest views, detail panel, lifecycle actions       |
| Planning  | `/planning` | Questlines, repeatables, unlock dependencies             |
| Search    | `/search`   | FTS5 full-text search across quests and rumors           |

The demo ships with a rich seed scenario ("Indie Game Studio, 3 Weeks to
Launch") that populates all entity types, lifecycle states, and marker
variants. You can also reset to a blank database and build your own scenario.

## How It Works

```
sql.js WASM  →  BrowserQuestlogDb adapter  →  Questlog library code  →  Preact SPA
```

A thin `BrowserQuestlogDb` class implements the `DatabaseSync` shape
(`exec`, `prepare` → `run`/`get`/`all`) over sql.js. The entire Questlog
library — including all tool handlers, FTS5 search, and marker derivation —
runs unmodified in the browser.

Seed data is inserted through the same tool handlers that LLMs would use,
proving the tool surface works end-to-end.

## Architecture

- **UI framework:** Preact (3KB gzipped)
- **Database:** sql.js-fts5 (SQLite compiled to WebAssembly with FTS5)
- **Bundler:** esbuild (single ESM bundle, CSS inlined in HTML shell)
- **Routing:** Hash-based (`location.hash`)
- **State:** Preact context with a revision counter for reactive re-renders
- **Styling:** Cyberpunk RPG theme with WoW-style quest markers as the visual hero

## Local Development

```bash
npm run demo:build     # Build once → demo/
npm run demo:watch     # Rebuild on changes
npm run demo:serve     # Build + serve at http://localhost:4173
```

## Deployment

The demo auto-deploys to GitHub Pages on every push to `main` via
`.github/workflows/pages.yml`. The workflow:

1. Installs dependencies
2. Runs `npm run demo:build`
3. Uploads the `demo/` directory as a Pages artifact
4. Deploys via `actions/deploy-pages@v4`
