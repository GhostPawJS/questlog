---
name: frame-initiative-questline
description: Create and manage initiative context with questlines. Use when work needs a shared umbrella, rollup visibility, or one narrative arc across multiple concrete quests.
---

# Frame Initiative Questline

## Instructions

1. Use a questline when several quests belong to the same initiative, campaign, launch, hiring loop, or renewal.
2. Create it with `createQuestline(db, input)` or as part of `settleRumor(db, rumorId, input)`.
3. Put shared framing in the questline:
   - title
   - description
   - shared due context when appropriate
4. Put executable steps in quests and attach them with `moveQuestToQuestline(db, questId, questlineId, now?)`.
5. Review initiative health with `listQuestlines(db, now?)` and `getQuestlineDetail(db, questlineId, now?)`.
6. Use `updateQuestline(db, questlineId, input)` as the initiative evolves.
7. Retire the arc with `archiveQuestline(db, questlineId, archivedAt?)` when active management is over.

## Failure Paths

- If the questline is only one task, collapse back to a quest.
- If you need sequence, add unlocks between quests. Questlines provide context, not order.
- If a quest no longer belongs in the arc, use `detachQuestFromQuestline(db, questId, now?)` instead of faking status changes.

## Do Not

- use questlines as Kanban columns
- treat questline order as dependency logic
- archive a questline just because one child quest slipped
