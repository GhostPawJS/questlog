---
name: run-recurring-rhythms
description: Define and operate repeatable management work cleanly. Use when a cadence should spawn fresh concrete quests over time instead of living forever as one open item.
---

# Run Recurring Rhythms

## Instructions

1. Use `createRepeatableQuest(db, input)` for recurring reviews, closes, check-ins, audits, and rhythms.
2. Encode recurrence with RRULE, anchor time, and any offset timing that should apply to spawned quests.
3. Review due anchors with `listDueRepeatableQuestAnchors(db, now)` before materializing.
4. Materialize the work with `spawnDueRepeatableQuests(db, now)`.
5. Operate the spawned quests like normal concrete work.
6. Change future behavior with `updateRepeatableQuest(db, repeatableQuestId, input)` and stop future spawns with `archiveRepeatableQuest(...)`.

## Failure Paths

- If the work should recur but each occurrence needs its own history, do not reuse one standing quest.
- If the cadence changed, update the repeatable definition instead of manually creating ad hoc future quests.
- If the repeatable contains default rewards or tags, update the template, not old spawned instances.

## Do Not

- model recurring work as one immortal open quest
- assume repeatables auto-spawn without `spawnDueRepeatableQuests(...)`
- retroactively rewrite already spawned history
