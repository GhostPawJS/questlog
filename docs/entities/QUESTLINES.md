# `questlines`

## What It Is

`questlines` stores grouping context for related work.

A questline is not the work itself. It is the shared frame around several quests:
the campaign, initiative, milestone, launch, migration, audit, or season that
makes the child quests make sense together.

## Why It Exists

Operators often need more than a flat task list, but they do not always need a
full project-management system either.

`questlines` exists to give you:

- one place for the shared title and description of a body of work
- optional shared time context such as a common due horizon
- progress rollups across child quests
- a durable connection back to the rumor that originated the work

## How To Use It

Create a questline when the operator wants to say:

- "these quests belong to the same arc"
- "this initiative needs one umbrella context"
- "I want rollup progress instead of scattered tasks"

Typical flow:

1. `createQuestline()` directly, or create one during `settleRumor()`.
2. Add or move quests into it.
3. Update the title, description, or shared timing as the arc becomes clearer.
4. Archive it when the grouping is no longer active but still worth preserving.

## Good Uses

- release week with several concrete deliverables
- a hiring loop with sourcing, screening, and offer steps
- a home project with multiple discrete jobs
- a recurring area of responsibility that also contains repeatable templates

## Do Not Use It For

- a single actionable work item
- a dependency graph
- a status bucket like "doing" or "later"

If someone can directly start it, it should be a quest. If one quest truly
blocks another, use `quest_unlocks`.

## Related Tables

- `rumors`: questlines can be born from intake
- `quests`: questlines group concrete work
- `repeatable_quests`: recurring templates can also live under a questline

## Public APIs

### Writes

- `createQuestline(db, input)`: create a new questline.
- `updateQuestline(db, questlineId, input)`: change title, description, or timing.
- `archiveQuestline(db, questlineId, archivedAt?)`: stop treating a questline as active.
- `moveQuestToQuestline(db, questId, questlineId, now?)`: attach a quest to a questline.
- `detachQuestFromQuestline(db, questId, now?)`: remove a quest from its questline.
- `softDeleteQuestline(db, questlineId, deletedAt?)`: hide a questline from normal active reads.

### Reads

- `getQuestlineDetail(db, questlineId, now?)`: load one questline with rollup stats.
- `listQuestlines(db, now?)`: list active questlines with aggregate progress.
