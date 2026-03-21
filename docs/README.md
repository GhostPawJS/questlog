# Questlog Docs

This folder is the operator and implementer manual for Questlog.

The source of truth for the actual SQLite schema lives in code under the various
`init_*_tables.ts` files in `src/`. These docs intentionally do not repeat
column-by-column schema detail. Instead, they explain what each concept is for,
why it exists, how it is meant to be used, and which operation shapes fit it.

## What Questlog Is

Questlog is a SQLite-backed work model built around seven operator-facing
concepts:

- `Rumor`: non-committed intake
- `Questline`: shared context for related quests
- `Quest`: one concrete commitment
- `RepeatableQuest`: a recurring definition that spawns future quests
- `Unlock`: a hard prerequisite between concrete quests
- `Reward`: a descriptive acknowledgement attached to work
- `Tag`: a cross-cutting classification label

The schema is implemented in code, while the human meaning of the model lives in
these docs.

## Entity Manuals

These concept-level manuals live under `docs/entities/`:

- `entities/RUMORS.md`: intake records before commitment
- `entities/QUESTLINES.md`: grouping context for related work
- `entities/QUESTS.md`: concrete commitments and execution lifecycle
- `entities/REPEATABLE_QUESTS.md`: recurring templates that spawn future quests
- `entities/UNLOCKS.md`: hard prerequisite logic between concrete quests
- `entities/REWARDS.md`: descriptive rewards across concrete and recurring work
- `entities/TAGS.md`: classification and auto-tagging across concrete and recurring work

Exact public APIs for each concept live at the bottom of those entity manuals.

## How To Read The Model

Use the model in this order:

1. Capture uncertain or incoming work as a rumor.
2. Settle a rumor into a questline, concrete quests, or both when the work becomes real.
3. Use concrete quests for anything someone can actually start, do, and resolve.
4. Use repeatable quests when the same shape of work should keep reappearing over time.
5. Use unlocks only when one concrete quest must truly block another.
6. Use rewards and tags as descriptive layers on top of commitments, not as substitutes for them.

## Practical Guidance

- If the operator is still deciding whether something matters, it belongs in `rumors`.
- If the operator needs a real commitment with state, scheduling, effort, and outcome, it belongs in `quests`.
- If several quests share one narrative or deadline context, group them in `questlines`.
- If the same kind of quest should appear again next week or next month, define it in `repeatable_quests`.
- If a quest cannot be worked until another concrete quest succeeds, model that with unlocks.
- If an operator wants classification or reporting, use tags.
- If an operator wants descriptive recognition for completed work, use rewards.

## Lifecycle Truth

### Rumors

Rumor state is derived:

- open: not settled and not dismissed
- settled: settlement happened
- dismissed: explicit decline happened

Rumors are intake only. They are not pre-quests and they are not part of quest
execution state.

### Quests

Quest state is also derived:

- open: not started and not resolved
- in progress: started but not resolved
- done: resolved successfully
- abandoned: resolved unsuccessfully

Resolution is all-or-nothing: final outcome text, success, and terminal time must
agree.

### Questlines And Repeatables

- questlines are active unless archived or soft-deleted
- repeatable quests are active unless archived or soft-deleted
- repeatables never represent work directly; they only materialize concrete quests

## Core Invariants

- a quest objective is only safely editable before actual start
- planned time does not freeze objective text
- scheduled time never auto-starts a quest
- a quest belongs to at most one questline
- a quest may originate from a rumor, repeatable quest, follow-up quest, or nothing
- unlocks are directional and availability-affecting
- questlines group work but do not encode sequence
- recurrence creates new quest rows instead of reopening old ones
- recurring deduplication is based on repeatable origin plus anchor
- soft delete is the only deletion model in v1

## Temporal And Availability Semantics

- `due_at` is the latest acceptable completion moment
- `not_before_at` is the earliest actionable moment
- scheduled windows are planning hints, not execution state
- `started_at` is real start, not planned start
- `resolved_at` is real terminal completion
- `effort_seconds` is accumulated active effort, not wall-clock elapsed time

Effective due date is derived at read time:

- use the quest due date when present
- otherwise use the questline due date
- otherwise there is no deadline

A quest is available when:

- it is active
- it is unresolved
- its not-before time is not in the future
- every incoming unlock prerequisite resolved successfully

Missing a scheduled window is not the same thing as being overdue.

## Operation Philosophy

Questlog exposes intention-shaped writes, not generic CRUD.

The point is to let an operator say:

- capture this as intake
- turn this into real work
- start execution
- finish successfully
- make this recur
- block this behind that

That keeps system truth aligned with what actually happened.

## Public Surface

- `initQuestlogTables(db)`: initialize the full schema
- `src/index.ts`: full public surface
- `src/read.ts`: read-only surface
- `src/write.ts`: write-only surface
- `searchQuestlog(db, query)`: cross-entity full-text search

If you need exact public calls for a specific concept, use the corresponding
entity manual.

## Search And Recurrence Notes

Full-text search is currently indexed for:

- `rumors`
- `quests`

Questlines, repeatable definitions, rewards, and tags are still relational reads
today and are not part of the FTS corpus.

Under the hood:

- `rumors_fts` is an FTS5 virtual table backed by `rumors`
- `quests_fts` is an FTS5 virtual table backed by `quests`
- insert, update, and delete triggers keep the index synchronized
- soft-deleted rows are removed from the active search surface

The public cross-entity search call is:

- `searchQuestlog(db, query)`

The result shape is intentionally narrow:

- `entityKind`
- `entityId`
- `title`
- `snippet`

Behavioral notes:

- blank or whitespace-only queries return an empty result set
- only active base rows appear in results
- snippets come from indexed text, not from a separate cache
- search is currently cross-entity only for `rumors` and `quests`

Repeatable quests currently support:

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`
- `INTERVAL=n`
- `COUNT=n`
- `UNTIL=<parseable date>`
- `BYDAY=...` for weekly rules

## Code Source Of Truth

- `src/init_questlog_tables.ts`: schema composition
- `src/rumors/init_rumor_tables.ts`
- `src/questlines/init_questline_tables.ts`
- `src/quests/init_quest_tables.ts`
- `src/repeatable_quests/init_repeatable_quest_tables.ts`
- `src/unlocks/init_unlock_tables.ts`
- `src/rewards/init_reward_tables.ts`
- `src/tags/init_tag_tables.ts`

Read those files when you need exact table shape, constraints, or index detail.

## Explicit Non-Goals

- no XP engine
- no inventory or item mechanics
- no subgoal system
- no turn-in ceremony
- no embark flow
- no sync metadata
- no external-source reconciliation
- no audit log beyond present truth plus provenance in v1
- no soul, tool, or delegation logic inside Questlog itself

## Supplemental Docs

- `SOUL.md`: future quest-soul integration notes
- `RESEARCH.md`: broader design and rationale background

## Quality Bar

The codebase has colocated tests for every non-type module under `src/`, so the
behavior described in these docs is backed by executable coverage rather than
just prose.
