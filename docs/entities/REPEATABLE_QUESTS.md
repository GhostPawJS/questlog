# `repeatable_quests`

## What It Is

`repeatable_quests` stores recurring quest templates.

A repeatable quest is a definition for future work, not a record of work already
done. It describes the recurring shape that should produce new concrete quests
over time.

## Why It Exists

Recurring work needs different rules from one-off work.

Questlog uses standard recurrence semantics because
[RFC 5545](https://tools.ietf.org/html/rfc5545) already captures real-world
patterns, and practitioners keep converging on the same advice:
[do not invent recurrence formats from scratch](https://www.codegenes.net/blog/calendar-recurring-repeating-events-best-storage-method/).
RRULE is also [well-documented in implementation practice](https://wimonder.dev/posts/adding-recurrence-to-your-application),
which means the system can stay interoperable and understandable without a
Questlog-specific recurrence language.
The separate repeatable layer also protects history by letting future defaults
change without rewriting already spawned concrete work.

`repeatable_quests` exists so operators can define:

- what should recur
- when it should recur
- how timing offsets should be applied to each occurrence
- which default tags and rewards future spawned quests should receive

without rewriting the history of already spawned quest instances.

## How To Use It

Create a repeatable quest when the operator wants to say:

- "this type of work keeps coming back"
- "I want fresh quest instances for each occurrence"
- "future occurrences should inherit the same defaults"

Typical flow:

1. `createRepeatableQuest()` with title, objective, RRULE, and timing offsets.
2. Periodically call `spawnDueRepeatableQuests()`.
3. Work the resulting concrete quests as normal.
4. `updateRepeatableQuest()` when future occurrences should change.
5. `archiveRepeatableQuest()` when the series should stop generating new work.

## Good Uses

- weekly review
- monthly billing close
- recurring maintenance
- regular publishing cadence
- habit-like work that still deserves concrete execution records

## Do Not Use It For

- a quest that should simply stay open forever
- an idea that still needs triage
- retroactively changing already spawned work

Questlog deliberately creates new quest rows for each occurrence so history
stays truthful.

## Related Tables

- `quests`: spawned concrete instances
- `repeatable_quest_rewards`: reward templates for future spawns
- `repeatable_quest_tags`: tag templates for future spawns
- `questlines`: optional umbrella context for the series

## Public APIs

### Writes

- `createRepeatableQuest(db, input)`: define a new recurring quest template.
- `updateRepeatableQuest(db, repeatableQuestId, input)`: change future materialization behavior.
- `archiveRepeatableQuest(db, repeatableQuestId, archivedAt?)`: stop future spawning without deleting history.
- `spawnDueRepeatableQuests(db, now)`: materialize due recurring anchors into concrete quests.
- `softDeleteRepeatableQuest(db, repeatableQuestId, deletedAt?)`: hide a repeatable definition from normal active reads.

### Reads

- `listDueRepeatableQuestAnchors(db, now)`: preview which recurring anchors are currently due to spawn.
