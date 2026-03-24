# @ghostpaw/questlog

[![npm](https://img.shields.io/npm/v/@ghostpaw/questlog)](https://www.npmjs.com/package/@ghostpaw/questlog)
[![node](https://img.shields.io/node/v/@ghostpaw/questlog)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@ghostpaw/questlog)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Live Demo](https://img.shields.io/badge/demo-live-06d6a0?style=flat&logo=github)](https://ghostpawjs.github.io/questlog)

A unified task and calendar model for Node.js, built on SQLite.

Questlog treats tasks, events, deadlines, recurring commitments, and loose intake as one coherent data model instead of separate systems. It ships as a single prebundled blob with zero runtime dependencies, designed for two audiences at once: human developers working directly in code, and LLM agents operating through a structured tool facade.

## Install

```bash
npm install @ghostpaw/questlog
```

Requires **Node.js 24+** (uses the built-in `node:sqlite` module).

## Quick Start

```ts
import { DatabaseSync } from 'node:sqlite';
import { initQuestlogTables, read, write } from '@ghostpaw/questlog';

const db = new DatabaseSync(':memory:');
initQuestlogTables(db);

// Capture incoming work as a rumor before committing to shape
const rumor = write.captureRumor(db, {
  title: 'Legal says the vendor terms changed',
  details: 'Need to understand pricing delta and termination clause.',
});

// Settle the rumor into real work once the shape is clear
write.settleRumor(db, rumor.id, {
  settledAt: Date.now(),
  questline: {
    title: 'Vendor Renewal',
    description: 'Commercial, legal, and approval work.',
  },
  quests: [
    { title: 'Collect redlines', objective: 'Obtain the latest legal markup.' },
    { title: 'Review pricing delta', objective: 'Compare current vs. proposed cost.' },
  ],
});

// Drive the day from derived views, not from memory
const available = read.listAvailableQuests(db);
const dueSoon = read.listDueSoonQuests(db, 7 * 24 * 60 * 60 * 1000);
const results = read.searchQuestlog(db, 'vendor');
```

## The Model

Seven concepts, strict separation of concerns:

| Concept | Purpose |
|---|---|
| **Rumor** | Incoming signal that may or may not become real work |
| **Questline** | Shared context and rollup for a group of related quests |
| **Quest** | One concrete commitment with lifecycle, timing, and outcome |
| **Repeatable Quest** | Recurring template that spawns fresh quests on a schedule |
| **Unlock** | Hard prerequisite: quest B stays blocked until quest A succeeds |
| **Reward** | Descriptive outcome attached to completed work, with a claim lifecycle |
| **Tag** | Cross-cutting label for filtering and reporting |

The unified model means one entity type covers every temporal intention:

| What it looks like | What it actually is |
|---|---|
| A todo item | A quest with no temporal metadata |
| A deadline | A quest with `dueAt` |
| A calendar event | A quest with `scheduledStartAt` and `scheduledEndAt` |
| A recurring commitment | A repeatable quest with an RRULE |
| A completed action | A quest resolved via `finishQuest` |

State is derived, not toggled. A quest's availability comes from its lifecycle, timing fields, and unlock graph — computed at read time, never stored as a status flag.

### Lifecycle at a glance

Questlog computes WoW-style markers on every read. They change as work moves through its lifecycle:

&nbsp;

> **Intake**
>
> | | | |
> |:---:|---|---|
> | $\color{Goldenrod}{\textsf{❗}}$ | *Legal says the vendor terms changed* | `rumor · open` |
> | | &darr; &ensp; settle into questline + quests | |
>
> **Quest progression**
>
> | | | |
> |:---:|---|---|
> | $\color{Goldenrod}{\textsf{❗}}$ | *Review pricing delta* | `open · available` |
> | $\color{Gray}{\textsf{❓}}$ | *Review pricing delta* | `in progress` |
> | $\color{Goldenrod}{\textsf{❓}}$ | *Review pricing delta* | `done · reward unclaimed` |
> | &ensp; ✓ &ensp; | *Review pricing delta* | `done · reward claimed` |
>
> **Other markers**
>
> | | | |
> |:---:|---|---|
> | $\color{CornflowerBlue}{\textsf{❗}}$ | *Weekly standup notes* | `repeatable · due` |
> | $\color{Gray}{\textsf{❗}}$ | *Plan Q3 roadmap* | `open · deferred` |
> | $\color{Gray}{\textsf{❓}}$ | *Obtain finance approval* | `open · blocked` |

&nbsp;

Marker IDs are semantic strings (`attention.available`, `progress.complete`, ...) computed at read time, never stored. The `markers` namespace maps each to its symbol, color, label, and CSS class for consistent rendering across HTML, TTY, and plain text.

## Two Audiences

### Human developers

Use the `read` and `write` namespaces for direct-code access to every domain operation:

```ts
import { read, write } from '@ghostpaw/questlog';

write.createQuest(db, { title: 'Ship release notes', objective: 'Draft and publish.' });
write.startQuest(db, questId);
write.finishQuest(db, questId, 'Published to blog and changelog.');

const blocked = read.listBlockedQuests(db);
const overdue = read.listOverdueQuests(db);
```

See [HUMAN.md](docs/HUMAN.md) for the full human-facing guide with worked examples.

### LLM agents

Use the `tools`, `skills`, and `soul` namespaces for a structured runtime surface designed to minimize LLM cognitive load:

```ts
import { tools, skills, soul } from '@ghostpaw/questlog';

// 12 intent-shaped tools with JSON Schema inputs and structured results
const allTools = tools.questlogTools;
const searchTool = tools.getQuestlogToolByName('search_questlog')!;
const result = searchTool.handler(db, { query: 'vendor', mode: 'browse' });

// 25 reusable workflow skills for common multi-step scenarios
const allSkills = skills.questlogSkills;

// Thinking foundation for system prompts
const prompt = soul.renderQuestlogSoulPromptFoundation();
```

Every tool returns a discriminated result with `outcome: 'success' | 'no_op' | 'needs_clarification' | 'error'`, structured entities, next-step hints, and actionable recovery advice. No thrown exceptions to parse, no ambiguous prose.

See [LLM.md](docs/LLM.md) for the full AI-facing guide covering soul, tools, and skills.

## Tools

Twelve tools shaped around operator intent, not raw storage operations:

| Tool | What it does |
|---|---|
| `search_questlog` | Cross-entity full-text search |
| `review_questlog` | Filtered list views (available, overdue, due soon, ...) |
| `inspect_questlog_item` | Detailed inspection of any single entity |
| `capture_rumor` | Record incoming work before committing to shape |
| `shape_work` | Create quests, questlines, settle rumors into structure |
| `plan_quest` | Set timing: due dates, defer dates, scheduled windows |
| `run_quest` | Start, finish, abandon, log effort |
| `organize_work` | Move quests between questlines, manage questline lifecycle |
| `manage_repeatable` | Create and maintain recurring quest templates |
| `tag_work` | Classify quests and repeatables with tags |
| `reward_work` | Attach, update, claim, or remove rewards |
| `retire_work` | Soft-delete or archive things that should leave the active surface |

Each tool exports runtime metadata — name, description, JSON Schema, input descriptions, side-effect level — so agent harnesses can wire them without reading docs.

## Key Properties

- **Zero runtime dependencies.** Only `node:sqlite` (built into Node 24+).
- **Single prebundled blob.** One ESM + one CJS entry in `dist/`. No subpath exports, no code splitting.
- **Pure SQLite storage.** FTS5 full-text search, CHECK-constrained state transitions, trigger-maintained indexes. Bring your own `DatabaseSync` instance.
- **Derived state.** Availability, blocking, deferral, overdue, and markers are computed at read time from fields and relationships, never stored as flags.
- **Intention-shaped writes.** `captureRumor`, `settleRumor`, `startQuest`, `finishQuest`, `abandonQuest` — operations that say what happened, not generic CRUD.
- **RFC 5545 recurrence.** Standard RRULE strings for recurring work. No custom recurrence format.
- **WoW-style markers.** Semantic marker IDs (`attention.available`, `progress.complete`, ...) computed on every read, renderable to any channel.
- **Colocated tests.** Every non-type module has a colocated `.test.ts` file. The behavior described in docs is backed by executable coverage.

## Package Surface

```ts
import {
  initQuestlogTables,  // schema setup
  read,                // all query functions
  write,               // all mutation functions
  tools,               // LLM tool definitions + registry
  skills,              // LLM workflow skills + registry
  soul,                // thinking foundation for system prompts
  markers,             // marker derivation and lookup
} from '@ghostpaw/questlog';
```

All domain types are also available at the root for TypeScript consumers:

```ts
import type {
  QuestlogDb,
  QuestState,
  QuestDetailRecord,
  CreateQuestInput,
  QuestlogSearchResult,
  QuestlogToolDefinition,
  QuestlogSkill,
  QuestlogSoul,
} from '@ghostpaw/questlog';
```

## Documentation

| Document | Audience |
|---|---|
| [HUMAN.md](docs/HUMAN.md) | Human developers using the low-level `read`/`write` API |
| [LLM.md](docs/LLM.md) | Agent builders wiring tools, skills, and soul into LLM systems |
| [docs/README.md](docs/README.md) | Architecture overview: model, invariants, lifecycle, markers |
| [docs/entities/](docs/entities/) | Per-entity manuals with exact public API listings |

## Development

```bash
npm install
npm test            # node:test runner
npm run typecheck   # tsc --noEmit
npm run lint        # biome check
npm run build       # ESM + CJS + declarations via tsup
```

The repo is pinned to **Node 24.14.0** via `.nvmrc` / `.node-version` / `.tool-versions` / `mise.toml` / Volta. Use whichever version manager you prefer.

### Support

If this package helps your project, consider sponsoring its maintenance:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

---

**[Anonyfox](https://anonyfox.com) • [MIT License](LICENSE)**
