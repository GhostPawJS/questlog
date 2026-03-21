# QuestLog

RPG-flavored productivity engine for Node.js — a fully RPG-themed task and calendar system built on SQLite, designed with the precision and structure of a WoW quest system.

## Requirements

- Node.js ≥ 24 (uses the built-in `node:sqlite` module)

### Node version in this repo

The toolchain is pinned to **24.14.0** (same files, one source of truth):

| File | Used by |
|------|---------|
| [`.nvmrc`](./.nvmrc) | **nvm**, **fnm**, GitHub Actions (`setup-node` + `node-version-file`) |
| [`.node-version`](./.node-version) | **nodenv**, **fnm** |
| [`.tool-versions`](./.tool-versions) | **asdf** (`nodejs` plugin) |
| [`mise.toml`](./mise.toml) | **mise** |
| [`package.json` `volta`](./package.json) | **Volta** |

After `cd` into the clone, you should see **v24.14.0** (not your global default):

```bash
node -v   # v24.14.0
```

**nodenv** — ensure your shell loads shims (zsh example):

```bash
eval "$(nodenv init -)"
```

If `24.14.0` is missing: `nodenv install 24.14.0`

**nvm** — typical `~/.zshrc` snippet:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Then from the repo: `nvm install` (reads `.nvmrc`).

**asdf** — `asdf install` in the repo root picks up `.tool-versions` (requires `asdf plugin add nodejs` once).

**mise** — `mise install` reads `mise.toml`.

## Install

```bash
npm install @ghostpaw/questlog
```

## Public API

- **`initQuestlogTables(db)`** — create the full SQLite schema (FTS, indexes).
- **`read` / `write`** — namespaces mirroring the former `api/read` and `api/write` barrels.
- **Feature modules** — re-exported from the package root (`quests`, `questlines`, `rumors`, `repeatable_quests`, `rewards`, `tags`, `unlocks`, `searchQuestlog`, …).

Design notes live under [`docs/`](./docs/).

## Development

Requires **Node.js ≥ 24** on your machine (same as production): `node:sqlite` is not available on older runtimes, so **`npm test` will fail** until you use the version in [`.nvmrc`](./.nvmrc).

```bash
npm install
npm run build       # compile ESM + CJS + declarations
npm run dev         # watch mode
npm run test        # node:test with dot reporter
npm run lint        # biome check
npm run typecheck   # tsc --noEmit
```

## License

MIT
