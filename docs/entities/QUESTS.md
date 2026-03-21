# `quests`

## What It Is

`quests` is the core table of Questlog.

A quest is one concrete commitment: something a real operator can start, work,
finish, abandon, defer, schedule, and measure.

## Why It Exists

Questlog treats execution as a first-class thing, not just a checklist row.

That is deliberate: splitting commitments across separate task and calendar
systems creates [context-switching overhead](https://akiflow.com/blog/calendar-task-management-integration-productivity),
including roughly six lost hours a week and refocus times around 23 minutes
after interruptions,
while forcing every obligation into a calendar-shaped object encourages the
well-known [calendar trap](https://paperlessmovement.com/articles/the-calendar-trap-why-your-task-management-system-needs-a-complete-overhaul).
`quests` is where real work gets one truthful record with optional temporal
context instead of competing object types.

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

1. `write.createQuest()` directly or through `write.settleRumor()` or recurrence spawning.
2. `write.planQuestTime()` to set not-before, due, or scheduled windows.
3. `write.startQuest()` when execution truly begins.
4. `write.logQuestEffort()` as work happens.
5. `write.finishQuest()` or `write.abandonQuest()` when the work resolves.

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

Quests track **commitments and events** — not knowledge, not relationships, not
procedures, not conversation history. If the information answers "what is
happening or what needs doing?" it belongs in a quest. If it answers "what do we
know?", "who is involved?", or "how do we do this?" it belongs in another
subsystem.

## Operator Notes

- Starting a quest is the moment the objective becomes execution truth.
- Scheduling a quest does not auto-start it.
- Resolved quests keep their history; recurring work creates new quests instead
  of reopening old ones.
- Availability is derived, not manually toggled.

## Marker Notes

Quest reads expose a computed `markerId` so UIs can render WoW-style semantics
without re-deriving status rules:

- `attention.available`: the quest is open and available now
- `attention.available.future`: the quest is open but deferred by `not_before_at`
- `progress.incomplete`: the quest is blocked by prerequisites or already in progress
- `progress.complete`: the quest is done and still has at least one active unclaimed reward
- `null`: no WoW-style marker is correct, such as an abandoned quest

These markers are derived from quest state, availability rules, and reward claim
state, never stored. A done quest with no active rewards, or with all active
rewards already claimed, does not keep the yellow `?`.

## Related Tables

- `rumors`: intake source
- `questlines`: optional grouping context
- `repeatable_quests`: optional recurrence source
- `quest_unlocks`: blocking prerequisites
- `quest_rewards`: descriptive rewards on completed work
- `quest_tags`: classification links for filtering and reporting

## Public APIs

### Writes

- `write.createQuest(db, input)`: create one concrete quest.
- `write.reviseQuestObjective(db, questId, objective, now?)`: edit the objective before actual start.
- `write.planQuestTime(db, questId, input)`: set or change due, defer, and schedule fields.
- `write.startQuest(db, questId, startedAt?)`: begin execution.
- `write.logQuestEffort(db, questId, effortSeconds, now?)`: add effort after start.
- `write.finishQuest(db, questId, outcome, resolvedAt?)`: resolve successfully.
- `write.abandonQuest(db, questId, outcome, resolvedAt?)`: resolve unsuccessfully.
- `write.abandonQuestAndSpawnFollowups(db, questId, outcome, followups, resolvedAt?)`: abandon and create successor quests atomically.
- `write.softDeleteQuest(db, questId, deletedAt?)`: hide a quest from normal active reads.

### Reads

- `read.getQuestDetail(db, questId, now?)`: load one quest with derived state and related detail.
- `read.listOpenQuests(db, filters?, now?)`: list unresolved quests that have not started.
- `read.listInProgressQuests(db, filters?, now?)`: list started but unresolved quests.
- `read.listActiveQuests(db, filters?, now?)`: list unresolved quests whether open or in progress.
- `read.listAvailableQuests(db, filters?, now?)`: list unresolved quests currently available to work on.
- `read.listBlockedQuests(db, filters?, now?)`: list unresolved quests blocked by unlocks.
- `read.listDeferredQuests(db, filters?, now?)`: list unresolved quests deferred into the future.
- `read.listResolvedQuests(db, filters?, now?)`: list finished or abandoned quests.
- `read.listOverdueQuests(db, filters?, now?)`: list unresolved quests past their effective due date.
- `read.listDueSoonQuests(db, horizonMs, filters?, now?)`: list unresolved quests due within a near horizon.
- `read.listScheduledForDay(db, dayStart, dayEnd, filters?, now?)`: list quests whose schedule overlaps a day window.
- `read.listScheduledNow(db, filters?, now?)`: list quests scheduled right now.
- `read.listMissedScheduledQuests(db, filters?, now?)`: list unresolved quests whose scheduled window has already passed.
