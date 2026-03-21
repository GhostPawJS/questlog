---
name: plan-time-correctly
description: Set not-before, due, and schedule fields without mixing their meanings. Use when deferring work, expressing deadlines, or placing real calendar windows on quests.
---

# Plan Time Correctly

## Instructions

1. Use `planQuestTime(db, questId, input)` for all quest timing changes.
2. Keep the fields separate:
   - `notBeforeAt` = earliest actionable moment
   - `dueAt` = latest acceptable completion moment
   - `scheduledStartAt` / `scheduledEndAt` = planning window
3. Use `notBeforeAt` for deferral. There is no separate defer API.
4. Remember effective due logic: if a quest has no `dueAt`, reads may inherit due context from the questline.
5. Review the result with the right reads:
   - `listDeferredQuests(...)`
   - `listDueSoonQuests(...)`
   - `listOverdueQuests(...)`
   - `listScheduledNow(...)`
   - `listMissedScheduledQuests(...)`

## Failure Paths

- If work is merely lower priority, do not fake a defer date without reason.
- If a schedule window passes, do not assume the quest is overdue; inspect missed schedule separately.
- If the work is scheduled now, it still requires `startQuest(...)` for real execution.

## Do Not

- confuse schedule with execution state
- use due dates as a proxy for “maybe later”
- forget questline-level due inheritance in risk reviews
