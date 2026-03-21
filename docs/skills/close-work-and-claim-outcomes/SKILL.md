---
name: close-work-and-claim-outcomes
description: Finish work completely and close the loop honestly. Use when a quest is done, abandoned, or near completion and the manager must ensure outcomes, rewards, and follow-through are fully captured.
---

# Close Work And Claim Outcomes

## Instructions

1. Decide whether the work succeeded, failed, or is still unresolved.
2. Use the real terminal write:
   - `finishQuest(db, questId, outcome, resolvedAt?)`
   - `abandonQuest(db, questId, outcome, resolvedAt?)`
   - `abandonQuestAndSpawnFollowups(...)` when failure creates the next work immediately
3. If rewards exist, inspect them through `getQuestDetail(...)`.
4. Claim earned rewards with `claimQuestReward(db, rewardId, claimedAt?)` only when they are truly realized.
5. Review whether closure also needs a follow-up quest, a questline archive, or a stakeholder update.
6. Confirm closure by checking `listResolvedQuests(...)` and the quest marker state.

## Failure Paths

- If a quest is “basically done” but still needs communication, reward claiming, or successor planning, it is not fully closed.
- If the quest is done but still shows a yellow `?`, inspect unclaimed rewards before assuming closure is complete.
- If the outcome changed the portfolio, create the next work explicitly instead of hiding it in the outcome text.

## Do Not

- leave terminal truth only in chat
- abandon work just to make it disappear
- treat reward claiming as automatic when it is a real separate event
