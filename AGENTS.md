# @ghostpaw/questlog

A synchronous SQLite library that unifies tasks, calendar commitments, and recurring work.

## Use

Install in a consuming project with `npm install @ghostpaw/questlog` (Node 24+).

```ts
import { DatabaseSync } from 'node:sqlite';
import { initQuestlogTables, read, write } from '@ghostpaw/questlog';

const db = new DatabaseSync('questlog.sqlite');
db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
initQuestlogTables(db);
const quest = write.createQuest(db, {
  title: 'Review release notes',
  objective: 'Check changes against the release.',
});
console.log(read.getQuestDetail(db, quest.id));
db.close();
```

Callers open and close SQLite connections; the library does not open files.
For file-backed databases, enable WAL and set `busy_timeout = 5000` on each
connection as shown above to reduce contention and wait up to five seconds for locks.

The tool facade lives in `src/tools/` and is exported as `tools` from the package root.
Use `tools.questlogTools` or `tools.getQuestlogToolByName('search_questlog')`;
call a tool's `handler(db, input)`. Results contain `ok`, `outcome`, `summary`,
and `entities`. Outcomes are `success`, `no_op`, `needs_clarification`, or `error`;
successes include `data`, clarification results include `clarification`, and
errors include `error`. Optional `warnings` and `next` give further guidance.

## Layout

- `src/index.ts`: public entry; `src/read.ts` and `src/write.ts`: operation namespaces.
- `src/quests/`, `questlines/`, `rumors/`, `repeatable_quests/`, `tags/`,
  `rewards/`, `unlocks/`: domain operations and schemas under `src/`.
- `src/tools/`, `src/skills/`, `src/markers/`, `src/soul.ts`: runtime metadata and workflows.
- `src/lib/`: test database helpers; tests sit beside their source files.
- `docs/`: usage and entity guides; `scripts/`: development checks and demo scripts.
- `dist/`: generated ESM, CommonJS, and declarations; `.github/workflows/`: CI and releases.

## Contribute

Use Node 24; dependencies are already installed in the working environment.
Run the full gate after changes:

```sh
export PATH=/opt/node24/bin:$PATH
npm run lint && npm run typecheck && npm test && npm run build
```

Use `node:test` and `node:assert` in colocated `*.test.ts` files. Assert real
behavior; preserve existing assertions and coverage, without skips or exclusions.
The performance test measures the full workload on three fresh databases and
requires its fastest run to stay below 750 ms to tolerate transient contention.
Keep zero runtime dependencies; `npm run check:deps` verifies this rule.
Do not add dependencies or change public exports, tool names or input fields,
CLI flags, or database schemas incompatibly. Keep synchronous APIs synchronous.
Add changes under `Unreleased` in `CHANGELOG.md`.

Maintainers release with `npm run release:patch` or `npm run release:minor`.
These commands increment the version, create a tag, and push commits and tags;
the tag triggers CI verification and npm publication with provenance.
Leave review changes uncommitted; do not run release or deployment commands during a sweep.
