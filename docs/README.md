# Quest Faculty

Standalone SQLite-backed quest faculty for intake, commitments, questlines, hard prerequisites, recurrence, tags, rewards, and read models.

## What This Package Is

This faculty is designed as a standalone app engine, not as a Ghostpaw-specific subsystem:

- rumors handle open-ended intake
- quests handle real commitments
- questlines group related work and may provide a shared due date
- unlocks model hard prerequisites
- repeatable quests spawn new concrete quest rows
- rewards stay generic and descriptive
- tags stay quest-only and normalized

All public entrypoints receive a SQLite handle through DI. The faculty never opens or owns the database itself.

## Layout

The faculty is organized by feature, not by technical type:

- `rumors/`: rumor entity, schema init, operations, reads, and tests
- `questlines/`: questline entity, schema init, operations, reads, and tests
- `quests/`: quest entity, derived state, operations, read models, and tests
- `repeatable_quests/`: recurring definitions, RRULE helpers, spawning, and tests
- `unlocks/`: hard-prerequisite graph behavior and tests
- `rewards/`: quest reward and reward-template behavior and tests
- `tags/`: normalized tagging behavior and tests

Only cross-cutting composition lives at the faculty root:

- `index.ts`: public barrel
- `init_quest_faculty_tables.ts`: schema composition
- `search_quest_faculty.ts`: cross-feature FTS query
- small shared validation/transaction/DI primitives

## Public Surface

Start with `initQuestFacultyTables()`.

Then choose the surface you want:

- `index.ts`: full faculty barrel
- `api/read/index.ts`: read-only query surface
- `api/write/index.ts`: write-only operational surface

```ts
import { openTestDatabase } from "../../lib/index.ts";
import {
  captureRumor,
  createQuest,
  getQuestDetail,
  initQuestFacultyTables,
  settleRumor,
} from "./index.ts";

const db = await openTestDatabase();
initQuestFacultyTables(db);

const rumor = captureRumor(db, {
  title: "Plan launch week",
  details: "Need copy, deploy, and review tasks.",
});

const settled = settleRumor(db, rumor.id, {
  questline: { title: "Launch Week" },
  quests: [
    { title: "Write copy", objective: "Draft the launch announcement" },
    { title: "Deploy site", objective: "Ship the new site version" },
  ],
});

const detail = getQuestDetail(db, settled.quests[0].id);
```

## Key Guarantees

- quest state is derived from timestamps plus success
- rumor state is derived from settlement and dismissal timestamps
- objectives freeze on actual start, not on planned time
- scheduled time never auto-starts a quest
- recurrence spawns new quest rows and never reopens old ones
- spawned recurring quests keep both repeatable origin and recurrence anchor
- availability logic stays inside the faculty
- soft-deleted spawned quests still block recurrence deduplication
- full-text search is part of the foundation

## Read the Package Docs

- `SPEC.md`: ontology, lifecycle, invariants, workflows, and non-goals
- `SCHEMA.md`: table-by-table schema and indexing reference
- `API.md`: public operations, read models, and scheduling semantics
- `OPERATIONS.md`: intention-shaped write semantics and guarantees
- `SEARCH.md`: FTS scope, indexing, and result shape
- `REWARDS.md`: reward and reward-template semantics
- `TAGS.md`: normalized tag and tag-template semantics
- `SOUL.md`: dedicated quest soul design and Ghostpaw integration plan

## Test Behavior Matrix

The colocated test suite covers:

- schema creation and search visibility under soft delete
- rumor capture, dismissal, reopening, and settlement
- questline creation, updates, archive, and regrouping
- quest creation, planning, objective freezing, effort logging, resolution, and follow-up spawning
- repeatable quest creation, update, anchor listing, deduplicated spawning, and template copying
- unlock availability and cycle rejection
- reward update/claim rules
- tag normalization and replacement semantics
- read models for provenance, effective due dates, blocked work, active work, deferred work, scheduled work, missed work, and search
- recurrence invariants for future-only template edits and deduplication after soft delete
- representative in-memory performance proof for millisecond-scale workloads

Run validation with:

```bash
npm run lint -- "src/faculties/quests"
npm run typecheck
npm test -- "src/faculties/quests/**/*.test.ts"
```
