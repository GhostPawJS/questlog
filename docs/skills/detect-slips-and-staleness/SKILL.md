---
name: detect-slips-and-staleness
description: Detect silent slips, stale work, and items that need revalidation. Use when work is aging, drifting, still open too long, or no longer trustworthy as originally described.
---

# Detect Slips And Staleness

## Instructions

1. Look for drift through reads, not vibes:
   - `listDueSoonQuests(...)`
   - `listOverdueQuests(...)`
   - `listMissedScheduledQuests(...)`
   - `listInProgressQuests(...)`
   - `listDeferredQuests(...)`
2. Treat aging work as suspect. Open items that are old, repeatedly deferred, or unscheduled after long silence need revalidation.
3. Inspect the exact quest with `getQuestDetail(db, questId, now?)` before acting.
4. Choose one recovery move:
   - keep and reschedule
   - defer intentionally with `planQuestTime(...)`
   - unblock it
   - abandon and replace it
   - return uncertainty to a rumor if the work was never really ready

## Failure Paths

- If work is “not blocked” but still not moving, assume hidden ambiguity, ownership trouble, or bad shape until proven otherwise.
- If the objective no longer matches reality, do not keep dragging the old quest forward.
- If the delay comes from an approval or external promise, hand off to that skill instead of treating it as generic lateness.

## Do Not

- treat old open work as healthy by default
- keep stale items alive only because they once felt important
- use defer dates to hide dead work forever
