# `quests`

## What It Is

`quests` is the core table of Questlog.

A quest is one concrete commitment: something a real operator can start, work,
finish, abandon, defer, schedule, and measure.

## Why It Exists

Questlog treats execution as a first-class thing, not just a checklist row.

`quests` exists so one record can hold:

- the commitment itself
- current lifecycle truth
- scheduling and due context
- actual effort
- final outcome
- provenance from rumors, questlines, repeatables, or follow-up chains

## How To Use It

Create a quest when the operator wants to say:

- "this is real now"
- "someone can start this"
- "we need to track execution and outcome"

Typical flow:

1. `createQuest()` directly or through `settleRumor()` or recurrence spawning.
2. `planQuestTime()` to set not-before, due, or scheduled windows.
3. `startQuest()` when execution truly begins.
4. `logQuestEffort()` as work happens.
5. `finishQuest()` or `abandonQuest()` when the work resolves.

## Good Uses

- write and ship a release note
- call a vendor
- audit a system
- complete one recurring maintenance action
- perform one follow-up created by a failed or incomplete quest

## Do Not Use It For

- ideas that still need triage
- reusable recurrence templates
- grouping context for many quests
- labels or rewards

Those belong in `rumors`, `repeatable_quests`, `questlines`, `tags`, and
`quest_rewards`.

## Operator Notes

- Starting a quest is the moment the objective becomes execution truth.
- Scheduling a quest does not auto-start it.
- Resolved quests keep their history; recurring work creates new quests instead
  of reopening old ones.
- Availability is derived, not manually toggled.

## Related Tables

- `rumors`: intake source
- `questlines`: optional grouping context
- `repeatable_quests`: optional recurrence source
- `quest_unlocks`: blocking prerequisites
- `quest_rewards`: descriptive rewards on completed work
- `quest_tags`: classification links for filtering and reporting

## Public APIs

### Writes

- `createQuest(db, input)`: create one concrete quest.
- `reviseQuestObjective(db, questId, objective, now?)`: edit the objective before actual start.
- `planQuestTime(db, questId, input)`: set or change due, defer, and schedule fields.
- `startQuest(db, questId, startedAt?)`: begin execution.
- `logQuestEffort(db, questId, effortSeconds, now?)`: add effort after start.
- `finishQuest(db, questId, outcome, resolvedAt?)`: resolve successfully.
- `abandonQuest(db, questId, outcome, resolvedAt?)`: resolve unsuccessfully.
- `abandonQuestAndSpawnFollowups(db, questId, outcome, followups, resolvedAt?)`: abandon and create successor quests atomically.
- `softDeleteQuest(db, questId, deletedAt?)`: hide a quest from normal active reads.

### Reads

- `getQuestDetail(db, questId, now?)`: load one quest with derived state and related detail.
- `listOpenQuests(db, filters?, now?)`: list unresolved quests that have not started.
- `listInProgressQuests(db, filters?, now?)`: list started but unresolved quests.
- `listActiveQuests(db, filters?, now?)`: list unresolved quests whether open or in progress.
- `listAvailableQuests(db, filters?, now?)`: list unresolved quests currently available to work on.
- `listBlockedQuests(db, filters?, now?)`: list unresolved quests blocked by unlocks.
- `listDeferredQuests(db, filters?, now?)`: list unresolved quests deferred into the future.
- `listResolvedQuests(db, filters?, now?)`: list finished or abandoned quests.
- `listOverdueQuests(db, filters?, now?)`: list unresolved quests past their effective due date.
- `listDueSoonQuests(db, horizonMs, filters?, now?)`: list unresolved quests due within a near horizon.
- `listScheduledForDay(db, dayStart, dayEnd, filters?, now?)`: list quests whose schedule overlaps a day window.
- `listScheduledNow(db, filters?, now?)`: list quests scheduled right now.
- `listMissedScheduledQuests(db, filters?, now?)`: list unresolved quests whose scheduled window has already passed.
