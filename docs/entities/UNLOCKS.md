# Unlocks

## What They Are

Unlocks are the hard dependency model in Questlog.

They answer the question: "must this concrete quest stay unavailable until some
other concrete quest succeeds?" If the answer is yes, that relationship belongs
here.

## Why They Exist

Operators often need to distinguish between:

- soft preferred order
- shared project context
- true blocking prerequisites

Unlocks exist for the third case only. They let Questlog derive blocked vs
available work automatically instead of relying on people to remember invisible
dependencies.

## How To Use Them

Use unlocks when the operator means:

- "do not let this become available yet"
- "this work is genuinely gated by prior success"
- "the dependency should affect operational views"

Typical flow:

1. Create the concrete quests first.
2. Add the prerequisite edges with `addUnlock()` or `replaceUnlocks()`.
3. Let Questlog derive blocked and available states.
4. Remove the edge if the dependency was temporary or mistaken.

## Good Uses

- deploy only after approval succeeds
- publish only after review completes
- migrate only after backup is verified

## Do Not Use Them For

- loose planning preferences
- grouping related work
- recurring template behavior
- "remember to do this first" notes

Use questlines for grouping, quest text for soft guidance, and repeatable quests
for recurrence. Unlocks are only for hard gating.

## Under The Hood

This concept is stored in the `quest_unlocks` table.

Questlog models unlocks at the concrete quest level, not at the rumor,
questline, or repeatable-template level, because availability is ultimately a
property of work someone could actually do right now.

## Public APIs

### Writes

- `addUnlock(db, fromQuestId, toQuestId, now?)`: add one hard prerequisite edge.
- `removeUnlock(db, fromQuestId, toQuestId, now?)`: remove one prerequisite edge.
- `replaceUnlocks(db, toQuestId, fromQuestIds, now?)`: replace the full blocker set for a target quest.

### Reads

- There is no dedicated unlock read surface.
- Use quest views such as `listAvailableQuests()` and `listBlockedQuests()` to see unlock effects operationally.
