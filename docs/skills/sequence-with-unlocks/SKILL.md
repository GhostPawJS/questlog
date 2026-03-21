---
name: sequence-with-unlocks
description: Model true hard dependencies and availability gates. Use when one quest must stay unavailable until another concrete quest succeeds, and soft ordering is not enough.
---

# Sequence With Unlocks

## Instructions

1. Confirm the dependency is real. Use unlocks only when availability must change, not when order is merely preferred.
2. Create the concrete quests first.
3. Add gates with:
   - `addUnlock(db, fromQuestId, toQuestId, now?)`
   - `replaceUnlocks(db, toQuestId, fromQuestIds, now?)` when resetting the full blocker set
4. Verify the operational effect through:
   - `listBlockedQuests(db, filters?, now?)`
   - `listAvailableQuests(db, filters?, now?)`
   - `getQuestDetail(db, questId, now?)`
5. Remove obsolete gates with `removeUnlock(db, fromQuestId, toQuestId, now?)`.

## Failure Paths

- If the dependency is only informational, put it in text or planning notes instead of unlocks.
- If questline order is doing hidden dependency work, replace that assumption with explicit unlocks.
- If dependency surgery is broad, use `replaceUnlocks()` rather than a long brittle sequence of adds and removes.

## Do Not

- use unlocks for soft preference
- assume questline membership implies sequence
- ignore cycle or self-dependency errors
