# `questlines`

## What It Is

`questlines` stores grouping context for related work.

A questline is not the work itself. It is the shared frame around several quests:
the campaign, initiative, milestone, launch, migration, audit, or season that
makes the child quests make sense together.

## Why It Exists

Operators often need more than a flat task list, but they do not always need a
full project-management system either.

`questlines` exist to provide shared context and honest rollups without
pretending every child quest is equivalent; that is the same intuition behind
Basecamp's argument that [raw progress context is more truthful than misleading
percent-complete abstractions](https://basecamp.com/hill-charts). Visible
progress also changes behavior: the
[goal-gradient effect](https://en.wikipedia.org/wiki/Goal_pursuit#Goal_gradient_effect)
shows that effort rises as completion feels nearer,
[endowed progress](https://doi.org/10.1086/500480) amplifies that effect, and
even a simple progress indicator can move completion rates sharply, as in the
[20% to 55% lift reported for LinkedIn profile completion](https://www.nirandfar.com/how-to-design-for-the-goal-gradient-effect/).

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

1. `write.createQuestline()` directly, or create one during `write.settleRumor()`.
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

- `write.createQuestline(db, input)`: create a new questline.
- `write.updateQuestline(db, questlineId, input)`: change title, description, or timing.
- `write.archiveQuestline(db, questlineId, archivedAt?)`: stop treating a questline as active.
- `write.moveQuestToQuestline(db, questId, questlineId, now?)`: attach a quest to a questline.
- `write.detachQuestFromQuestline(db, questId, now?)`: remove a quest from its questline.
- `write.softDeleteQuestline(db, questlineId, deletedAt?)`: hide a questline from normal active reads.

### Reads

- `read.getQuestlineDetail(db, questlineId, now?)`: load one questline with rollup stats.
- `read.listQuestlines(db, now?)`: list active questlines with aggregate progress.
