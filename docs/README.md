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

## Why This Model Exists

Questlog exists because agents and humans both pay a cost when commitments are
split across separate tools and mental buckets. Microsoft's
[CORPGEN](https://www.microsoft.com/en-us/research/publication/corpgen-simulating-corporate-environments-with-autonomous-digital-employees-in-multi-horizon-task-environments/)
calls out context saturation, memory interference, dependency complexity, and
reprioritization overhead as recurring failure modes in multi-horizon work, and
people using separate calendar and task tools lose
[roughly six hours a week to context switching](https://akiflow.com/blog/calendar-task-management-integration-productivity),
with average refocus times of about 23 minutes after interruptions.

The answer here is not "more views." It is one coherent temporal model. That is
why concrete quests can carry due dates, defer dates, scheduled windows, and
recurrence context without becoming separate object types, and why Questlog
refuses the common trap where
[tasks are forced into calendar slots they do not deserve](https://paperlessmovement.com/articles/the-calendar-trap-why-your-task-management-system-needs-a-complete-overhaul).
Time-anchored structured records also change what an agent can actually reason
about: recent work on temporal knowledge graphs reports
[94.8% deep-memory retrieval accuracy and an 18.5% temporal-reasoning improvement](https://arxiv.org/html/2501.13956v1)
when facts are anchored in time instead of left as loose text.

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

The model is intentionally strict about this separation because LLMs are
notoriously unreliable at temporal reasoning without structured help; recent
benchmarks report only
[34.5% accuracy without tools and 95.31% with tool augmentation](https://arxiv.org/abs/2511.09993).
Questlog gives that structure a stable home in SQLite instead of pushing the
whole burden back into prompts and memory.

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

## Marker Semantics

Questlog also computes a small WoW-style marker layer for the read surfaces where
at-a-glance action state matters:

- `rumors`
- quest detail and quest list reads
- repeatable due-anchor reads
- `searchQuestlog()`

The rules are strict:

- marker ids are computed at read time, never stored in SQLite
- marker ids are semantic and channel-neutral, not raw HTML snippets
- visual rendering comes from one lookup in code, so HTML, TTY, and future outputs stay aligned
- Questlog borrows WoW-style quest-giver and turn-in semantics only, not WoW quest difficulty colors

Canonical mapping:

- `attention.available`: yellow `!`
- `attention.available.repeatable`: blue `!`
- `attention.available.future`: gray `!`
- `progress.incomplete`: gray `?`
- `progress.complete`: yellow `?`

This means "newly actionable," "recurring and due," "not yet available,"
"work exists but is not complete," and "turn-in pending" can all be shown
without pushing presentation rules into domain code.

For quests specifically, `progress.complete` is intentionally narrower than
"done": it appears only when a quest is successfully resolved and still has at
least one active unclaimed reward. Once all active rewards are claimed, or if a
done quest has no active rewards at all, the yellow `?` disappears.

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
- `src/tools/index.ts`: additive LLM-oriented tool facade with runtime metadata, JSON-Schema-compatible input schemas, and adapter helpers
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
- `markerId`

Behavioral notes:

- blank or whitespace-only queries return an empty result set
- only active base rows appear in results
- snippets come from indexed text, not from a separate cache
- search is currently cross-entity only for `rumors` and `quests`

That matters beyond lookup convenience. Research on
[autonomous task scheduling for agents](https://zylos.ai/research/2026-02-16-autonomous-task-scheduling-ai-agents)
keeps converging on the same point: temporal triggers and cheap machine-readable
state are foundational for proactive behavior. Search and temporal structure are
part of the same reliability story.

Repeatable quests currently support:

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`
- `INTERVAL=n`
- `COUNT=n`
- `UNTIL=<parseable date>`
- `BYDAY=...` for weekly rules

Questlog uses standard recurrence syntax because
[RFC 5545](https://tools.ietf.org/html/rfc5545) already solved the hard cases,
and recurring-work practitioners keep reaching the same conclusion:
[do not invent your own recurrence language](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/).

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

- `USAGE.md`: end-to-end practical manager playbook
- `SOUL.md`: future quest-soul integration notes
- `SKILLS.md`: runtime-facing overview of Questlog's exported skill surface
- `TOOLS.md`: guidance for designing LLM-facing tools well, including schema, clarification, and recovery contracts
- `RESEARCH.md`: broader design and rationale background

## Quality Bar

The codebase has colocated tests for every non-type module under `src/`, so the
behavior described in these docs is backed by executable coverage rather than
just prose.

Relative imports in source use explicit `.ts` specifiers (and `*/index.ts` for
package-style barrels) so Node can load and test TypeScript directly with
`--experimental-strip-types`, without a separate TypeScript execution shim.
