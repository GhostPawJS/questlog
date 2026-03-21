---
name: run-operational-review
description: Drive management from Questlog read surfaces instead of memory. Use in daily or weekly review to inspect what is available, blocked, deferred, scheduled, overdue, and resolved.
---

# Run Operational Review

## Instructions

1. Start from reads, not from chat memory or personal intuition.
2. Pull the operational slices that match the review:
   - `listAvailableQuests(...)`
   - `listBlockedQuests(...)`
   - `listDeferredQuests(...)`
   - `listDueSoonQuests(...)`
   - `listOverdueQuests(...)`
   - `listScheduledNow(...)`
   - `listMissedScheduledQuests(...)`
   - `listResolvedQuests(...)`
3. Review initiative health with `listQuestlines(db, now?)` and `getQuestlineDetail(db, questlineId, now?)`.
4. Use filtered reads by `questlineId` or `tagNames` when reviewing only one stream.
5. End the review with actual writes: reschedule, defer, unblock, close, or clarify.

## Failure Paths

- If the review produces only observations, it is incomplete; convert conclusions into state changes.
- If a quest is resolved but still showing a yellow `?`, inspect unclaimed rewards before assuming closure.
- If something is missing from search, remember that FTS only covers rumors and quests.

## Do Not

- run portfolio review from one giant unfiltered list
- confuse missed schedule with overdue
- leave blocked items unexamined after the review
