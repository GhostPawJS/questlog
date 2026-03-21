# Quest Faculty Spec

## Canonical Ontology

- `Rumor`: a non-committed intake item
- `Quest`: one real commitment with one objective and one terminal outcome
- `Questline`: a semantic grouping arc with optional shared due date
- `Unlock`: a hard prerequisite from one quest to another
- `RepeatableQuest`: a recurring definition that spawns concrete quests
- `QuestReward`: a generic reward attached to a concrete quest
- `Tags`: quest-only cross-cutting labels

## Lifecycle

### Rumors

Rumor state is derived, never stored:

- open: `settled_at IS NULL AND dismissed_at IS NULL`
- settled: `settled_at IS NOT NULL`
- dismissed: `dismissed_at IS NOT NULL`

Rumors are intake only. They are not pre-quests and they are not part of quest state.

### Quests

Quest state is derived, never stored:

- open: `started_at IS NULL AND resolved_at IS NULL`
- in progress: `started_at IS NOT NULL AND resolved_at IS NULL`
- done: `resolved_at IS NOT NULL AND success = 1`
- abandoned: `resolved_at IS NOT NULL AND success = 0`

Resolution requires `resolved_at`, `success`, and `outcome` together.

### Questlines

Questlines are not state-machine entities. They are active unless archived or soft-deleted.

### Repeatable Quests

Repeatable quests are active unless archived or soft-deleted. They never represent work directly. They only materialize concrete quests.

## Core Invariants

- a quest objective is mutable only before `started_at`
- planned time does not freeze objective text
- scheduled time never auto-starts a quest
- a quest may belong to at most one questline
- a quest may originate from a rumor, a repeatable quest, another quest, or none
- a reward belongs either to a quest or to a repeatable quest template table, never both
- unlocks are one-way only
- questlines do not encode sequence
- recurrence never mutates or reopens existing quest rows
- recurrence deduplication uses repeatable origin plus recurrence anchor
- soft delete is the only deletion model in v1

## Temporal Semantics

- `due_at`: latest acceptable completion moment
- `not_before_at`: earliest actionable moment
- `scheduled_start_at` / `scheduled_end_at`: planned time window
- `all_day`: date-scoped scheduled window flag
- `started_at`: actual start
- `resolved_at`: actual terminal end
- `effort_seconds`: accumulated active effort, not elapsed wall time

Effective due date is derived at read time:

- use quest `due_at` when present
- otherwise use questline `due_at`
- otherwise there is no effective deadline

Scheduled views and deadline views are separate. Missing a scheduled window does not itself make a quest overdue.

## Availability Semantics

A quest is available when:

- it is not soft-deleted
- it is not already resolved
- `not_before_at` is null or in the past
- every incoming unlock prerequisite resolved successfully

Availability is faculty-owned logic, not caller-owned logic.

## Reward Semantics

Rewards are generic descriptive records:

- `kind`: arbitrary downstream-defined string
- `name`: short label
- `description`: optional explanation
- `quantity`: optional non-negative numeric amount
- `claimed_at`: one-time claim timestamp

Claiming a reward is separate from resolving a quest, but the faculty only permits claims on successfully resolved quests.

## Tag Semantics

Tags are normalized by `normalized_name` and attached only to concrete quests in the runtime model.

Repeatable quests may carry tag templates. Spawned quests copy those templates at materialization time. Later template edits never rewrite existing spawned quests.

## Editing Policy

- use `reviseQuestObjective()` before actual start
- use `planQuestTime()` for temporal changes
- use `abandonQuestAndSpawnFollowups()` when reality changes after start
- do not mutate a started quest into a new truth

## Workflow Examples

### Intake to commitment

1. Capture a rumor.
2. Triage it with `settleRumor()`.
3. Optionally create a questline during settlement.
4. Spawn one or more quests linked to the rumor.

### Real-world course correction

1. Start a quest.
2. Discover the original objective is no longer truthful.
3. Abandon the quest with terminal outcome text.
4. Spawn one or more follow-up quests with provenance back to the abandoned quest.

### Recurring commitments

1. Create a repeatable quest definition with RRULE and offsets.
2. Add tag and reward templates if needed.
3. Periodically call `spawnDueRepeatableQuests(now)`.
4. Work the spawned concrete quests like any other quest.

## Explicit Non-Goals

- no XP engine
- no turn-in ceremony
- no inventory or item mechanics
- no subgoal system
- no embark flow
- no sync metadata
- no external-source reconciliation
- no audit log in v1 beyond present truth plus provenance
- no soul, tool, or delegation logic inside the faculty
